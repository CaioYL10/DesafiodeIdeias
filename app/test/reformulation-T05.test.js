const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const { openDatabase } = require('../src/db/database');
const { createIngestionService } = require('../src/services/feedback-ingestion');
const { getDemoFeedbacks } = require('../src/services/demo-feedback-source');
const { createRelationshipAnalysis } = require('../src/services/relationship-analysis');
const { createSession } = require('../src/security/sessions');
const { createApp } = require('../src/app');
function setup(db) {
  db.exec("INSERT INTO managers VALUES (1, 'gestor@example.test', 's', 'h', '2026-01-01');");
  const ing = createIngestionService(db); const items = getDemoFeedbacks();
  const first = ing.ingestOne(items[0]); const mixed = ing.ingestOne(items[1]); const technical = ing.ingestOne(items[4]);
  db.prepare("INSERT INTO client_interactions(client_id, type, occurred_at, summary, created_at, updated_at) VALUES (?, 'contato', '2026-10-01T12:00:00.000Z', 'Falta de retorno', '2026-10-01', '2026-10-01')").run(first.clientId);
  return { ing, items, first, mixed, technical };
}
test('sinais relacionais determinísticos preservam evidência e excluem técnico', () => {
  const db = openDatabase(':memory:');
  try {
    const { ing, items, first, mixed, technical } = setup(db); const service = createRelationshipAnalysis(db);
    const result = service.analyze(first.clientId); assert.equal(result.length, 1); const h = result[0];
    assert.equal(h.status, 'pending'); assert.equal(h.client_id, first.clientId);
    assert.deepEqual(h.evidence.map(x => x.feedback_id), [first.feedbackId, mixed.feedbackId]);
    assert.equal(h.evidence[1].technical_reference, items[1].technicalReference);
    assert.equal(h.interactions.length, 1); assert.equal(h.period_start, '2026-10-01T12:00:00.000Z');
    assert.ok(h.criterion && h.limitations); assert.deepEqual(service.analyze(first.clientId), result);
    assert.ok(!h.evidence.some(x => x.feedback_id === technical.feedbackId));
    const other = ing.ingestOne({ ...items[4], externalEventId: 'only-tech', externalClientId: 'new-tech', client: {name:'Outro', cnpj:'11444777000161'}, comment:'não recebemos retorno' });
    assert.deepEqual(service.analyze(other.clientId), []);
    const mixedNoSignal = ing.ingestOne({ ...items[1], externalEventId:'mixed-no-signal', comment:'Oscilação técnica', externalClientId:'new-tech', client:{name:'Outro', cnpj:'11444777000161'}, technicalReference:'sem retorno' });
    assert.equal(mixedNoSignal.clientId, other.clientId); assert.deepEqual(service.analyze(other.clientId), []);
    assert.throws(() => db.prepare('UPDATE imported_feedbacks SET client_id = ? WHERE feedback_id = ?').run(other.clientId, first.feedbackId));
    assert.throws(() => db.prepare("INSERT INTO feedback_context(feedback_id,client_id,kind,manager_id,updated_at) VALUES (?, ?, 'feedback', 1, '2026')").run(first.feedbackId, other.clientId));
    assert.throws(() => db.prepare('DELETE FROM relationship_evidence WHERE hypothesis_id = ?').run(h.id));
  } finally { db.close(); }
});
test('ajuste e decisão guardam histórico imutável e validam transições', () => {
  const db = openDatabase(':memory:'); try {
    const { first } = setup(db); const service = createRelationshipAnalysis(db); const h = service.analyze(first.clientId)[0];
    assert.equal(service.review(h.id, {status:'confirmed', justification:' '}, 1).code, 400);
    assert.equal(service.review(h.id, {status:'confirmed', justification:'ok'}, 999).code, 403);
    const adjusted = service.review(h.id, {status:'adjusted', justification:'Revisado', description:'Hipótese revisada'}, 1);
    assert.equal(adjusted.status, 'adjusted'); assert.equal(adjusted.decisions[0].previous_description, h.description);
    assert.deepEqual(adjusted.evidence, h.evidence); assert.equal(adjusted.decisions[0].manager_id, 1); assert.ok(adjusted.decisions[0].created_at);
    const confirmed = service.review(h.id, {status:'confirmed', justification:'Evidências conferidas'}, 1);
    assert.equal(confirmed.status, 'confirmed'); assert.equal(confirmed.decisions.length, 2);
    assert.equal(service.review(h.id, {status:'rejected', justification:'tarde'}, 1).code, 409);
    assert.throws(() => db.exec('DELETE FROM relationship_decisions'));
    const second = setupSecond(db); const rejected = service.review(second.id, {status:'rejected', justification:'Não se aplica'}, 1);
    assert.equal(rejected.status, 'rejected'); assert.equal(service.review(second.id, {status:'confirmed', justification:'tarde'}, 1).code, 409);
  } finally { db.close(); }
});
function setupSecond(db) {
  const item = { ...getDemoFeedbacks()[0], externalEventId:'second', externalClientId:'second', client:{name:'Segundo', cnpj:'11444777000161'} };
  const added = createIngestionService(db).ingestOne(item); return createRelationshipAnalysis(db).analyze(added.clientId)[0];
}
test('rotas exigem sessão, validam entrada e expõem decisões ao reiniciar', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cti-t05-')); t.after(() => fs.rmSync(dir, {recursive:true, force:true}));
  const file = path.join(dir, 'db.sqlite'); let db = openDatabase(file); const {first} = setup(db);
  let server = createApp({database:db}).listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`; const cookie = `cti_manager_session=${createSession(db,1).token}`;
  const call = (p, method='GET', body, auth=true) => fetch(url+p, {method, headers:{...(auth ? {cookie}:{}), 'content-type':'application/json'}, ...(body ? {body:JSON.stringify(body)} : {})});
  try {
    assert.equal((await call('/api/manager/relationships','GET',null,false)).status,401);
    assert.equal((await call('/api/manager/relationships/analyze','POST',{clientId:first.clientId},false)).status,401);
    assert.equal((await call('/api/manager/relationships/analyze','POST',{clientId:'1'})).status,400);
    const result = await (await call('/api/manager/relationships/analyze','POST',{clientId:first.clientId})).json(); const id = result.items[0].id;
    assert.equal((await call(`/api/manager/relationships/${id}/review`,'POST',{status:'confirmed',justification:'ok'},false)).status,401);
    assert.equal((await call(`/api/manager/relationships/${id}/review`,'POST',{status:'confirmed',justification:'Conferido'})).status,200);
    assert.equal((await call('/feedback')).status,404);
    await new Promise(resolve => server.close(resolve)); db.close(); db = openDatabase(file);
    const h = createRelationshipAnalysis(db).get(id); assert.equal(h.status,'confirmed'); assert.equal(h.decisions[0].actor,'gestor@example.test');
    assert.equal(createRelationshipAnalysis(db).analyze(first.clientId)[0].id,id);
  } finally { if (server.listening) await new Promise(resolve => server.close(resolve)); db.close(); }
});

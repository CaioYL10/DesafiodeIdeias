const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { openDatabase } = require('../src/db/database');
const { createIngestionService } = require('../src/services/feedback-ingestion');
const { getDemoFeedbacks } = require('../src/services/demo-feedback-source');
const count = (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;

test('lote fictício separa dimensões, repetições, conflitos e itens inválidos', () => {
  const db = openDatabase(':memory:');
  try {
    const service = createIngestionService(db);
    const results = service.ingestBatch(getDemoFeedbacks());
    assert.deepEqual(results.map(x => x.status), ['imported', 'imported', 'duplicate', 'pending', 'imported', 'imported', 'error']);
    assert.equal(results[0].clientId, results[1].clientId);
    assert.equal(count(db, 'clients'), 2);
    assert.equal(count(db, 'feedbacks'), 5);
    const rows = db.prepare('SELECT * FROM feedback_overview ORDER BY id').all();
    assert.deepEqual(rows.map(r => r.dimension), ['relationship', 'mixed', 'relationship', 'technical', 'relationship']);
    assert.equal(rows[1].technical_reference, 'ticket técnico fictício T-2');
    assert.equal(rows[0].external_classification, 'prioridade informada pela origem');
    assert.equal(rows[0].sentiment, null);
    assert.equal(rows[2].client_id, null);
    assert.equal(rows[2].identity_status, 'pending');
    assert.equal(service.listPending().length, 1);
  } finally { db.close(); }
});

test('falha de item reverte cliente e permite retomada preservando decisões', () => {
  const db = openDatabase(':memory:');
  try {
    const service = createIngestionService(db);
    const [first, second] = getDemoFeedbacks();
    db.exec("CREATE TRIGGER fail_import BEFORE INSERT ON imported_feedbacks BEGIN SELECT RAISE(ABORT, 'falha simulada'); END");
    assert.equal(service.ingestBatch([first])[0].status, 'error');
    assert.equal(count(db, 'clients'), 0); assert.equal(count(db, 'feedbacks'), 0);
    db.exec('DROP TRIGGER fail_import');
    const imported = service.ingestOne(first);
    db.prepare("UPDATE clients SET name = 'Nome interno', account_owner = 'Gestora' WHERE id = ?").run(imported.clientId);
    db.prepare("UPDATE feedbacks SET handling_status = 'resolved' WHERE id = ?").run(imported.feedbackId);
    assert.equal(service.ingestOne({ ...first, comment: 'Alteração externa posterior' }).status, 'duplicate');
    assert.equal(service.ingestOne(second).clientId, imported.clientId);
    assert.equal(db.prepare('SELECT name FROM clients').get().name, 'Nome interno');
    assert.equal(db.prepare('SELECT handling_status, comment FROM feedbacks WHERE id = ?').get(imported.feedbackId).handling_status, 'resolved');
    assert.equal(db.prepare('SELECT comment FROM feedbacks WHERE id = ?').get(imported.feedbackId).comment, first.comment);
  } finally { db.close(); }
});

test('revisão exige gestor e justificativa, registra decisão e não altera vínculo anterior', () => {
  const db = openDatabase(':memory:');
  try {
    db.prepare("INSERT INTO managers VALUES (1, 'gestor@exemplo.test', 'sal', 'hash', '2026-01-01')").run();
    const service = createIngestionService(db); const items = getDemoFeedbacks();
    const first = service.ingestOne(items[0]); service.ingestOne(items[3]);
    const pending = service.listPending()[0];
    assert.throws(() => service.review(pending.id, { managerId: 2, action: 'link', clientId: first.clientId, justification: 'Conferido' }));
    assert.throws(() => service.review(pending.id, { managerId: 1, action: 'link', clientId: first.clientId, justification: ' ' }));
    assert.equal(service.review(pending.id, { managerId: 1, action: 'link', clientId: first.clientId, justification: 'Conferido' }).status, 'linked');
    assert.equal(db.prepare('SELECT reviewed_by FROM identity_pending').get().reviewed_by, 1);
    assert.equal(service.ingestOne(items[3]).status, 'duplicate');
    assert.throws(() => service.review(pending.id, { managerId: 1, action: 'reject', justification: 'Outra decisão' }));
  } finally { db.close(); }
});

test('arquivo legado conserva dados e importação após reinício', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cti-t02-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'legacy.sqlite'); const old = new DatabaseSync(file);
  old.exec("CREATE TABLE clients(id INTEGER PRIMARY KEY, name TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL); INSERT INTO clients VALUES(1, 'Manual', '', '2026-01-01'); CREATE TABLE feedbacks(id INTEGER PRIMARY KEY, service TEXT NOT NULL, rating INTEGER NOT NULL, comment TEXT NOT NULL, demo_data INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, sentiment TEXT, sentiment_status TEXT NOT NULL DEFAULT 'pending', handling_status TEXT NOT NULL DEFAULT 'new'); INSERT INTO feedbacks VALUES(1, 'cloud', 4, 'Legado', 0, '2026-01-01', NULL, 'pending', 'new');"); old.close();
  let db = openDatabase(file); let service = createIngestionService(db);
  const saved = service.ingestOne(getDemoFeedbacks()[0]); db.close();
  db = openDatabase(file); service = createIngestionService(db);
  assert.equal(service.ingestOne(getDemoFeedbacks()[0]).status, 'duplicate');
  assert.equal(db.prepare('SELECT comment FROM feedback_overview WHERE id = 1').get().comment, 'Legado');
  assert.equal(db.prepare('SELECT client_name FROM feedback_overview WHERE id = ?').get(saved.feedbackId).client_name, 'Alvorada Exemplo Ltda');
  assert.equal(db.prepare('SELECT name FROM clients WHERE id = 1').get().name, 'Manual'); db.close();
});
test('CNPJ único vincula cadastro manual; candidatos múltiplos aguardam revisão', () => {
  const db = openDatabase(':memory:');
  try {
    db.exec("INSERT INTO clients(name, created_at) VALUES ('Manual', '2026-01-01'); INSERT INTO client_cnpjs VALUES ('11222333000181', 1);");
    const service = createIngestionService(db); const item = getDemoFeedbacks()[0];
    assert.equal(service.ingestOne(item).clientId, 1);
    db.exec("INSERT INTO clients(name, created_at) VALUES ('Outra', '2026-01-01'); INSERT INTO client_cnpjs VALUES ('11222333000181', 2);");
    const result = service.ingestOne({ ...item, externalEventId: 'novo', externalClientId: 'outro' });
    assert.equal(result.status, 'pending'); assert.equal(count(db, 'clients'), 2);
    assert.equal(service.ingestBatch([{ ...item, externalEventId: 'data-invalida', occurredAt: '2026-02-30T12:00:00Z' }])[0].status, 'error');
  } finally { db.close(); }
});

test('decisão individual preserva vínculo global conflitante e sobrevive ao reinício', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cti-t02-review-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const filename = path.join(dir, 'review.sqlite');
  let db = openDatabase(filename);
  db.prepare("INSERT INTO managers VALUES (1, 'gestor@exemplo.test', 'sal', 'hash', '2026-01-01')").run();
  let service = createIngestionService(db);
  const items = getDemoFeedbacks();
  const a = service.ingestOne(items[0]);
  const b = service.ingestOne(items[5]);
  const conflict = service.ingestOne(items[3]);
  assert.equal(conflict.status, 'pending');
  const pending = service.listPending()[0];
  assert.deepEqual(service.review(pending.id, { managerId: 1, action: 'link', clientId: b.clientId, justification: 'Identidade conferida para este relato' }), { status: 'linked', clientId: b.clientId });
  assert.equal(service.ingestOne(items[3]).status, 'duplicate');
  assert.equal(db.prepare('SELECT client_id FROM external_client_ids WHERE source_system = ? AND external_client_id = ?').get('demo-external', 'cli-100').client_id, a.clientId);
  assert.equal(db.prepare('SELECT client_id FROM feedback_overview WHERE id = ?').get(a.feedbackId).client_id, a.clientId);
  const later = service.ingestOne({ ...items[3], externalEventId: 'evt-conflito-posterior' });
  assert.equal(later.status, 'pending');
  const next = service.listPending()[0];
  const created = service.review(next.id, { managerId: 1, action: 'create', justification: 'Novo cliente verificado' });
  assert.equal(created.status, 'created');
  assert.notEqual(created.clientId, a.clientId); assert.notEqual(created.clientId, b.clientId);
  db.close();
  db = openDatabase(filename); service = createIngestionService(db);
  const decision = db.prepare('SELECT * FROM identity_pending WHERE id = ?').get(pending.id);
  assert.equal(decision.resolved_client_id, b.clientId); assert.equal(decision.reviewed_by, 1);
  assert.ok(decision.reviewed_at); assert.equal(decision.justification, 'Identidade conferida para este relato');
  assert.equal(db.prepare('SELECT client_id FROM feedback_overview WHERE id = ?').get(conflict.feedbackId).client_id, b.clientId);
  assert.equal(db.prepare('SELECT client_id FROM feedback_overview WHERE id = ?').get(later.feedbackId).client_id, created.clientId);
  assert.equal(service.ingestOne(items[3]).status, 'duplicate');
  assert.equal(service.ingestOne({ ...items[3], externalEventId: 'evt-conflito-apos-reinicio' }).status, 'pending');
  assert.equal(db.prepare('SELECT client_id FROM external_client_ids WHERE source_system = ? AND external_client_id = ?').get('demo-external', 'cli-100').client_id, a.clientId);
  db.close();
});

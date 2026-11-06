const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { createSession } = require('../src/security/sessions');
const { createIngestionService } = require('../src/services/feedback-ingestion');
const { getDemoFeedbacks } = require('../src/services/demo-feedback-source');
const { startServer } = require('../test-support/server');
const source = fs.readFileSync(path.join(__dirname, '../public/workspace.js'), 'utf8');

// DOM mínimo: executa os handlers reais sem duplicar regras do servidor.
function workspace(fetcher, hash) {
  const elements = new Map(); const attributes = {}; let hashchange;
  const content = { innerHTML: '', setAttribute: (k, v) => { attributes[k] = v; }, querySelectorAll: () => [], querySelector: () => ({ focus() {} }) };
  const message = {};
  const element = id => {
    if (!content.innerHTML.includes(`id="${id}"`)) return null;
    if (!elements.has(id)) elements.set(id, { addEventListener: (name, fn) => { elements.get(id)[name] = fn; } });
    return elements.get(id);
  };
  const location = { hash, assign(value) { this.redirect = value; } };
  vm.runInNewContext(source, { document: { querySelector: s => s === '#workspace-content' ? content : s === '#workspace-message' ? message : element(s.slice(1)), querySelectorAll: () => [], getElementById: element }, location,
    window: { addEventListener: (name, fn) => { hashchange = fn; } }, URLSearchParams,
    FormData: class { constructor(target) { return new Map(Object.entries(target.values)); } }, fetch: fetcher });
  const settle = async () => { for (let i = 0; i < 100 && attributes['aria-busy'] === 'true'; i++) await new Promise(resolve => setTimeout(resolve, 5)); assert.equal(attributes['aria-busy'], 'false'); };
  return { content, message, location, attributes, settle,
    async navigate(value) { location.hash = value; await hashchange(); },
    async submit(id, values) { const button = { disabled: false }; assert.ok(elements.get(id)?.submit, `Formulário ${id} disponível`); await elements.get(id).submit({ preventDefault() {}, target: { values, querySelector: () => button } }); assert.equal(button.disabled, false); }
  };
}

test('T07: formulários reais percorrem análise, ajuste, confirmação e ciclo SGQ nas APIs integradas', async t => {
  const db = openDatabase(':memory:'); t.after(() => db.close());
  db.exec("INSERT INTO managers VALUES (1,'gestor@example.test','s','h','2026-11-06')");
  const imported = createIngestionService(db).ingestBatch(getDemoFeedbacks());
  const clientId = imported[0].clientId;
  const base = await startServer(createApp({ database: db }), t);
  const cookie = `cti_manager_session=${createSession(db, 1).token}`;
  const calls = [];
  const ui = workspace(async (url, options) => { calls.push([url, options]); return fetch(base + url, { ...options, headers: { ...options.headers, cookie } }); }, '#hypotheses');
  await ui.settle(); assert.match(ui.content.innerHTML, /Nenhuma hipótese/);
  await ui.submit('hypothesis-analysis', { clientId: String(clientId) });
  const h = db.prepare('SELECT * FROM relationship_hypotheses WHERE client_id = ? ORDER BY id LIMIT 1').get(clientId);
  await ui.navigate('#hypotheses/' + h.id);
  assert.match(ui.content.innerHTML, /correlação não comprova causalidade/);
  assert.match(ui.content.innerHTML, /Consultar feedback/);
  assert.doesNotMatch(ui.content.innerHTML, /id="occurrence-form"/);
  await ui.submit('hypothesis-review', { status: 'adjusted', description: 'Sinal relacional a conferir', justification: 'Ajuste humano fictício' });
  await ui.submit('hypothesis-review', { status: 'confirmed', description: 'Não deve ser enviada', justification: 'Evidências conferidas' });
  assert.match(ui.content.innerHTML, /gestor@example.test/);
  assert.match(ui.content.innerHTML, /Ajuste humano fictício/);
  await ui.submit('occurrence-form', { title: 'Retorno relacional', category: 'Comunicação', analysis: 'Investigar rotina', impact: 'medium', priority: 'normal', containment: 'Contato acompanhado', recurrent: 'false', relatedProblemId: '' });
  const p = db.prepare('SELECT * FROM quality_problems').get();
  assert.equal(p.hypothesis_id, h.id); assert.equal(ui.location.hash, '#quality/' + p.id);
  await ui.navigate(ui.location.hash);
  await ui.submit('problem-transition', { justification: 'Tentativa prematura' });
  assert.match(ui.message.textContent, /encerramento exige/);
  assert.equal(db.prepare('SELECT status FROM quality_problems').get().status, 'open');
  await ui.submit('problem-analysis-form', { impact: 'high', priority: 'high', containment: 'Acompanhamento', cause: 'Rotina relacional ausente', recurrent: 'false', relatedProblemId: '' });
  await ui.submit('action-form', { description: 'Definir retorno', owner: 'Gestora fictícia', dueDate: '2026-11-20' });
  const a = db.prepare('SELECT id FROM quality_actions').get();
  await ui.submit('complete-' + a.id, { evidence: 'Primeira execução' });
  await ui.submit('verify-' + a.id, { effective: 'false', criterion: 'Retorno em dois dias', note: 'Prazo não atendido' });
  await ui.submit('complete-' + a.id, { evidence: 'Segunda execução' });
  await ui.submit('verify-' + a.id, { effective: 'true', criterion: 'Retorno em dois dias', note: 'Prazo atendido' });
  assert.match(ui.content.innerHTML, /Critério: Retorno em dois dias/);
  await ui.submit('problem-transition', { justification: 'Eficácia conferida' });
  assert.equal(db.prepare('SELECT status FROM quality_problems').get().status, 'closed');
  assert.doesNotMatch(ui.content.innerHTML, /id="action-form"|id="problem-service-form"/);
  await ui.submit('problem-transition', { justification: 'Novo indício relacional' });
  assert.equal(db.prepare('SELECT status FROM quality_problems').get().status, 'in_progress');
  assert.match(ui.content.innerHTML, /Novo indício relacional/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM quality_action_attempts').get().n, 2);
  assert.ok(calls.some(([url, opts]) => url.endsWith('/verify') && JSON.parse(opts.body).criterion === 'Retorno em dois dias'));
});

test('T07: rejeição não abre ocorrência; texto externo é escapado nas hipóteses e no histórico', async () => {
  const hostile = '<img src=x onerror=alert(1)>';
  const h = { id: 1, client_id: 2, description: hostile, status: 'rejected', client_name: hostile, criterion: hostile, limitations: hostile,
    evidence: [{ feedback_id: 3, source_system: hostile, external_event_id: hostile, dimension: 'mixed', technical_reference: hostile }],
    interactions: [{ interaction_id: 5, summary_snapshot: hostile }], decisions: [{ actor: hostile, previous_status: 'pending', status: 'rejected', justification: hostile, previous_description: hostile, description: hostile }] };
  const ui = workspace(async () => ({ ok: true, status: 200, json: async () => h }), '#hypotheses/1');
  await ui.settle(); assert.doesNotMatch(ui.content.innerHTML, /<img|id="occurrence-form"|id="hypothesis-review"/);
  assert.match(ui.content.innerHTML, /&lt;img/); assert.match(ui.content.innerHTML, /href="#triage\/3"/); assert.match(ui.content.innerHTML, /href="#clients\/2"/);
});

test('T07: áreas SGQ anunciam carregamento, vazio, erro, falta de permissão e sessão expirada', async () => {
  for (const route of ['hypotheses', 'quality']) for (const status of [200, 403, 500, 401]) {
    let release; const gate = new Promise(resolve => { release = resolve; });
    const ui = workspace(async () => { await gate; return { ok: status === 200, status, json: async () => status === 200 ? { items: [] } : { error: 'Falha local fictícia' } }; }, '#' + route);
    assert.match(ui.content.innerHTML, /Carregando/); assert.equal(ui.attributes['aria-busy'], 'true');
    release(); await ui.settle();
    if (status === 200) assert.match(ui.content.innerHTML, /Nenhuma/);
    if (status === 403) assert.match(ui.message.textContent, /Sem permissão/);
    if (status === 500) assert.match(ui.message.textContent, /Falha local/);
    if (status === 401) assert.equal(ui.location.redirect, '/login?next=/workspace');
  }
});

test('T07: ocorrência escapa evidências, critérios e eventos externos sem oferecer escrita quando encerrada', async () => {
  const hostile = '<svg onload=alert(1)>';
  const ui = workspace(async () => ({ ok: true, json: async () => ({
    problem: { id: 1, title: hostile, status: 'closed', analysis: hostile, category: hostile, cause: hostile, containment: hostile },
    feedbacks: [{ id: 2, comment: hostile, source_system: hostile, technical_reference: hostile, dimension: 'mixed' }],
    actions: [{ id: 3, description: hostile, owner: hostile, status: 'effective', evidence: hostile, verification_note: hostile }],
    attempts: [{ action_id: 3, evidence: hostile, effective: 1, criterion: hostile, verification_note: hostile }],
    events: [{ description: hostile, actor: hostile }]
  }) }), '#quality/1');
  await ui.settle();
  assert.doesNotMatch(ui.content.innerHTML, /<svg|id="action-form"|id="complete-3"|id="verify-3"|id="problem-analysis-form"/);
  assert.match(ui.content.innerHTML, /&lt;svg/);
  assert.match(ui.content.innerHTML, /Critério: &lt;svg/);
  assert.match(ui.content.innerHTML, /fora da investigação CTI/);
  assert.match(ui.content.innerHTML, /Registrar reabertura/);
});

test('T07: resposta antiga não substitui a área após mudança de navegação', async () => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  const ui = workspace(async url => { if (url.endsWith('relationships/1')) { await gate; return { ok: true, json: async () => ({ description: 'Resposta antiga' }) }; } return { ok: true, json: async () => ({ items: [] }) }; }, '#hypotheses/1');
  await ui.navigate('#quality'); release(); await new Promise(resolve => setImmediate(resolve));
  assert.match(ui.content.innerHTML, /Ocorrências relacionais/); assert.doesNotMatch(ui.content.innerHTML, /Resposta antiga/);
});

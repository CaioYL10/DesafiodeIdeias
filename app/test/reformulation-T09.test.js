const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { createSession } = require('../src/security/sessions');
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

test('T09: jornada real com relógio controlado, preferência, serviço, prévia, falha, retentativa e cancelamento', async t => {
  const db = openDatabase(':memory:'); t.after(() => db.close());
  db.exec("INSERT INTO managers VALUES (1,'gestor@example.test','s','h','2026'); INSERT INTO clients(id,name,created_at) VALUES (1,'Empresa fictícia','2026'); INSERT INTO products(id,name,type,created_at) VALUES (1,'Internet','service','2026'); INSERT INTO service_instances(id,client_id,product_id,name,created_at,updated_at) VALUES (1,1,1,'Serviço fictício','2026','2026');");
  let time = '2026-11-06T01:59:59Z';
  const base = await startServer(createApp({ database: db, clock: () => new Date(time) }), t);
  const cookie = `cti_manager_session=${createSession(db, 1).token}`;
  const calls = [];
  const ui = workspace(async (url, options) => { calls.push([url, options]); return fetch(base + url, { ...options, headers: { ...options.headers, cookie } }); }, '#retention/1');
  await ui.settle(); assert.match(ui.content.innerHTML, /Nenhuma preferência|Nenhum evento/);
  const pref = { purpose: 'Retorno fictício', recipient: 'pessoa@example.test', frequencyDays: '30', consent: 'on', active: 'on' };
  await ui.submit('retention-preference', pref);
  await ui.submit('retention-event', { kind: 'maintenance', title: 'Manutenção fictícia', serviceInstanceId: '', dueAt: '2026-11-06T02:00' });
  assert.match(ui.message.textContent, /Manutenção exige serviço/);
  await ui.submit('retention-event', { kind: 'maintenance', title: 'Manutenção fictícia', serviceInstanceId: '1', dueAt: '2026-11-06T02:00' });
  assert.match(ui.content.innerHTML, /2026-11-05 23:00:00/); assert.match(ui.content.innerHTML, /America\/Sao_Paulo/);
  const template = { name: 'Retorno', subject: '<img src=x onerror=alert(1)>', body: 'Prévia fictícia preservada' };
  await ui.submit('retention-template', template);
  const plan = { eventId: '1', templateId: '1', rule: 'retorno' };
  await ui.submit('retention-plan', plan);
  assert.match(ui.content.innerHTML, /Planejada · simulação/); assert.doesNotMatch(ui.content.innerHTML, /<img/); assert.match(ui.content.innerHTML, /&lt;img/);
  await ui.submit('retention-template-1', { ...template, body: 'Novo texto fictício' });
  assert.equal(db.prepare('SELECT body FROM retention_jobs').get().body, template.body);
  await ui.submit('retention-plan', plan); assert.match(ui.message.textContent, /já existente/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM retention_jobs').get().n, 1);
  await ui.submit('retention-job-1', { action: 'execute' }); assert.match(ui.message.textContent, /ainda não venceu/);
  time = '2026-11-06T02:00:00Z';
  await ui.submit('retention-preference', { ...pref, consent: undefined });
  await ui.submit('retention-job-1', { action: 'execute' }); assert.match(ui.message.textContent, /não permite simulação/);
  await ui.submit('retention-preference', pref);
  await ui.submit('retention-job-1', { action: 'execute', simulateFailure: 'on' });
  assert.match(ui.content.innerHTML, /Falha simulada/); assert.match(ui.content.innerHTML, /Retentar simulação após falha/);
  await ui.submit('retention-job-1', { action: 'retry' }); assert.match(ui.content.innerHTML, /Sucesso simulado/);
  assert.doesNotMatch(ui.content.innerHTML, /id="retention-job-1"/);
  assert.match(ui.content.innerHTML, /gestor@example.test/); assert.match(ui.content.innerHTML, /Retentativa com sucesso simulado/);
  await ui.submit('retention-plan', { ...plan, rule: 'cancelar' });
  await ui.submit('retention-job-2', { action: 'cancel', simulateFailure: 'on' });
  assert.equal(db.prepare('SELECT status FROM retention_jobs WHERE id=2').get().status, 'cancelled');
  assert.doesNotMatch(ui.content.innerHTML, /id="retention-job-2"/);
  await ui.submit('retention-plan', { ...plan, rule: 'cancelar' }); assert.match(ui.message.textContent, /já existente/);
  assert.ok(calls.every(([url]) => /^\/api\/manager\/(retention\/|crm\/clients\/1\/services$)/.test(url)));
  assert.deepEqual(JSON.parse(calls.find(([url]) => url.endsWith('/2/cancel'))[1].body), {});
  // A autorização é efetiva no servidor, inclusive em mutações.
  for (const [url, method, body] of [['clients/1', 'GET'], ['clients/1/preference', 'PUT', {}], ['events', 'POST', {}], ['templates', 'POST', {}], ['jobs', 'POST', {}], ['jobs/1/retry', 'POST', {}]]) {
    assert.equal((await fetch(base + '/api/manager/retention/' + url, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) })).status, 401);
  }
});

test('T09: carregamento, entrada, vazio, erro, permissão e sessão expirada', async () => {
  const landing = workspace(async () => { throw Error('Não deve consultar sem cliente'); }, '#retention');
  await landing.settle(); assert.match(landing.content.innerHTML, /id="retention-client"/);
  await landing.submit('retention-client', { clientId: '1' }); assert.equal(landing.location.hash, '#retention/1');
  for (const status of [200, 403, 500, 401]) {
    let release; const gate = new Promise(resolve => { release = resolve; });
    const ui = workspace(async url => { await gate; return { ok: status === 200, status, json: async () => status !== 200 ? { error: 'Falha local fictícia' } : url.includes('/services') || url.includes('/templates') ? { items: [] } : { preference: null, events: [], jobs: [], history: [] } }; }, '#retention/1');
    assert.match(ui.content.innerHTML, /Carregando/); assert.equal(ui.attributes['aria-busy'], 'true');
    release(); await ui.settle();
    if (status === 200) { assert.match(ui.content.innerHTML, /Nenhum plano simulado/); assert.match(ui.content.innerHTML, /Nenhum serviço ativo/); assert.match(ui.content.innerHTML, /Nenhum template/); }
    if (status === 403) assert.match(ui.message.textContent, /Sem permissão/);
    if (status === 500) assert.match(ui.message.textContent, /Falha local/);
    if (status === 401) assert.equal(ui.location.redirect, '/login?next=/workspace');
  }
});

test('T09: navegação descarta resposta antiga e todo texto de simulação é escapado', async () => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  const ui = workspace(async url => { if (url.includes('retention/')) await gate; return { ok: true, json: async () => ({ items: [] }) }; }, '#retention/1');
  await ui.navigate('#quality'); release(); await new Promise(resolve => setImmediate(resolve));
  assert.match(ui.content.innerHTML, /Ocorrências relacionais/); assert.doesNotMatch(ui.content.innerHTML, /Preferência para simulação/);
  const bad = '<svg onload=alert(1)>';
  const due = { local: bad, utc: bad, timeZone: bad };
  const history = [{ event_type: bad, actor: bad, manager_id: 1 }];
  const hostile = workspace(async url => ({ ok: true, json: async () => url.includes('/services') ? { items: [{ id: 1, name: bad, active: 1 }] } : url.includes('/templates') ? { items: [{ id: 1, name: bad, subject: bad, body: bad }] } : { preference: { purpose: bad, recipient: bad }, events: [{ id: 1, title: bad, due }], jobs: [{ id: 1, status: 'cancelled', rule: bad, window: bad, recipient: bad, purpose: bad, subject: bad, body: bad, due, history }], history } }), '#retention/1');
  await hostile.settle(); assert.doesNotMatch(hostile.content.innerHTML, /<svg/); assert.match(hostile.content.innerHTML, /&lt;svg/);
  assert.doesNotMatch(hostile.content.innerHTML, /id="retention-job-1"/);
});

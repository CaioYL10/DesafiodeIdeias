const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../public/assets/app.js'), 'utf8');

function createPage(route, data, loggedIn = true) {
  const root = { innerHTML: '' };
  const location = { pathname: route };
  const fields = {};
  const values = { 'avaliaplay-data': data ? JSON.stringify(data) : null, 'avaliaplay-login': loggedIn ? '1' : null };
  const storage = { getItem: key => values[key] || null, setItem(key, value) { values[key] = value; }, removeItem(key) { delete values[key]; } };
  const listeners = {};
  const context = {
    document: { querySelector: selector => selector === '#app' ? root : fields[selector], addEventListener(type, callback) { listeners[type] = callback; } },
    location,
    localStorage: storage,
    sessionStorage: storage,
    history: { replaceState(_state, _title, url) { location.pathname = url; }, pushState(_state, _title, url) { location.pathname = url; } },
    addEventListener() {},
    scrollTo() {},
    setTimeout() {},
    FormData: class { constructor(form) { return Object.entries(form.values || {}); } },
    Intl,
    Date
  };
  vm.runInNewContext(source, context);
  return { root, listeners, location, fields, storage };
}
const renderRoute = (route, data) => createPage(route, data).root.innerHTML;

test('alternância de tema atualiza o controle e salva a preferência', () => {
  const page = createPage('/dashboard');
  assert.match(page.root.innerHTML, /Ativar modo claro/);
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'toggle-theme' } } : null } });
  assert.equal(page.storage.getItem('avaliaplay-theme'), 'light');
  assert.match(page.root.innerHTML, /Ativar modo escuro/);
});

test('tarefas e oportunidades podem ser criadas, atualizadas e aparecem na linha do tempo', () => {
  const page = createPage('/clientes/1');
  const click = (action, id = 1, itemId) => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action, id, itemId } } : null } });
  const submit = (kind, values, itemId = '') => page.listeners.submit({ preventDefault() {}, target: { id: 'client-work-form', dataset: { clientId: '1', kind, itemId }, values } });
  assert.match(page.root.innerHTML, /Linha do tempo/);
  assert.match(page.root.innerHTML, /Revisão de conectividade/);
  click('new-task');
  assert.match(page.root.innerHTML, /Responsável/);
  submit('new-task', { title: 'Ligar para o cliente', owner: 'Caio', dueDate: '2026-11-20', status: 'Pendente' });
  assert.match(page.root.innerHTML, /Ligar para o cliente/);
  const saved = JSON.parse(page.storage.getItem('avaliaplay-data'));
  const task = saved.clients[0].tasks.at(-1);
  click('edit-task', 1, task.id);
  submit('edit-task', { title: task.title, owner: 'Caio', dueDate: '2026-11-20', status: 'Concluída' }, task.id);
  assert.match(page.root.innerHTML, /Tarefa atualizada/);
  click('new-opportunity');
  submit('new-opportunity', { title: 'Novo serviço', value: '2500', expectedDate: '2026-12-20', stage: 'Proposta', note: 'Expansão' });
  assert.match(page.root.innerHTML, /Novo serviço/);
  const opportunity = JSON.parse(page.storage.getItem('avaliaplay-data')).clients[0].opportunities.at(-1);
  click('edit-opportunity', 1, opportunity.id);
  submit('edit-opportunity', { title: opportunity.title, value: '3000', expectedDate: '2026-12-20', stage: 'Ganha', note: 'Confirmada' }, opportunity.id);
  const updated = JSON.parse(page.storage.getItem('avaliaplay-data')).clients[0];
  assert.equal(updated.opportunities.at(-1).value, 3000);
  assert.equal(updated.opportunities.at(-1).stage, 'Ganha');
  assert.match(page.root.innerHTML, /Oportunidade atualizada/);
  const tasks = createPage('/tarefas', JSON.parse(page.storage.getItem('avaliaplay-data')));
  assert.match(tasks.root.innerHTML, /Ligar para o cliente/);
  assert.match(tasks.root.innerHTML, /Concluídas/);
  const opportunities = createPage('/oportunidades', JSON.parse(page.storage.getItem('avaliaplay-data')));
  assert.match(opportunities.root.innerHTML, /Novo serviço/);
  assert.match(opportunities.root.innerHTML, /Valor estimado em aberto/);
});

test('dados fictícios preenchem financeiro e SLA sem sobrescrever registros existentes', () => {
  const page = createPage('/dashboard');
  const control = { dataset: { action: 'dashboard-financial' } };
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? control : null } });
  assert.match(page.root.innerHTML, /Receita por empresa/);
  assert.match(page.root.innerHTML, /financial-chart-card/);
  assert.equal((page.root.innerHTML.match(/class="financial-chart-item"/g) || []).length, 6);
  assert.match(page.root.innerHTML, /--bar-height:100%/);
  assert.match(page.root.innerHTML, /29\.800,00/);
  assert.match(page.root.innerHTML, /Não representam dados financeiros da CTI/);
  assert.match(page.root.innerHTML, /Receita mensal cadastrada/);
  assert.match(page.root.innerHTML, /Projeção anual simples/);
  assert.match(page.root.innerHTML, /Concentração das 3 maiores/);
  assert.match(page.root.innerHTML, /Dados da empresa → Receita mensal informada/);
  const edit = { dataset: { action: 'edit-client', id: '1' } };
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? edit : null } });
  assert.match(page.root.innerHTML, /name="monthlyRevenue"/);
  const profile = renderRoute('/clientes/1');
  assert.match(profile, /Interrupção do link principal/);
  assert.match(profile, /disponibilidade mensal de 99,9%/);

  const migrated = createPage('/clientes/1', { demoDataVersion: 3, clients: [{ id: 1, name: 'Formtap' }], feedbacks: [], services: [] });
  const saved = JSON.parse(migrated.storage.getItem('avaliaplay-data'));
  saved.clients[0].monthlyRevenue = 42000;
  saved.clients[0].slaContract = 'Contrato editado pela equipe';
  saved.clients[0].slaIncidents = [];
  const revisited = createPage('/clientes/1', saved);
  const updated = JSON.parse(revisited.storage.getItem('avaliaplay-data'));
  assert.equal(updated.clients[0].monthlyRevenue, 42000);
  assert.equal(updated.clients[0].slaContract, 'Contrato editado pela equipe');
  assert.equal(updated.clients[0].slaIncidents.length, 0);
});

test('cada quadro principal renderiza conteúdo e navegação local', () => {
  const pages = [
    ['/', 'Conheça cada cliente'],
    ['/login', 'Entrar na gestão'],
    ['/dashboard', 'Movimento de feedbacks'],
    ['/feedbacks', 'Pesquise e acompanhe'],
    ['/clientes', 'Lista de clientes'],
    ['/tarefas', 'Tarefas de acompanhamento'],
    ['/oportunidades', 'Oportunidades'],
    ['/clientes/1', 'Revisão de conectividade'],
    ['/triagem', 'Triagem de reparação'],
    ['/acoes', 'Ações'],
    ['/servicos', 'Catálogo de serviços'],
    ['/enviar-feedback', 'Página não encontrada']
  ];
  for (const [route, text] of pages) assert.match(renderRoute(route), new RegExp(text), route);
});

test('comentários locais são escapados antes de aparecer na tabela', () => {
  const data = { clients: [], services: [], problems: [], feedbacks: [{ id: 1, client: 'Teste', comment: '<img src=x onerror=alert(1)>', service: 'Cloud', rating: 3, sentiment: 'Neutro', date: '06/11/2026' }] };
  const html = renderRoute('/feedbacks', data);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
});

test('dashboard alterna entre Feedbacks e Relações sem sair da página', () => {
  const page = createPage('/dashboard');
  assert.match(page.root.innerHTML, /data-action="dashboard-relations"/);
  const click = action => page.listeners.click({ target: { closest(selector) { return selector === '[data-action]' ? { dataset: { action } } : null; } } });
  click('dashboard-relations');
  assert.match(page.root.innerHTML, /Análise das relações/);
  assert.match(page.root.innerHTML, /Clientes cadastrados/);
  assert.match(page.root.innerHTML, /Top 3 empresas mais próximas/);
  assert.match(page.root.innerHTML, /Top 3 empresas mais próximas/);
  assert.match(page.root.innerHTML, /Sicredi/);
  assert.doesNotMatch(page.root.innerHTML, /Bulk/);
  assert.match(page.root.innerHTML, /Lembretes importantes/);
  assert.doesNotMatch(page.root.innerHTML, /Reunião com empresas parceiras|Novas empresas no último mês/);
  click('dashboard-feedbacks');
  assert.match(page.root.innerHTML, /Análise dos feedbacks/);
  assert.match(page.root.innerHTML, /Top 3 empresas mais recorrentes/);
  assert.match(page.root.innerHTML, /Formtap/);
  assert.doesNotMatch(page.root.innerHTML, /Ecotech/);
  assert.match(page.root.innerHTML, /Clima dos comentários/);
});

test('tela de feedbacks mantém somente o título externo', () => {
  const html = renderRoute('/feedbacks');
  assert.match(html, /<h1>Feedbacks<\/h1>/);
  assert.doesNotMatch(html, /<h2>Feedbacks<\/h2>/);
  assert.doesNotMatch(html, /class="card-heading feedback-count"/);
  assert.match(html, /<section class="card list-card feedback-list"><div class="filters">/);
  assert.match(html, /Página 1 a 21 registros/);
});

test('ver perfil abre modal com rolagem própria sobre clientes', () => {
  const page = createPage('/clientes');
  const click = (action, id) => {
    const control = { dataset: { action, id }, classList: { contains: () => false } };
    page.listeners.click({ target: { closest(selector) { return selector === '[data-action]' ? control : null; } } });
  };
  click('profile', '1');
  assert.equal(page.location.pathname, '/clientes');
  assert.match(page.root.innerHTML, /class="modal-backdrop"/);
  assert.match(page.root.innerHTML, /class="profile-scroll"/);
  assert.match(page.root.innerHTML, /class="profile-overview-grid"/);
  assert.match(page.root.innerHTML, /class="profile-record-grid"/);
  assert.match(page.root.innerHTML, /class="profile-workspace"/);
  assert.equal((page.root.innerHTML.match(/<details class="profile-group"/g) || []).length, 3);
  assert.equal((page.root.innerHTML.match(/<details class="profile-group" open>/g) || []).length, 1);
  assert.match(page.root.innerHTML, /Empresa e atendimento/);
  assert.match(page.root.innerHTML, /Trabalho da equipe/);
  assert.match(page.root.innerHTML, /Revisão de conectividade/);
  assert.match(page.root.innerHTML, /Internet dedicada/);
  assert.match(page.root.innerHTML, /São Paulo, SP · CEP 01001-000/);
  assert.match(page.root.innerHTML, /A conexão se manteve estável/);
  assert.doesNotMatch(page.root.innerHTML, /Revisão de Contrato|Kickoff Projeto Alpha/);
  click('close');
  assert.doesNotMatch(page.root.innerHTML, /class="modal-backdrop"/);
});

test('visão pública não expõe dados e a visão do CRM exige entrada na gestão', () => {
  const visitor = createPage('/', undefined, false);
  assert.equal(visitor.location.pathname, '/');
  assert.match(visitor.root.innerHTML, /Relacionamento com contexto/);
  assert.match(visitor.root.innerHTML, /href="\/login"/);
  assert.match(visitor.root.innerHTML, /href="\/login" data-link>Login<\/a>/);
  assert.match(visitor.root.innerHTML, /<a href="\/login" data-link >Login<\/a>/);
  assert.doesNotMatch(visitor.root.innerHTML, /AvaliaPlay · CTI/);
  assert.doesNotMatch(visitor.root.innerHTML, /Carteira em foco/);
  assert.doesNotMatch(visitor.root.innerHTML, /href="\/clientes"/);
  assert.doesNotMatch(visitor.root.innerHTML, />3<|>5<|>2</);

  const manager = createPage('/');
  assert.match(manager.root.innerHTML, /Carteira em foco/);
  assert.match(manager.root.innerHTML, /href="\/dashboard"/);
  assert.match(manager.root.innerHTML, /href="\/clientes"/);
  assert.doesNotMatch(manager.root.innerHTML, /Enviar feedback/);

  const directProfile = createPage('/clientes/1', undefined, false);
  assert.equal(directProfile.location.pathname, '/login');
  assert.doesNotMatch(directProfile.root.innerHTML, /Nenhuma reunião registrada/);
});

test('login apresenta o CRM e mantém o formulário de acesso', () => {
  const html = renderRoute('/login');
  assert.match(html, /Gestão de relacionamento da CTI/);
  assert.match(html, /id="login-form"/);
  assert.doesNotMatch(html, /Feedbacks claros/);
});

test('visão interna mostra ícones e remove avisos e contadores solicitados', () => {
  const home = renderRoute('/');
  assert.doesNotMatch(home, /Relacionamento e qualidade · CTI|Dados demonstrativos/);
  assert.doesNotMatch(home, /<span>01<\/span>|<span>02<\/span>|<span>03<\/span>/);
  assert.match(home, /class="shortcut-icon/);
  assert.match(home, /class="crm-row-icon blue"><svg/);
  assert.match(home, /class="crm-row-icon gold"><svg/);
  assert.match(home, /class="crm-row-icon green"><svg/);

  const clients = createPage('/clientes');
  assert.doesNotMatch(clients.root.innerHTML, /3 empresas|Empresa Exemplo/);
  for (const name of ['Formtap', 'Tecnolab', 'Sicredi', 'Acrilex', 'Maple Bear', '99']) assert.match(clients.root.innerHTML, new RegExp(name));
  assert.doesNotMatch(clients.root.innerHTML, /Aurora Vale Logística|Ponte Azul Tecnologia|Brisa Norte Comércio|Empresa de demonstração/);
  assert.match(clients.root.innerHTML, /Felipe Santos \(demonstração\) · 1 relato/);
  assert.match(clients.root.innerHTML, /class="client-wordmark brand-formtap"/);
  clients.listeners.click({ target: { closest(selector) { return selector === '[data-action]' ? { dataset: { action: 'map' } } : null; } } });
  assert.doesNotMatch(clients.root.innerHTML, /Quantidade de empresas|Dados ilustrativos|class="map-legend"/);
  assert.match(clients.root.innerHTML, /6 empresas em 6 estados/);
  assert.match(clients.root.innerHTML, /title="SP: 1 empresa"/);
  assert.doesNotMatch(clients.root.innerHTML, /72 empresas|Presença em 24/);
});

test('nomes fictícios substituem exemplos já salvos no navegador', () => {
  const saved = {
    clients: [
      { id: 1, name: 'Empresa Exemplo A', contact: 'Equipe de TI', email: 'contato@empresa99.com.br' },
      { id: 2, name: 'Empresa Exemplo B', contact: 'Contato não informado', email: '' },
      { id: 3, name: 'Empresa Exemplo C', contact: 'Contato não informado', email: '' }
    ],
    feedbacks: [{ id: 1, client: 'Empresa Exemplo A', comment: 'Teste', service: 'Internet', rating: 3, sentiment: 'Neutro', date: '06/11/2026' }],
    services: [], problems: []
  };
  const html = renderRoute('/clientes', saved);
  assert.match(html, /Formtap/);
  assert.doesNotMatch(html, /Empresa Exemplo A/);
  assert.match(renderRoute('/triagem', saved), /Nenhuma reparação pendente/);
});

test('ação antiga do exemplo fictício permanece vinculada ao caso de demonstração', () => {
  const ids = Array.from({ length: 10 }, (_, index) => index + 6);
  const saved = {
    clients: [
      { id: 1, name: 'Aurora Vale Logística' },
      { id: 2, name: 'Ponte Azul Tecnologia' },
      { id: 3, name: 'Brisa Norte Comércio' }
    ],
    feedbacks: ids.map(id => ({ id, client: 'Aurora Vale Logística', comment: 'Retorno demorado', service: 'Internet dedicada', sentiment: 'Negativo', area: 'Atendimento', date: '06/11/2026' })),
    services: [],
    actions: [{ id: 1, clientId: 1, clientName: 'Aurora Vale Logística', theme: 'Demora no retorno', proposal: 'Conversar com a empresa.', feedbackIds: ids, status: 'Pendente', createdAt: '06/11/2026', history: [{ status: 'Pendente', date: '06/11/2026', note: 'Aprovada.' }] }],
    repairReviews: [{ key: `1:${ids.join(',')}`, clientId: 1, decision: 'Aceita', note: 'Aprovada.', date: '06/11/2026' }]
  };
  const actions = createPage('/acoes', saved);
  assert.match(actions.root.innerHTML, /Empresa de demonstração/);
  assert.doesNotMatch(actions.root.innerHTML, /Aurora Vale Logística/);
  const triage = createPage('/triagem', JSON.parse(actions.storage.getItem('avaliaplay-data')));
  assert.match(triage.root.innerHTML, /Nenhuma reparação pendente/);
});

test('serviços da CTI substituem exemplos antigos sem apagar cadastros próprios', () => {
  const saved = {
    clients: [], problems: [],
    feedbacks: [{ id: 1, client: 'Teste', comment: 'Teste', service: 'Cloud', rating: 3, sentiment: 'Neutro', date: '06/11/2026' }],
    services: [
      { name: 'Internet corporativa', type: 'Serviço', description: 'Exemplo antigo' },
      { name: 'Cloud', type: 'Serviço', description: 'Exemplo antigo' },
      { name: 'Cibersegurança', type: 'Serviço', description: 'Exemplo antigo' },
      { name: 'Serviço próprio', type: 'Serviço', description: 'Cadastro manual' }
    ]
  };
  const catalog = renderRoute('/servicos', saved);
  for (const name of ['Internet dedicada', 'Segurança de rede', 'Infraestrutura em nuvem', 'Serviço próprio']) assert.match(catalog, new RegExp(name));
  assert.doesNotMatch(catalog, /<h3>Internet corporativa<\/h3>|<h3>Cloud<\/h3>|<h3>Cibersegurança<\/h3>/);
  const feedbacks = renderRoute('/feedbacks', saved);
  assert.match(feedbacks, /Infraestrutura em nuvem/);
  assert.doesNotMatch(feedbacks, /<option[^>]*>Cloud<\/option>/);
});

test('triagem reúne apenas padrões negativos de atendimento vinculados à empresa', () => {
  const feedbacks = Array.from({ length: 10 }, (_, index) => ({
    id: index + 30, client: 'Cliente de teste', comment: `Retorno demorado ${index}`,
    service: 'Internet dedicada', sentiment: 'Negativo', area: 'Atendimento', theme: 'Demora no retorno', date: '06/11/2026'
  }));
  const data = { clients: [{ id: 1, name: 'Cliente de teste' }], feedbacks: feedbacks.slice(0, 9), services: [], problems: [] };
  assert.match(renderRoute('/triagem', data), /Nenhuma reparação pendente/);
  data.feedbacks = feedbacks;
  const html = renderRoute('/triagem', data);
  assert.match(html, /10 feedbacks negativos/);
  assert.match(html, /demora no retorno/i);
  assert.match(html, /Cliente de teste/);
  assert.match(html, /Simulação local/);
  data.feedbacks = feedbacks.map(feedback => ({ ...feedback, area: 'Técnico' }));
  assert.match(renderRoute('/triagem', data), /Nenhuma reparação pendente/);
});

test('proposta aceita vira ação da empresa com acompanhamento e histórico', () => {
  const page = createPage('/triagem');
  const click = (action, id) => page.listeners.click({ target: { closest(selector) { return selector === '[data-action]' ? { dataset: { action, id } } : null; } } });
  assert.match(page.root.innerHTML, /Triagem de reparação/);
  assert.match(page.root.innerHTML, /Empresa de demonstração/);
  click('analyze', '0');
  assert.match(page.root.innerHTML, /10 feedbacks negativos/);
  assert.match(page.root.innerHTML, /Sugestão de reparação/);
  assert.match(page.root.innerHTML, /id="repair-proposal"/);
  page.fields['#repair-proposal'] = { value: '' };
  click('use-suggestion');
  assert.match(page.fields['#repair-proposal'].value, /Agendar uma conversa com a empresa/);
  page.fields['#decision-note'] = { value: 'Proposta adequada para retomar o contato.' };
  click('accept');
  page.listeners.click({ preventDefault() {}, target: { closest(selector) { return selector === '[data-link]' ? { getAttribute: () => '/acoes' } : null; } } });
  assert.equal(page.location.pathname, '/acoes');
  assert.match(page.root.innerHTML, /Empresa de demonstração/);
  assert.match(page.root.innerHTML, /Pendente/);
  click('action', '1');
  page.fields['#action-status'] = { value: 'Concluída' };
  page.fields['#action-note'] = { value: 'Reunião de alinhamento realizada com a empresa.' };
  click('save-action');
  assert.match(page.root.innerHTML, /Concluída/);
  click('action', '1');
  assert.match(page.root.innerHTML, /Reunião de alinhamento realizada com a empresa/);
  const reloaded = createPage('/acoes', JSON.parse(page.storage.getItem('avaliaplay-data')));
  assert.match(reloaded.root.innerHTML, /Concluída/);
  assert.match(reloaded.root.innerHTML, /Empresa de demonstração/);
});

test('análise sem motivo recorrente não cria proposta automaticamente', () => {
  const feedbacks = Array.from({ length: 10 }, (_, index) => ({
    id: index + 30, client: 'Cliente de teste', comment: `Atendimento ${index}`,
    service: 'Internet dedicada', sentiment: 'Negativo', area: 'Atendimento',
    theme: index % 2 ? 'Falta de contexto' : 'Demora no retorno', date: '06/11/2026'
  }));
  const data = { clients: [{ id: 1, name: 'Cliente de teste' }], feedbacks, services: [], problems: [] };
  const page = createPage('/triagem', data);
  page.listeners.click({ target: { closest(selector) { return selector === '[data-action]' ? { dataset: { action: 'analyze', id: '1' } } : null; } } });
  assert.match(page.root.innerHTML, /Não há um motivo suficientemente recorrente/);
  assert.match(page.root.innerHTML, /data-action="accept"/);
  assert.doesNotMatch(page.root.innerHTML, /data-action="use-suggestion"/);
});

test('equipe pode escrever proposta própria diferente da sugestão local', () => {
  const page = createPage('/triagem');
  const click = (action, id) => page.listeners.click({ target: { closest(selector) { return selector === '[data-action]' ? { dataset: { action, id } } : null; } } });
  click('analyze', '0');
  page.fields['#repair-proposal'] = { value: 'Convidar a empresa para uma reunião de escuta e definir um canal direto com o gestor.' };
  page.fields['#decision-note'] = { value: 'A equipe considera este contato mais adequado.' };
  click('accept');
  page.listeners.click({ preventDefault() {}, target: { closest(selector) { return selector === '[data-link]' ? { getAttribute: () => '/acoes' } : null; } } });
  assert.match(page.root.innerHTML, /Convidar a empresa para uma reunião de escuta/);
  assert.match(page.root.innerHTML, /Proposta da equipe/);
  assert.doesNotMatch(page.root.innerHTML, /Agendar uma conversa com a empresa/);
});

test('motivo recorrente é reconhecido nos textos sem etiqueta prévia', () => {
  const feedbacks = Array.from({ length: 10 }, (_, index) => ({
    id: index + 30, client: 'Cliente de teste', comment: `O retorno do atendimento demorou ${index} dias.`,
    service: 'Internet dedicada', sentiment: 'Negativo', area: 'Atendimento', date: '06/11/2026'
  }));
  const data = { clients: [{ id: 1, name: 'Cliente de teste' }], feedbacks, services: [], problems: [] };
  const page = createPage('/triagem', data);
  page.listeners.click({ target: { closest(selector) { return selector === '[data-action]' ? { dataset: { action: 'analyze', id: '1' } } : null; } } });
  assert.match(page.root.innerHTML, /10 de 10 feedbacks mencionam demora no retorno/);
  assert.match(page.root.innerHTML, /Aceitar e criar ação/);
});

test('proposta descartada não entra em Ações e rota antiga redireciona', () => {
  const page = createPage('/triagem');
  const click = (action, id) => page.listeners.click({ target: { closest(selector) { return selector === '[data-action]' ? { dataset: { action, id } } : null; } } });
  click('analyze', '0');
  page.fields['#decision-note'] = { value: 'Ainda não há contexto para contato.' };
  click('reject');
  assert.match(page.root.innerHTML, /Nenhuma reparação pendente/);
  page.listeners.click({ preventDefault() {}, target: { closest(selector) { return selector === '[data-link]' ? { getAttribute: () => '/acoes' } : null; } } });
  assert.match(page.root.innerHTML, /Nenhuma ação aceita/);
  const oldRoute = createPage('/problemas');
  assert.equal(oldRoute.location.pathname, '/acoes');
  const visitor = createPage('/acoes', undefined, false);
  assert.equal(visitor.location.pathname, '/login');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../public/assets/app.js'), 'utf8');

function createPage(route, data, loggedIn = true, timers = { setTimeout() {} }) {
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
    setTimeout: timers.setTimeout,
    FormData: class { constructor(form) { return Object.entries(form.values || {}); } },
    FileReader: class { readAsDataURL(file) { this.result = `data:${file.type};base64,VEVTVEU=`; this.onload(); } },
    Intl,
    Date
  };
  vm.runInNewContext(source, context);
  return { root, listeners, location, fields, storage };
}
const renderRoute = (route, data) => createPage(route, data).root.innerHTML;

test('reunião reúne convite, respostas e ata no mesmo registro', () => {
  const page = createPage('/clientes/1');
  const click = (action, id = '1', itemId = '') => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action, id, itemId } } : null } });
  click('new-meeting');
  assert.match(page.root.innerHTML, /name="invitees"/);
  assert.match(page.root.innerHTML, /name="invitationText"/);
  assert.match(page.root.innerHTML, /name="minutes"/);
  page.listeners.submit({ preventDefault() {}, target: { id: 'meeting-form', dataset: { clientId: '1' }, values: { title: 'Revisão mensal', date: '2026-11-20', invitees: 'ana@example.com, bia@example.com', invitationText: 'Vamos revisar o serviço.', minutes: 'Decidimos revisar o SLA.' } } });
  const saved = JSON.parse(page.storage.getItem('avaliaplay-data'));
  const meeting = saved.clients[0].meetings.at(-1);
  assert.equal(meeting.invitees.length, 2);
  assert.equal(meeting.invitees[0].status, 'Sem resposta');
  assert.match(page.root.innerHTML, /Decidimos revisar o SLA/);
  click('edit-meeting', '1', String(meeting.id));
  assert.match(page.root.innerHTML, /name="minutes"/);
  assert.doesNotMatch(page.root.innerHTML, /Preparar convite/);
});

test('arquivo da ata é anexado à reunião e continua disponível após recarregar', async () => {
  const page = createPage('/clientes/1');
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'new-meeting', id: '1' } } : null } });
  const form = { id: 'meeting-form', dataset: { clientId: '1' }, values: { title: 'Revisão', date: '2026-11-20', invitees: 'ana@example.com', invitationText: 'Vamos revisar o SLA.', minutes: 'Prazos definidos.' }, querySelector: () => ({ files: [{ name: 'ata.pdf', type: 'application/pdf', size: 100 }] }) };
  await page.listeners.submit({ preventDefault() {}, target: form });
  const saved = JSON.parse(page.storage.getItem('avaliaplay-data'));
  assert.equal(saved.clients[0].meetings.at(-1).attachment.name, 'ata.pdf');
  assert.match(createPage('/clientes/1', saved).root.innerHTML, /Baixar ata anexada: ata.pdf/);
});

test('triagem agrupa reincidência do mesmo assunto entre empresas', () => {
  const feedbacks = Array.from({ length: 3 }, (_, index) => ({ id: index + 60, client: `Empresa ${index}`, comment: 'Demora no retorno', service: 'Internet dedicada', sentiment: 'Negativo', area: 'Atendimento', theme: 'Demora no retorno', date: '06/11/2026' }));
  const html = renderRoute('/triagem', { clients: [], feedbacks, services: [] });
  assert.match(html, /Demora no retorno/);
  assert.match(html, /3 feedbacks negativos/);
  assert.match(html, /3 empresas/);
});

test('financeiro mantém o painel existente sem simulação de viabilidade', () => {
  const page = createPage('/dashboard');
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'dashboard-financial' } } : null } });
  assert.match(page.root.innerHTML, /Receita por empresa/);
  assert.match(page.root.innerHTML, /Histórico da receita mensal/);
  assert.doesNotMatch(page.root.innerHTML, /Simular viabilidade|Ponto de equilíbrio|Payback|ROI|id="financial-form"/);
});

test('consultar feedbacks nos lembretes abre a lista de feedbacks', async () => {
  const page = createPage('/dashboard');
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'dashboard-relations' } } : null } });
  assert.match(page.root.innerHTML, /<a class="reminder-status reminder-link" href="\/feedbacks" data-link>Consultar<\/a>/);
  const link = { getAttribute: () => '/feedbacks' };
  await page.listeners.click({ preventDefault() {}, target: { closest: selector => selector === '[data-link]' ? link : null } });
  assert.equal(page.location.pathname, '/feedbacks');
  assert.match(page.root.innerHTML, /Pesquise e acompanhe/);
});

test('rodapé da visão pública apresenta selo e links da CTI sem aparecer na área logada', () => {
  const visitor = createPage('/', undefined, false);
  assert.match(visitor.root.innerHTML, /class="public-footer"/);
  assert.match(visitor.root.innerHTML, /sustainability-seal\.png/);
  assert.match(visitor.root.innerHTML, /https:\/\/myportal\.cti\.com\.br\//);
  assert.match(visitor.root.innerHTML, /https:\/\/www\.cti\.com\.br\/politica-de-privacidade/);
  assert.match(visitor.root.innerHTML, /https:\/\/www\.cti\.com\.br\/contato/);
  assert.match(createPage('/login', undefined, false).root.innerHTML, /class="public-footer"/);
  assert.doesNotMatch(createPage('/', undefined, true).root.innerHTML, /class="public-footer"/);
});

test('nome no gráfico de relacionamentos abre o perfil da empresa correspondente', () => {
  const page = createPage('/dashboard');
  const click = (action, id = '') => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action, id } } : null } });
  click('dashboard-relations');
  assert.match(page.root.innerHTML, /data-action="profile" data-id="3" aria-label="Abrir perfil de Sicredi"/);
  click('profile', '3');
  assert.equal(page.location.pathname, '/dashboard');
  assert.match(page.root.innerHTML, /class="profile-scroll"/);
  assert.match(page.root.innerHTML, /Sicredi/);
  assert.match(page.root.innerHTML, /Juliana Costa/);
});

test('financeiro compara empresas selecionadas e volta a mostrar todas ao limpar a seleção', () => {
  const page = createPage('/dashboard');
  const click = (action, id = '') => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action, id } } : null } });
  const lineCount = () => (page.root.innerHTML.match(/<polyline /g) || []).length;
  click('dashboard-financial');
  assert.equal(lineCount(), 5);
  click('toggle-financial-client', '1');
  assert.equal(lineCount(), 1);
  assert.match(page.root.innerHTML, /data-id="1" aria-pressed="true"/);
  assert.match(page.root.innerHTML, /data-id="3" aria-pressed="false"/);
  click('toggle-financial-client', '3');
  assert.equal(lineCount(), 2);
  click('toggle-financial-client', '1');
  assert.equal(lineCount(), 1);
  click('toggle-financial-client', '3');
  assert.equal(lineCount(), 5);
});

test('alternância de tema atualiza o controle e salva a preferência', () => {
  const page = createPage('/dashboard');
  assert.match(page.root.innerHTML, /aria-label="Modo escuro"[^>]*aria-pressed="true"/);
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'toggle-theme' } } : null } });
  assert.equal(page.storage.getItem('avaliaplay-theme'), 'light');
  assert.match(page.root.innerHTML, /aria-label="Modo escuro"[^>]*aria-pressed="false"/);
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
  assert.equal((page.root.innerHTML.match(/<polyline /g) || []).length, 5);
  assert.match(page.root.innerHTML, /revenue-history-chart/);
  assert.equal((page.root.innerHTML.match(/class="revenue-legend-item"/g) || []).length, 5);
  assert.doesNotMatch(page.root.innerHTML, /Contribuição mensal cadastrada/);
  assert.doesNotMatch(page.root.innerHTML, /class="financial-help"/);
  assert.match(page.root.innerHTML, /29\.800,00/);
  assert.match(page.root.innerHTML, /não representa dados financeiros da CTI/);
  assert.match(page.root.innerHTML, /Receita mensal cadastrada/);
  assert.match(page.root.innerHTML, /Projeção anual simples/);
  assert.match(page.root.innerHTML, /Concentração das 3 maiores/);
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
    ['/', 'Conheça cada'],
    ['/login', 'Entrar'],
    ['/dashboard', 'Feedbacks por dia'],
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
  assert.match(html, /1–8 de 21 registros/);
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
  assert.equal((page.root.innerHTML.match(/<details class="profile-group" open>/g) || []).length, 0);
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
  assert.match(visitor.root.innerHTML, /href="\/login" data-link>Acessar plataforma/);
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
  assert.match(html, /Gestão de relacionamento da <span>CTI\.<\/span>/);
  assert.match(html, /id="login-form"/);
  assert.doesNotMatch(html, /Feedbacks claros/);
});

test('visão interna mostra o resumo e acessos em lista', () => {
  const home = renderRoute('/');
  assert.doesNotMatch(home, /Relacionamento e qualidade · CTI|Dados demonstrativos/);
  assert.doesNotMatch(home, /<span>01<\/span>|<span>02<\/span>|<span>03<\/span>/);
  assert.match(home, /class="crm-links"/);
  assert.doesNotMatch(home, /class="shortcut-icon|Resumo do relacionamento|Visão da equipe/);
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

test('triagem ignora relatos fora de atendimento e permite acompanhar uma medida por assunto', () => {
  const feedbacks = Array.from({ length: 3 }, (_, index) => ({ id: index + 30, client: `Empresa ${index}`, comment: 'O retorno demorou vários dias.', service: 'Internet dedicada', sentiment: 'Negativo', area: 'Atendimento', date: '06/11/2026' }));
  const data = { clients: [], feedbacks: feedbacks.slice(0, 2), services: [] };
  assert.match(renderRoute('/triagem', data), /Nenhuma reparação pendente/);
  data.feedbacks = feedbacks;
  const page = createPage('/triagem', data);
  const click = (action, id) => page.listeners.click({ target: { closest(selector) { return selector === '[data-action]' ? { dataset: { action, id } } : null; } } });
  assert.match(page.root.innerHTML, /3 empresas/);
  click('analyze', 'Demora no retorno');
  assert.match(page.root.innerHTML, /Reincidência: Demora no retorno/);
  page.fields['#repair-proposal'] = { value: 'Definir responsável pelos retornos.' };
  page.fields['#decision-note'] = { value: 'Aprovado.' };
  click('accept');
  const saved = JSON.parse(page.storage.getItem('avaliaplay-data'));
  assert.equal(saved.actions[0].theme, 'Demora no retorno');
  assert.equal(saved.actions[0].clientId, null);
  data.feedbacks = feedbacks.map(feedback => ({ ...feedback, area: 'Técnico' }));
  assert.match(renderRoute('/triagem', data), /Nenhuma reparação pendente/);
});

test('resposta ao convite é atualizada na reunião', () => {
  const page = createPage('/clientes/1');
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'new-meeting', id: '1' } } : null } });
  page.listeners.submit({ preventDefault() {}, target: { id: 'meeting-form', dataset: { clientId: '1' }, values: { title: 'Revisão', date: '2026-11-20', invitees: 'ana@example.com', invitationText: 'Vamos conversar.', minutes: '' } } });
  const meeting = JSON.parse(page.storage.getItem('avaliaplay-data')).clients[0].meetings.at(-1);
  page.listeners.change({ target: { dataset: { clientId: '1', meetingId: String(meeting.id), inviteeIndex: '0' }, value: 'Confirmado' } });
  assert.equal(JSON.parse(page.storage.getItem('avaliaplay-data')).clients[0].meetings.at(-1).invitees[0].status, 'Confirmado');
});


test('mapa conceitual permite mover elementos e limita a posicao ao mapa', () => {
  const page = createPage('/', null, false);
  const path = { setAttribute(name, value) { this[name] = value; } };
  const map = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 430, height: 360 }), querySelector: selector => selector === '.concept-center' ? center : path, querySelectorAll: () => [node] };
  const center = { offsetLeft: 180, offsetTop: 140, offsetWidth: 70, offsetHeight: 80 };
  const node = { offsetLeft: 20, offsetTop: 30, offsetWidth: 100, offsetHeight: 70, style: {}, closest: selector => selector === '.concept-map' ? map : node, getBoundingClientRect: () => ({ left: 20, top: 30 }), setPointerCapture() {}, classList: { add() {}, remove() {} } };
  page.listeners.pointerdown({ target: node, button: 0, pointerId: 1, clientX: 30, clientY: 40, preventDefault() {} });
  page.listeners.pointermove({ pointerId: 1, clientX: 900, clientY: 900 });
  assert.equal(node.style.left, '330px');
  assert.equal(node.style.top, '290px');
  assert.match(path.d, /^M/);
  page.listeners.pointerup({ pointerId: 1 });
  page.listeners.keydown({ target: node, key: 'ArrowRight', preventDefault() {} });
  assert.equal(node.style.left, '30px');
});


test('submenu do dashboard abre e permite escolher uma visualizacao a partir de outra pagina', () => {
  const page = createPage('/clientes');
  const click = action => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action } } : null } });
  assert.match(page.root.innerHTML, /id="dashboard-nav-menu" hidden/);
  click('toggle-dashboard-menu');
  assert.match(page.root.innerHTML, /aria-label="Op\u00e7\u00f5es do dashboard" aria-expanded="true"/);
  click('dashboard-financial');
  assert.equal(page.location.pathname, '/dashboard');
  assert.match(page.root.innerHTML, /Receita por empresa/);
  assert.doesNotMatch(page.root.innerHTML, /class="dashboard-switch"/);
});


test('a barra lateral muda de tamanho sem substituir o cabecalho', () => {
  const page = createPage('/dashboard');
  let expanded = false;
  const header = { classList: { toggle(name, value) { if (name === 'nav-expanded') expanded = value; } } };
  page.fields['.manager-header'] = header;
  const attributes = {};
  const control = { dataset: { action: 'toggle-nav-size' }, setAttribute(name, value) { attributes[name] = value; } };
  const before = page.root.innerHTML;
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? control : null } });
  assert.equal(expanded, true);
  assert.equal(attributes['aria-expanded'], 'true');
  assert.equal(page.root.innerHTML, before);
  assert.equal(page.storage.getItem('avaliaplay-nav-expanded'), 'true');
});


test('topico do perfil anima abertura e fechamento preservando o estado nativo', () => {
  const page = createPage('/clientes');
  const frames = [];
  const group = { open: false, style: {}, scrollHeight: 300, getBoundingClientRect() { return { height: this.open ? 300 : 60 }; }, animate(keyframes) { const animation = { cancel() {} }; frames.push({ keyframes, animation }); return animation; } };
  const summary = { parentElement: group, offsetHeight: 60 };
  const event = { target: { closest: selector => selector === 'details.profile-group > summary' ? summary : null }, preventDefault() {} };
  page.listeners.click(event);
  assert.equal(group.open, true);
  assert.equal(frames[0].keyframes[1].height, '300px');
  frames[0].animation.onfinish();
  page.listeners.click(event);
  assert.equal(frames[1].keyframes[1].height, '60px');
  frames[1].animation.onfinish();
  assert.equal(group.open, false);
  assert.equal(group.style.overflow, '');
});


test('fechar formularios abertos no perfil retorna ao perfil sem salvar', () => {
  const page = createPage('/clientes');
  const click = (action, id = '1') => {
    const control = { dataset: { action, id }, classList: { contains: () => false } };
    page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? control : null } });
  };
  click('profile');
  const original = page.storage.getItem('avaliaplay-data');
  for (const action of ['new-task', 'new-opportunity', 'new-contact', 'edit-sla', 'edit-service-profile', 'new-incident', 'edit-client', 'new-meeting']) {
    click(action);
    assert.match(page.root.innerHTML, /profile-form-modal/, action);
    click('close');
    assert.match(page.root.innerHTML, /class="profile-scroll"/, action);
  }
  assert.equal(page.storage.getItem('avaliaplay-data'), original);
  click('close');
  assert.doesNotMatch(page.root.innerHTML, /class="profile-scroll"/);
});


test('feedbacks navegam em paginas e reiniciam ao filtrar', () => {
  const feedbacks = Array.from({ length: 19 }, (_, index) => ({ id: index + 1, comment: `Comentario ${index + 1}`, client: 'Empresa', service: 'Internet', rating: 4, sentiment: 'Positivo', date: '01/11/2026' }));
  const page = createPage('/feedbacks', { demoDataVersion: 6, clients: [], services: [], feedbacks });
  const click = action => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action } } : null } });
  assert.match(page.root.innerHTML, /1\u20138 de 19 registros/);
  assert.match(page.root.innerHTML, /Comentario 1</);
  assert.doesNotMatch(page.root.innerHTML, /Comentario 9</);
  click('feedback-next');
  assert.match(page.root.innerHTML, /9\u201316 de 19 registros/);
  assert.match(page.root.innerHTML, /Comentario 9</);
  click('feedback-next');
  assert.match(page.root.innerHTML, /17\u201319 de 19 registros/);
  assert.match(page.root.innerHTML, /data-action="feedback-next" disabled/);
  click('feedback-prev');
  assert.match(page.root.innerHTML, /9\u201316 de 19 registros/);
  page.fields['#feedback-search, #triage-search'] = { value: 'Comentario 1' };
  click('filter');
  assert.match(page.root.innerHTML, /P\u00e1gina 1 de 2/);
  page.fields['#feedback-search, #triage-search'] = { value: 'Nao existe' };
  click('filter');
  assert.match(page.root.innerHTML, /Nenhum registro/);
  assert.match(page.root.innerHTML, /data-action="feedback-next" disabled/);
});


test('leitura do clima identifica predominancia, empate e ausencia de dados', () => {
  const feedback = sentiment => ({ comment: 'Teste', client: 'Empresa', service: 'Servico', rating: 3, sentiment, date: '01/11/2026' });
  const show = sentiments => createPage('/dashboard', { demoDataVersion: 6, clients: [], services: [], feedbacks: sentiments.map(feedback) }).root.innerHTML;
  assert.match(show(['Negativo', 'Negativo', 'Positivo']), /Predominam coment\u00e1rios <span class="sentiment-insight-word rose">negativos<\/span>/);
  assert.match(show(['Negativo', 'Negativo', 'Positivo']), /2 de 3 coment\u00e1rios foram classificados como negativos/);
  assert.match(show(['Positivo', 'Negativo']), /Sentimentos empatados/);
  assert.match(show([]), /Ainda n\u00e3o h\u00e1 sentimentos registrados/);
});


test('notas ordenam antes da paginacao nos dois sentidos', () => {
  const feedbacks = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, comment: `Nota-${i + 1}`, client: 'Empresa', service: 'Servico', rating: i + 1, sentiment: 'Positivo', date: '01/11/2026' }));
  const page = createPage('/feedbacks', { demoDataVersion: 6, clients: [], services: [], feedbacks });
  const click = action => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action } } : null } });
  assert.match(page.root.innerHTML, /aria-sort="none"/);
  click('feedback-sort');
  assert.match(page.root.innerHTML, /aria-sort="descending"/);
  assert.ok(page.root.innerHTML.indexOf('Nota-10</td>') < page.root.innerHTML.indexOf('Nota-9</td>'));
  assert.doesNotMatch(page.root.innerHTML, /Nota-1<\/td>/);
  click('feedback-next');
  assert.match(page.root.innerHTML, /Nota-1<\/td>/);
  click('feedback-sort');
  assert.match(page.root.innerHTML, /aria-sort="ascending"/);
  assert.match(page.root.innerHTML, /P\u00e1gina 1 de 2/);
  assert.ok(page.root.innerHTML.indexOf('Nota-1</td>') < page.root.innerHTML.indexOf('Nota-2</td>'));
});


test('datas ordenam cronologicamente e substituem a ordenacao por nota', () => {
  const feedbacks = ['05/01/2026', '28/12/2025', '14/11/2026'].map((date, i) => ({ id: i + 1, comment: `Data-${i}`, client: 'Empresa', service: 'Servico', rating: i + 1, sentiment: 'Positivo', date }));
  const page = createPage('/feedbacks', { demoDataVersion: 6, clients: [], services: [], feedbacks });
  const click = action => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action } } : null } });
  click('feedback-sort');
  click('feedback-sort-date');
  assert.match(page.root.innerHTML, /aria-sort="descending"><button type="button" class="rating-sort descending" data-action="feedback-sort-date"/);
  assert.ok(page.root.innerHTML.indexOf('Data-2</td>') < page.root.innerHTML.indexOf('Data-0</td>'));
  assert.ok(page.root.innerHTML.indexOf('Data-0</td>') < page.root.innerHTML.indexOf('Data-1</td>'));
  click('feedback-sort-date');
  assert.match(page.root.innerHTML, /aria-sort="ascending"><button type="button" class="rating-sort ascending" data-action="feedback-sort-date"/);
  assert.ok(page.root.innerHTML.indexOf('Data-1</td>') < page.root.innerHTML.indexOf('Data-0</td>'));
});


test('selecionar barra filtra indicadores do dia e permite voltar ao total', () => {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const br = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const feedbacks = [{ id: 101, date: br(today), comment: 'Hoje', client: 'Teste', service: 'Internet', rating: 5, sentiment: 'Positivo' }, { id: 102, date: br(yesterday), comment: 'Ontem', client: 'Teste', service: 'Internet', rating: 1, sentiment: 'Negativo' }];
  const page = createPage('/dashboard', { demoDataVersion: 6, clients: [{ id: 999, name: 'Teste' }], services: [], feedbacks });
  const click = (action, date) => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action, date } } : null } });
  assert.match(page.root.innerHTML, /Feedbacks recebidos<\/div><strong>2<\/strong>/);
  click('dashboard-select-day', key(today));
  assert.match(page.root.innerHTML, /Feedbacks recebidos<\/div><strong>1<\/strong>/);
  assert.match(page.root.innerHTML, /Nota m\u00e9dia<\/div><strong>5,0<\/strong>/);
  assert.match(page.root.innerHTML, /Ver todos os dias/);
  assert.match(page.root.innerHTML, new RegExp(`data-date="${key(yesterday)}"`));
  click('dashboard-clear-day');
  assert.match(page.root.innerHTML, /Feedbacks recebidos<\/div><strong>2<\/strong>/);
  assert.doesNotMatch(page.root.innerHTML, /Ver todos os dias/);
});


test('grafico permite ampliar periodo ate 31 dias e selecionar uma data antiga', () => {
  const today = new Date();
  const old = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 25);
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const br = d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const makeFeedback = (d, id) => ({ id, date: br(d), comment: 'Teste', client: 'Empresa', service: 'Servico', rating: 4, sentiment: 'Positivo' });
  const page = createPage('/dashboard', { demoDataVersion: 6, clients: [], services: [], feedbacks: [makeFeedback(today, 101), makeFeedback(old, 102)] });
  assert.match(page.root.innerHTML, /--chart-days:14/);
  assert.doesNotMatch(page.root.innerHTML, new RegExp(`data-date="${key(old)}"`));
  page.listeners.change({ target: { id: 'dashboard-period', value: '31' } });
  assert.match(page.root.innerHTML, /--chart-days:31/);
  assert.match(page.root.innerHTML, new RegExp(`data-date="${key(old)}"`));
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'dashboard-select-day', date: key(old) } } : null } });
  assert.match(page.root.innerHTML, /Feedbacks recebidos<\/div><strong>1<\/strong>/);
  page.listeners.change({ target: { id: 'dashboard-period', value: '21' } });
  assert.match(page.root.innerHTML, /--chart-days:21/);
  assert.doesNotMatch(page.root.innerHTML, /Ver todos os dias/);
  page.listeners.change({ target: { id: 'dashboard-period', value: '32' } });
  assert.match(page.root.innerHTML, /--chart-days:21/);
});


test('acesso a plataforma navega depois da animacao e ignora cliques repetidos', () => {
  let finish, calls = 0;
  const page = createPage('/', undefined, false, { setTimeout(callback, delay) { calls++; assert.equal(delay, 380); finish = callback; } });
  const classes = new Set();
  const link = { matches: () => true, getAttribute: () => '/login', classList: { contains: value => classes.has(value), add: value => classes.add(value) } };
  const event = { target: { closest: selector => selector === '[data-link]' ? link : null }, preventDefault() {} };
  page.listeners.click(event);
  page.listeners.click(event);
  assert.equal(page.location.pathname, '/');
  assert.equal(calls, 1);
  assert.ok(classes.has('is-entering'));
  finish();
  assert.equal(page.location.pathname, '/login');
});


test('controle do login mostra e oculta senha sem apagar o valor', () => {
  const page = createPage('/login', undefined, false);
  const input = { type: 'password', value: 'teste123' };
  page.fields['#login-password'] = input;
  const attrs = {};
  const control = { dataset: { action: 'toggle-login-password' }, setAttribute(name, value) { attrs[name] = value; } };
  const event = { target: { closest: selector => selector === '[data-action]' ? control : null } };
  page.listeners.click(event);
  assert.equal(input.type, 'text');
  assert.equal(attrs['aria-label'], 'Ocultar senha');
  assert.equal(attrs['aria-pressed'], 'true');
  page.listeners.click(event);
  assert.equal(input.type, 'password');
  assert.equal(input.value, 'teste123');
  assert.equal(attrs['aria-label'], 'Mostrar senha');
  assert.equal(attrs['aria-pressed'], 'false');
});


test('analise por empresa filtra feedbacks e estima SLA pelas ocorrencias', () => {
  const clients = [{ id: 101, name: 'Empresa A', slaIncidents: [{ title: 'Falha', status: 'Resolvida' }] }, { id: 102, name: 'Empresa B', slaIncidents: [] }, { id: 103, name: 'Empresa C' }];
  const feedbacks = [{ id: 101, client: 'Empresa A', comment: 'Primeira', service: 'Internet', rating: 2, sentiment: 'Negativo', date: '01/11/2026' }, { id: 102, client: 'Empresa B', comment: 'Segunda', service: 'Internet', rating: 5, sentiment: 'Positivo', date: '01/11/2026' }];
  const page = createPage('/dashboard', { demoDataVersion: 6, clients, services: [], feedbacks });
  const click = (action, id) => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action, id }, classList: { contains: () => false } } : null } });
  assert.match(page.root.innerHTML, /aria-label="An\u00e1lise geral"/);
  assert.match(page.root.innerHTML, /Análise dos feedbacks <span class="dashboard-heading-scope">geral<\/span>/);
  click('dashboard-company-open');
  assert.match(page.root.innerHTML, /Selecione uma empresa/);
  click('dashboard-company-select', '101');
  assert.match(page.root.innerHTML, /Análise dos feedbacks: <span class="dashboard-heading-scope">Empresa A<\/span>/);
  assert.match(page.root.innerHTML, /Feedbacks recebidos<\/div><strong>1<\/strong>/);
  assert.match(page.root.innerHTML, /Possível descumprimento/);
  assert.match(page.root.innerHTML, /1 ocorrência registrada/);
  click('dashboard-company-open');
  click('dashboard-company-select', '102');
  assert.match(page.root.innerHTML, /Indicativo de cumprimento/);
  click('dashboard-company-open');
  click('dashboard-company-select', '103');
  assert.match(page.root.innerHTML, /Indicativo de cumprimento/);
  click('dashboard-company-all');
  assert.match(page.root.innerHTML, /Feedbacks recebidos<\/div><strong>2<\/strong>/);
});

test('sla permite anexar e baixar documento sem perder o arquivo', async () => {
  const page = createPage('/clientes/1');
  const click = action => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action, id: '1' } } : null } });
  click('edit-sla');
  assert.match(page.root.innerHTML, /name="slaAttachment"/);
  const form = { id: 'client-extra-form', dataset: { clientId: '1', kind: 'edit-sla' }, values: { slaContract: 'Contrato' }, querySelector: () => ({ files: [{ name: 'sla.pdf', type: 'application/pdf', size: 100 }] }) };
  await page.listeners.submit({ preventDefault() {}, target: form });
  const saved = JSON.parse(page.storage.getItem('avaliaplay-data'));
  assert.equal(saved.clients[0].slaAttachment.name, 'sla.pdf');
  assert.match(page.root.innerHTML, /download="sla.pdf"/);
  assert.match(page.root.innerHTML, /Possível descumprimento/);
  click('edit-sla');
  await page.listeners.submit({ preventDefault() {}, target: { ...form, querySelector: () => ({ files: [] }) } });
  assert.equal(JSON.parse(page.storage.getItem('avaliaplay-data')).clients[0].slaAttachment.name, 'sla.pdf');
});


test('filtro de empresa da lista considera apenas feedbacks correspondentes', () => {
  const feedbacks = ['Empresa A', 'Empresa B'].map((client, i) => ({ id: i + 101, client, comment: `Relato ${i}`, service: 'Internet', rating: 4, sentiment: 'Positivo', date: '01/11/2026' }));
  const page = createPage('/feedbacks', { demoDataVersion: 6, clients: [], services: [], feedbacks });
  page.fields['#feedback-company-filter'] = { value: 'Empresa B' };
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'filter' } } : null } });
  assert.match(page.root.innerHTML, /Relato 1/);
  assert.doesNotMatch(page.root.innerHTML, /Relato 0/);
  assert.match(page.root.innerHTML, /1\u20131 de 1 registros/);
});

test('sla rejeita arquivo acima do limite sem alterar o contrato salvo', async () => {
  const page = createPage('/clientes/1');
  page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'edit-sla', id: '1' } } : null } });
  const before = page.storage.getItem('avaliaplay-data');
  const form = { id: 'client-extra-form', dataset: { clientId: '1', kind: 'edit-sla' }, values: { slaContract: 'Novo resumo' }, querySelector: () => ({ files: [{ name: 'sla.pdf', size: 2 * 1024 * 1024 + 1 }] }) };
  await page.listeners.submit({ preventDefault() {}, target: form });
  assert.equal(page.storage.getItem('avaliaplay-data'), before);
  assert.match(page.root.innerHTML, /arquivo do SLA deve ter at\u00e9 2 MB/);
});


test('cancelar selecao de empresa mantem a analise anterior', () => {
  const clients = [{ id: 101, name: 'Empresa A', slaIncidents: [] }, { id: 102, name: 'Empresa B', slaIncidents: [] }];
  const page = createPage('/dashboard', { demoDataVersion: 6, clients, services: [], feedbacks: [] });
  const click = (action, id) => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action, id }, classList: { contains: () => false } } : null } });
  click('dashboard-company-open');
  click('dashboard-company-select', '101');
  assert.match(page.root.innerHTML, /An\u00e1lise de SLA/);
  click('dashboard-company-open');
  assert.match(page.root.innerHTML, /Selecione uma empresa/);
  click('close');
  assert.match(page.root.innerHTML, /An\u00e1lise de SLA/);
  assert.doesNotMatch(page.root.innerHTML, /Selecione uma empresa/);
  assert.match(page.root.innerHTML, /aria-label="An\u00e1lise por empresa"[^>]*aria-pressed="true"/);
});


test('card de sla substitui ranking e abre o perfil com a secao de sla aberta', () => {
  const client = { id: 101, name: 'Empresa A', slaIncidents: [] };
  const page = createPage('/dashboard', { demoDataVersion: 6, clients: [client], services: [], feedbacks: [] });
  const click = (action, id, openSection) => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action, id, openSection }, classList: { contains: () => false } } : null } });
  assert.match(page.root.innerHTML, /Top 3 empresas mais recorrentes/);
  click('dashboard-company-open'); click('dashboard-company-select', '101');
  assert.match(page.root.innerHTML, /An\u00e1lise de SLA/);
  assert.doesNotMatch(page.root.innerHTML, /Top 3 empresas mais recorrentes/);
  assert.match(page.root.innerHTML, /data-open-section="sla"/);
  click('profile', '101', 'sla');
  assert.match(page.root.innerHTML, /<details class="profile-group" open><summary><span class="profile-section-heading"><strong>Empresa e atendimento/);
  assert.match(page.root.innerHTML, /id="profile-sla"/);
});


test('busca de empresas filtra por nome sem diferenciar acentos e permite limpar', () => {
  const page = createPage('/dashboard', { demoDataVersion: 6, clients: [{ id: 1, name: 'Acrilex' }, { id: 2, name: 'Tecnolab' }], services: [], feedbacks: [] });
  const click = action => page.listeners.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action }, classList: { contains: () => false } } : null } });
  click('dashboard-company-open');
  assert.match(page.root.innerHTML, /id="dashboard-company-search"/);
  const choices = [{ textContent: 'Acrilex', hidden: false }, { textContent: 'Tecnolab', hidden: false }];
  const empty = { hidden: true };
  page.fields['.dashboard-company-list'] = { querySelectorAll: () => choices, querySelector: () => empty };
  page.listeners.input({ target: { id: 'dashboard-company-search', value: 'técno' } });
  assert.equal(choices[0].hidden, true);
  assert.equal(choices[1].hidden, false);
  assert.equal(empty.hidden, true);
  page.listeners.input({ target: { id: 'dashboard-company-search', value: 'inexistente' } });
  assert.equal(empty.hidden, false);
  page.listeners.input({ target: { id: 'dashboard-company-search', value: '' } });
  assert.ok(choices.every(choice => !choice.hidden));
  assert.equal(empty.hidden, true);
});


test('visao interna destaca cliente e relacao no titulo', () => {
  const html = renderRoute('/');
  assert.match(html, /Conhe\u00e7a cada <span>cliente\.<\/span>/);
  assert.match(html, /Cuide de cada <span>rela\u00e7\u00e3o\.<\/span>/);
});

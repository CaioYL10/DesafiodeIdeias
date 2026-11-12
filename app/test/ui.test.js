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
    ['/', 'Conheça cada cliente'],
    ['/login', 'Entrar na gestão'],
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

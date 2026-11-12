const app = document.querySelector('#app');
const DEMO_DATA_VERSION = 6;
const MIN_RECURRING_FEEDBACKS = 3;
const demoClient = { id: 0, name: 'Empresa de demonstração' };
const demoRepairFeedbacks = [
  ['Prometeram retorno sobre nossa solicitação, mas ninguém respondeu.', 'Demora no retorno'],
  ['A equipe ficou esperando uma atualização do atendimento por vários dias.', 'Demora no retorno'],
  ['Precisamos cobrar novamente para receber uma resposta do nosso contato.', 'Demora no retorno'],
  ['O prazo de retorno combinado com a equipe não foi cumprido.', 'Demora no retorno'],
  ['Não tivemos resposta depois de registrar a dificuldade com o serviço.', 'Demora no retorno'],
  ['O atendimento encerrou a conversa sem dar o retorno prometido.', 'Demora no retorno'],
  ['Acompanhamos o chamado, mas a resposta chegou tarde demais.', 'Demora no retorno'],
  ['Tivemos que repetir o contexto da empresa a cada novo contato.', 'Falta de contexto'],
  ['A conversa com a equipe não deixou claro quem acompanharia nossa demanda.', 'Falta de responsável'],
  ['Não recebemos uma atualização clara sobre os próximos passos.', 'Falta de comunicação']
].map(([comment, theme], index) => ({
  id: index + 6, client: demoClient.name, comment, service: 'Internet dedicada',
  rating: 2, sentiment: 'Negativo', area: 'Atendimento', theme, date: new Date(2026, 9, 28 + index).toLocaleDateString('pt-BR'), decision: ''
}));
const initial = {
  demoDataVersion: DEMO_DATA_VERSION,
  clients: [
    { id: 1, name: 'Formtap', contact: 'Marina Lopes (demonstração)', email: 'marina@formtap.example.com', services: ['Internet dedicada'], meetings: [{ title: 'Revisão de conectividade', date: '03/11/2026', notes: 'Acompanhamento fictício do link principal.' }], address: { cep: '01001-000', city: 'São Paulo', stateCode: 'SP' }, relationStrength: 4 },
    { id: 2, name: 'Tecnolab', contact: 'Rafael Mendes (demonstração)', email: 'rafael@tecnolab.example.com', services: ['Segurança de rede'], meetings: [{ title: 'Revisão de segurança', date: '30/10/2026', notes: 'Revisão fictícia das regras de acesso.' }], address: { cep: '30140-000', city: 'Belo Horizonte', stateCode: 'MG' }, relationStrength: 3 },
    { id: 3, name: 'Sicredi', contact: 'Juliana Costa (demonstração)', email: 'juliana@sicredi.example.com', services: ['Infraestrutura em nuvem'], meetings: [{ title: 'Acompanhamento de cloud', date: '02/11/2026', notes: 'Registro fictício sobre capacidade e disponibilidade.' }], address: { cep: '80010-000', city: 'Curitiba', stateCode: 'PR' }, relationStrength: 5 },
    { id: 4, name: 'Acrilex', contact: 'Bruno Almeida (demonstração)', email: 'bruno@acrilex.example.com', services: ['Internet dedicada'], meetings: [{ title: 'Alinhamento de atendimento', date: '29/10/2026', notes: 'Conversa fictícia sobre canais de suporte.' }], address: { cep: '40010-000', city: 'Salvador', stateCode: 'BA' }, relationStrength: 3 },
    { id: 5, name: 'Maple Bear', contact: 'Camila Rocha (demonstração)', email: 'camila@maplebear.example.com', services: ['Infraestrutura em nuvem'], meetings: [{ title: 'Revisão de serviços', date: '01/11/2026', notes: 'Acompanhamento fictício dos serviços em nuvem.' }], address: { cep: '70040-010', city: 'Brasília', stateCode: 'DF' }, relationStrength: 4 },
    { id: 6, name: '99', contact: 'Felipe Santos (demonstração)', email: 'felipe@99.example.com', services: ['Segurança de rede'], meetings: [{ title: 'Check-in de relacionamento', date: '28/10/2026', notes: 'Registro fictício de acompanhamento da conta.' }], address: { cep: '20040-020', city: 'Rio de Janeiro', stateCode: 'RJ' }, relationStrength: 5 }
  ],
  feedbacks: [
    { id: 1, client: demoClient.name, comment: 'Instabilidade na conexão durante o horário comercial.', service: 'Internet dedicada', rating: 2, sentiment: 'Negativo', date: '28/10/2026', decision: '' },
    { id: 2, client: 'Cliente não vinculado', comment: 'Atendimento rápido e objetivo no suporte.', service: 'Internet dedicada', rating: 5, sentiment: 'Positivo', date: '29/10/2026', decision: '' },
    { id: 3, client: demoClient.name, comment: 'A migração para a cloud foi tranquila, mas faltou documentação.', service: 'Infraestrutura em nuvem', rating: 4, sentiment: 'Neutro', date: '27/10/2026', decision: '' },
    { id: 4, client: demoClient.name, comment: 'O alerta de segurança chegou com atraso.', service: 'Segurança de rede', rating: 3, sentiment: 'Neutro', date: '26/10/2026', decision: '' },
    { id: 5, client: demoClient.name, comment: 'Gostei da experiência com o novo painel.', service: 'Infraestrutura em nuvem', rating: 5, sentiment: 'Positivo', date: '30/10/2026', decision: '' },
    ...demoRepairFeedbacks,
    { id: 16, client: 'Formtap', comment: 'A conexão se manteve estável durante a última semana.', service: 'Internet dedicada', rating: 5, sentiment: 'Positivo', date: '04/11/2026', decision: '' },
    { id: 17, client: 'Tecnolab', comment: 'A equipe explicou com clareza os alertas de segurança.', service: 'Segurança de rede', rating: 4, sentiment: 'Positivo', date: '03/11/2026', decision: '' },
    { id: 18, client: 'Sicredi', comment: 'A expansão do ambiente em nuvem ocorreu sem interrupções.', service: 'Infraestrutura em nuvem', rating: 5, sentiment: 'Positivo', date: '05/11/2026', decision: '' },
    { id: 19, client: 'Acrilex', comment: 'O retorno sobre a solicitação poderia ter sido mais rápido.', service: 'Internet dedicada', rating: 3, sentiment: 'Neutro', date: '02/11/2026', decision: '' },
    { id: 20, client: 'Maple Bear', comment: 'O suporte acompanhou a mudança até a conclusão.', service: 'Infraestrutura em nuvem', rating: 4, sentiment: 'Positivo', date: '04/11/2026', decision: '' },
    { id: 21, client: '99', comment: 'As orientações sobre proteção de rede foram úteis.', service: 'Segurança de rede', rating: 4, sentiment: 'Positivo', date: '01/11/2026', decision: '' }
  ],
  services: [
    { name: 'Internet dedicada', type: 'Serviço', description: 'Internet dedicada de alta performance e estável para conectar a empresa.' },
    { name: 'Segurança de rede', type: 'Serviço', description: 'Proteção da rede contra ataques cibernéticos.' },
    { name: 'Infraestrutura em nuvem', type: 'Serviço', description: 'Gerenciamento da infraestrutura em nuvem com alto nível de conectividade.' }
  ],
  actions: [],
  repairReviews: []
};

// Cenários fictícios para explorar o dashboard e os diferentes níveis de triagem.
const demoAccounts = [
  { monthlyRevenue: 18500, slaContract: 'Exemplo: disponibilidade mensal de 99,9% para internet dedicada; atendimento crítico em até 2 horas.', slaIncidents: [{ title: 'Interrupção do link principal', severity: 'P1', status: 'Em andamento', date: '07/11/2026' }, { title: 'Retorno fora do prazo combinado', severity: 'P3', status: 'Em triagem', date: '09/11/2026' }] },
  { monthlyRevenue: 12400, slaContract: 'Exemplo: resposta inicial a incidentes críticos de segurança em até 1 hora.', slaIncidents: [{ title: 'Alerta crítico comunicado com atraso', severity: 'P2', status: 'Em triagem', date: '08/11/2026' }] },
  { monthlyRevenue: 29800, slaContract: 'Exemplo: disponibilidade mensal de 99,95% para a infraestrutura em nuvem.', slaIncidents: [] },
  { monthlyRevenue: 7600, slaContract: 'Exemplo: disponibilidade mensal de 99,5% para o acesso dedicado.', slaIncidents: [{ title: 'Oscilação breve de conectividade', severity: 'P4', status: 'Resolvida', date: '05/11/2026' }] },
  { monthlyRevenue: 14300, slaContract: 'Exemplo: resposta inicial a falhas de cloud em até 4 horas.', slaIncidents: [{ title: 'Lentidão na recuperação de ambiente', severity: 'P3', status: 'Em andamento', date: '10/11/2026' }] },
  { monthlyRevenue: 22100, slaContract: 'Exemplo: resposta inicial a incidentes de segurança P1 em até 1 hora.', slaIncidents: [] }
];
const monthKey = offset => {
  const date = new Date();
  const month = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
};
const demoRevenueHistory = [
  [14500, 15200, 15800, 16700, 17500],
  [10000, 10400, 10900, 11600, 12000],
  [22000, 23000, 25000, 26300, 27900],
  [6200, 6500, 6800, 7100, 7400],
  [11500, 11900, 12600, 13000, 13800],
  [18500, 19000, 20500, 21300, 21700]
];
initial.clients.forEach((client, index) => Object.assign(client, demoAccounts[index]));
initial.clients.forEach((client, index) => {
  client.revenueHistory = demoRevenueHistory[index].map((value, monthIndex) => ({ month: monthKey(monthIndex - 5), value }));
  client.revenueHistory.push({ month: monthKey(0), value: client.monthlyRevenue });
});
initial.clients[0].tasks = [{ id: 1, title: 'Confirmar plano de estabilização do link', owner: 'Equipe de relacionamento', dueDate: '2026-11-16', status: 'Pendente', createdAt: '11/11/2026' }];
initial.clients[1].tasks = [{ id: 1, title: 'Revisar alertas com o cliente', owner: 'Equipe técnica', dueDate: '2026-11-18', status: 'Em andamento', createdAt: '11/11/2026' }];
initial.clients[0].opportunities = [{ id: 1, title: 'Ampliação do link dedicado', value: 8500, stage: 'Proposta', expectedDate: '2026-12-15', note: 'Exemplo fictício de expansão contratual.', createdAt: '11/11/2026' }];
initial.clients[2].opportunities = [{ id: 1, title: 'Expansão da infraestrutura em nuvem', value: 14000, stage: 'Diagnóstico', expectedDate: '2027-01-20', note: 'Exemplo fictício sujeito a análise da equipe.', createdAt: '11/11/2026' }];

const copy = value => JSON.parse(JSON.stringify(value));
async function lookupCep(value, fetcher = globalThis.fetch) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 8) throw new Error('Informe um CEP com 8 dígitos.');
  const response = await fetcher(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) throw new Error('Não foi possível consultar o CEP agora.');
  const result = await response.json();
  if (result.erro) throw new Error('CEP não encontrado. Confira os números e tente novamente.');
  return { cep: result.cep, city: result.localidade, stateCode: result.uf };
}
const demoNames = { 'Empresa Exemplo A': demoClient.name, 'Empresa Exemplo B': demoClient.name, 'Empresa Exemplo C': demoClient.name, 'Aurora Vale Logística': demoClient.name, 'Ponte Azul Tecnologia': demoClient.name, 'Brisa Norte Comércio': demoClient.name };
const demoServices = { Internet: 'Internet dedicada', Suporte: 'Internet dedicada', Cloud: 'Infraestrutura em nuvem', Cibersegurança: 'Segurança de rede', Outro: 'Infraestrutura em nuvem' };
const oldDefaultServices = new Set(['Internet corporativa', 'Cloud', 'Cibersegurança']);
function readData() {
  try {
    const saved = JSON.parse(localStorage.getItem('avaliaplay-data'));
    if (!saved || !Array.isArray(saved.clients) || !Array.isArray(saved.feedbacks) || !Array.isArray(saved.services)) return copy(initial);
    const oldDemoClients = saved.clients.length === 3 && saved.clients.every(client => demoNames[client.name]);
    const needsDemoSeed = oldDemoClients && saved.feedbacks.length === 5 && saved.feedbacks.every((feedback, index) => feedback.id === index + 1);
    if (oldDemoClients) saved.clients = copy(initial.clients);
    saved.feedbacks.forEach(feedback => {
      feedback.client = demoNames[feedback.client] || feedback.client;
      feedback.service = demoServices[feedback.service] || feedback.service;
    });
    if (needsDemoSeed) {
      saved.feedbacks.push(...copy(demoRepairFeedbacks));
    }
    const isOldDemoData = (saved.demoDataVersion || 0) < DEMO_DATA_VERSION;
    initial.clients.forEach(seed => {
      const client = saved.clients.find(item => item.id === seed.id && item.name === seed.name);
      if (!client) return;
      if (!client.contact || /informado/i.test(client.contact) || client.contact === 'Equipe de relacionamento') client.contact = seed.contact;
      if (!client.email) client.email = seed.email;
      if (!Array.isArray(client.services) || !client.services.length) client.services = copy(seed.services);
      if (!Array.isArray(client.meetings)) client.meetings = [];
      if (isOldDemoData && !client.meetings.length) client.meetings = copy(seed.meetings);
      if (isOldDemoData && !client.address?.cep) client.address = copy(seed.address);
      if (!client.relationStrength) client.relationStrength = seed.relationStrength;
      if (client.monthlyRevenue === undefined) client.monthlyRevenue = seed.monthlyRevenue;
      if (!Array.isArray(client.revenueHistory)) client.revenueHistory = copy(seed.revenueHistory);
      if (client.slaContract === undefined) client.slaContract = seed.slaContract;
      if (!Array.isArray(client.slaIncidents)) client.slaIncidents = copy(seed.slaIncidents);
      if (!Array.isArray(client.tasks)) client.tasks = copy(seed.tasks || []);
      if (!Array.isArray(client.opportunities)) client.opportunities = copy(seed.opportunities || []);
    });
    if (isOldDemoData) {
      initial.feedbacks.filter(feedback => feedback.id >= 16).forEach(feedback => {
        if (!saved.feedbacks.some(item => item.id === feedback.id)) saved.feedbacks.push(copy(feedback));
      });
      saved.demoDataVersion = DEMO_DATA_VERSION;
    }
    if (!Array.isArray(saved.actions)) saved.actions = [];
    if (!Array.isArray(saved.repairReviews)) saved.repairReviews = [];
    if (oldDemoClients) {
      saved.actions.forEach(action => {
        if (demoNames[action.clientName]) { action.clientName = demoClient.name; action.clientId = demoClient.id; }
      });
      saved.repairReviews.forEach(review => {
        if (review.clientId === 1 && review.key?.startsWith('1:')) { review.clientId = demoClient.id; review.key = `0:${review.key.slice(2)}`; }
      });
    }
    saved.services = saved.services.filter(service => !oldDefaultServices.has(service.name));
    initial.services.forEach(service => {
      if (!saved.services.some(item => item.name === service.name)) saved.services.push(copy(service));
    });
    try { localStorage.setItem('avaliaplay-data', JSON.stringify(saved)); } catch { /* Mantém os dados da sessão se o armazenamento estiver indisponível. */ }
    return saved;
  } catch { return copy(initial); }
}
const state = { data: readData(), loggedIn: sessionStorage.getItem('avaliaplay-login') === '1', theme: localStorage.getItem('avaliaplay-theme') === 'light' ? 'light' : 'dark', query: '', service: '', sentiment: '', modal: null, map: false, dashboardView: 'feedbacks', toast: '' };
const save = () => localStorage.setItem('avaliaplay-data', JSON.stringify(state.data));
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const path = () => location.pathname.replace(/\/$/, '') || '/';
const go = destination => { history.pushState(null, '', destination); state.modal = null; state.query = ''; state.service = ''; state.sentiment = ''; render(); scrollTo(0, 0); };
const A = '/assets/';
const iconPaths = {
  company: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2m-6 10v-5h4v5"/>',
  report: '<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8m-8 4h6"/>',
  action: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-7h6v7"/>',
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  feedback: '<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8m-8 4h6"/>',
  clients: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2H3Zm12-14a3 3 0 0 1 0 6m2 3a5 5 0 0 1 4 5h-4"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;

function header(current) {
  const publicItems = [['/', 'Visão geral'], ['/login', 'Login']];
  const managerItems = [['/', 'Visão geral'], ['/dashboard', 'Dashboard'], ['/feedbacks', 'Feedbacks'], ['/clientes', 'Clientes e qualidade']];
  const items = state.loggedIn ? managerItems : publicItems;
  const navIcons = ['home', 'dashboard', 'feedback', 'clients'];
  const themeIcon = '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"/>';
  const themeButton = `<button class="theme-toggle" type="button" data-action="toggle-theme" aria-label="Modo escuro" title="Modo escuro" aria-pressed="${state.theme === 'dark'}"><span class="theme-toggle-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${themeIcon}</svg></span><span class="theme-toggle-label">Modo escuro</span><span class="theme-toggle-track" aria-hidden="true"><span class="theme-toggle-thumb"></span></span></button>`;
  const brand = state.loggedIn ? `<span class="logo-mark" aria-hidden="true"><img src="${A}imgImage2.png" alt=""></span><img class="logo-full" src="${A}imgImage2.png" alt="CTI conectando empresas e pessoas">` : `<img src="${A}imgImage2.png" alt="CTI conectando empresas e pessoas">`;
  return `<header class="site-header ${state.loggedIn ? 'manager-header' : 'public-header'}"><a class="logo" href="/" data-link aria-label="CTI, visão geral">${brand}</a><nav aria-label="Navegação principal">${items.map(([url, label], index) => `<a href="${url}" data-link ${current === url ? 'aria-current="page"' : ''}>${state.loggedIn ? `<span class="nav-icon">${icon(navIcons[index])}</span><span class="nav-label">${label}</span>` : label}</a>`).join('')}</nav>${themeButton}${state.loggedIn ? `<button class="signout" type="button" data-action="logout" aria-label="Sair da gestão"><img src="${A}imgSignOut.svg" alt=""><span>Sair da gestão</span></button>` : ''}</header>`;
}
function shell(current, content, narrow = false) { return `${header(current)}<main class="page ${narrow ? 'page-narrow' : ''}">${content}</main>${state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : ''}${state.modal ? modal() : ''}`; }
function title(text, subtitle = '', eyebrow = '') { return `<div class="page-heading">${eyebrow ? `<small>${eyebrow}</small>` : ''}<h1>${text}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>`; }
function button(label, action, kind = 'primary', extra = '') { return `<button type="button" class="button ${kind}" data-action="${action}" ${extra}>${label}</button>`; }
function publicOverview() {
  return `${header('/')}<main class="public-home"><section class="public-overview"><div class="public-copy"><h1>Relacionamento com contexto. Qualidade com direção.</h1><p>Um espaço de trabalho para acompanhar a experiência dos clientes e organizar as melhorias da equipe.</p><a class="button primary" href="/login" data-link>Login</a></div><div class="public-concept" aria-label="Etapas da gestão de relacionamento"><div class="public-concept-head"><span>Uma jornada conectada</span><h2>Do contato à melhoria</h2></div><div class="public-concept-step"><span>01</span><div><strong>Clientes</strong><p>Contexto e histórico da relação</p></div></div><div class="public-concept-step"><span>02</span><div><strong>Relatos</strong><p>Leitura e decisão da equipe</p></div></div><div class="public-concept-step"><span>03</span><div><strong>Ações</strong><p>Acompanhamento da qualidade</p></div></div></div></section></main>`;
}
function overview() {
  const pending = repairCandidates().length;
  const open = state.data.actions.filter(action => action.status !== 'Concluída').length;
  return `${header('/')}<main class="home crm-home"><section class="crm-hero"><div class="crm-copy"><h1>Conheça cada cliente. Cuide de cada relação.</h1><p>Acompanhe o relacionamento com cada empresa, consulte feedbacks e organize ações de melhoria em um só lugar.</p><div class="crm-actions"><a class="button primary" href="/dashboard" data-link>Abrir dashboard</a><a class="button soft" href="/clientes" data-link>Ver clientes</a></div></div><div class="crm-panel" aria-label="Carteira em foco"><div class="crm-panel-row"><span class="crm-row-icon blue">${icon('company')}</span><div><strong>Clientes cadastrados</strong><small>Contexto da carteira</small></div><b>${state.data.clients.length}</b></div><div class="crm-panel-row"><span class="crm-row-icon gold">${icon('report')}</span><div><strong>Triagens de reparação</strong><small>Aguardam revisão da equipe</small></div><b>${pending}</b></div><div class="crm-panel-row"><span class="crm-row-icon green">${icon('action')}</span><div><strong>Ações em acompanhamento</strong><small>Propostas aceitas ainda não concluídas</small></div><b>${open}</b></div></div></section><nav class="crm-links" aria-label="Acesso rápido"><a href="/clientes" data-link><span class="crm-link-icon" aria-hidden="true">${icon('company')}</span><span class="crm-link-copy"><strong>Clientes</strong><small>Consulte perfis e feedbacks</small></span></a><a href="/triagem" data-link><span class="crm-link-icon" aria-hidden="true">${icon('report')}</span><span class="crm-link-copy"><strong>Triagem de reparação</strong><small>Revise padrões de atendimento</small></span></a><a href="/acoes" data-link><span class="crm-link-icon" aria-hidden="true">${icon('action')}</span><span class="crm-link-copy"><strong>Ações</strong><small>Acompanhe as propostas aceitas</small></span></a></nav></main>`;
}
function login() {
  return shell('/login', `<div class="login-grid"><div class="login-copy"><p class="login-kicker">Acesso à equipe</p><h1>Gestão de relacionamento da CTI.</h1><p>Entre para acompanhar clientes, relatos e ações de qualidade em um só lugar.</p></div><section class="login-card"><small>ÁREA DO GESTOR</small><h2>Entrar na gestão</h2><form id="login-form"><label>E-mail<input name="email" type="email" autocomplete="username" placeholder="gestor@exemplo.com" required></label><label>Senha<input name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required></label><button class="button primary wide">Entrar no painel</button><p class="field-note">Ambiente de demonstração local.</p></form></section></div>`, true);
}
function dashboardCard(label, icon, className, content) {
  const watermark = icon ? `<img class="metric-watermark" src="${A}${icon}" alt="" aria-hidden="true">` : '';
  return `<article class="metric card dashboard-card ${className}">${watermark}<div class="metric-label">${label}</div>${content}</article>`;
}
function metricCard(label, value, note, icon = '') {
  return dashboardCard(label, icon, 'dashboard-metric-card', `<strong>${escapeHtml(value)}</strong><span>${escapeHtml(note)}</span>`);
}
function dashboardHeading(text) {
  const feedbacksActive = state.dashboardView === 'feedbacks';
  return `<div class="dashboard-page-heading"><h1>${text}</h1><div class="dashboard-switch" role="group" aria-label="Visualização do dashboard">${button('Feedbacks', 'dashboard-feedbacks', feedbacksActive ? 'primary' : 'outline', `aria-pressed="${feedbacksActive}"`)}${button('Relações', 'dashboard-relations', state.dashboardView === 'relations' ? 'primary' : 'outline', `aria-pressed="${state.dashboardView === 'relations'}"`)}${button('Financeiro', 'dashboard-financial', state.dashboardView === 'financial' ? 'primary' : 'outline', `aria-pressed="${state.dashboardView === 'financial'}"`)}</div></div>`;
}
function rankingMetric(label, clients, iconName, detail) {
  const rows = clients.map((client, index) => `<li><span class="ranking-position">${index + 1}</span><span class="ranking-name" title="${escapeHtml(client.name)}">${escapeHtml(client.name)}</span>${detail ? `<b>${escapeHtml(detail(client))}</b>` : ''}</li>`).join('');
  return dashboardCard(label, iconName, 'ranking-card', `<ol class="ranking-list">${rows || '<li>Sem dados para este ranking</li>'}</ol>`);
}
function topRecurringClients() {
  const counts = new Map([...state.data.clients, demoClient].map(client => [client.name, 0]));
  state.data.feedbacks.forEach(feedback => { if (counts.has(feedback.client)) counts.set(feedback.client, counts.get(feedback.client) + 1); });
  return [...state.data.clients, demoClient].filter(client => counts.get(client.name) > 0).sort((a, b) => counts.get(b.name) - counts.get(a.name) || a.id - b.id).slice(0, 3).map(client => ({ ...client, feedbackCount: counts.get(client.name) }));
}
function topClosestClients() {
  return [...state.data.clients].filter(client => Number(client.relationStrength) > 0).sort((a, b) => Number(b.relationStrength) - Number(a.relationStrength) || a.id - b.id).slice(0, 3);
}
function reminder(icon, tone, titleText, detail, status) {
  return `<div class="reminder"><span class="reminder-icon ${tone}"><img src="${A}${icon}" alt=""></span><div><strong>${titleText}</strong><p>${detail}</p></div><span class="reminder-status">${status}</span></div>`;
}
function comparisonChart(items, formatValue, maximum) {
  if (!items.length) return '<p class="empty">Nenhum valor cadastrado para comparar.</p>';
  const limit = maximum || Math.max(0, ...items.map(item => item.value));
  return `<div class="comparison-chart" role="img" aria-label="${escapeHtml(items.map(item => `${item.label}: ${formatValue(item.value)}`).join('; '))}">${items.map(item => `<div class="comparison-row"><span class="comparison-name" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span><span class="comparison-track"><span class="comparison-fill" style="width:${limit ? item.value / limit * 100 : 0}%"></span></span><strong>${escapeHtml(formatValue(item.value))}</strong></div>`).join('')}</div>`;
}
function dailyFeedbackChart(feedbacks) {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const counts = new Map();
  feedbacks.forEach(feedback => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(feedback.date || '');
    if (match) {
      const key = `${match[3]}-${match[2]}-${match[1]}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  });
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - 13 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), count: counts.get(key) || 0 };
  });
  const maximum = Math.max(1, ...days.map(day => day.count));
  if (days.every(day => day.count === 0)) return '<p class="empty">Nenhum feedback recebido nos últimos 14 dias.</p>';
  const countLabel = count => `${count} ${count === 1 ? 'feedback' : 'feedbacks'}`;
  return `<div class="daily-chart" role="img" aria-label="${escapeHtml(days.map(day => `${day.label}: ${countLabel(day.count)}`).join('; '))}"><div class="daily-chart-bars">${days.map(day => `<div class="daily-chart-day" title="${day.label}: ${countLabel(day.count)}"><span class="daily-chart-count">${day.count || ''}</span><span class="daily-chart-bar" style="height:${day.count ? Math.round(day.count / maximum * 140) : 0}px"></span><span class="daily-chart-date">${day.label}</span></div>`).join('')}</div></div>`;
}
function sentimentChart(counts) {
  const total = counts.reduce((sum, item) => sum + item.value, 0);
  return `<div class="sentiment-chart"><div class="sentiment-stack" role="img" aria-label="${escapeHtml(counts.map(item => `${item.label}: ${item.value} de ${total}`).join('; '))}">${counts.map(item => `<span class="${item.tone}" style="width:${total ? item.value / total * 100 : 0}%"></span>`).join('')}</div><div class="sentiment-legend">${counts.map(item => `<div><span class="sentiment-label"><i class="dot ${item.tone}"></i>${item.label}</span><strong>${item.value}</strong><small>${total ? Math.round(item.value / total * 100) : 0}%</small></div>`).join('')}</div></div>`;
}
function revenueHistoryChart(clients, money) {
  const months = Array.from({ length: 6 }, (_, index) => monthKey(index - 5));
  const colors = ['#1788cd', '#17b9a9', '#d99a28', '#d86789', '#746bd4'];
  const series = clients.slice(0, 5).map((client, index) => ({
    name: client.name,
    color: colors[index],
    values: months.map(month => {
      const record = client.revenueHistory?.find(item => item.month === month);
      return month === monthKey(0) ? Number(client.monthlyRevenue) : record ? Number(record.value) : null;
    })
  }));
  const maximum = Math.max(5000, Math.ceil(Math.max(0, ...series.flatMap(item => item.values.filter(value => value !== null))) / 5000) * 5000);
  const x = index => 70 + index * 140;
  const y = value => 220 - value / maximum * 180;
  const grid = [0, 1, 2, 3, 4].map(index => {
    const value = maximum * index / 4;
    return `<line x1="70" x2="770" y1="${y(value)}" y2="${y(value)}" class="revenue-grid-line"/><text x="62" y="${y(value) + 4}" text-anchor="end" class="revenue-axis-label">${value ? `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : 'R$ 0'}</text>`;
  }).join('');
  const lines = series.map(item => {
    const points = item.values.map((value, index) => value === null ? null : `${x(index)},${y(value)}`).filter(Boolean);
    return `<polyline points="${points.join(' ')}" fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${item.values.map((value, index) => value === null ? '' : `<circle cx="${x(index)}" cy="${y(value)}" r="4" fill="${item.color}"><title>${escapeHtml(item.name)} · ${months[index]} · ${escapeHtml(money(value))}</title></circle>`).join('')}`;
  }).join('');
  const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const labels = months.map((month, index) => {
    const [year, number] = month.split('-').map(Number);
    return `<text x="${x(index)}" y="251" text-anchor="middle" class="revenue-axis-label">${monthNames[number - 1]}/${String(year).slice(-2)}</text>`;
  }).join('');
  const description = series.map(item => `${item.name}: ${item.values.map((value, index) => value === null ? '' : `${months[index]} ${money(value)}`).filter(Boolean).join(', ')}`).join('; ');
  return `<div class="revenue-history-chart"><svg viewBox="0 0 800 270" role="img" aria-label="${escapeHtml(description)}">${grid}${lines}${labels}</svg><div class="revenue-legend">${series.map(item => `<div class="revenue-legend-item"><i style="background:${item.color}"></i><span>${escapeHtml(item.name)}</span><strong>${escapeHtml(money(item.values.at(-1) || 0))}</strong></div>`).join('')}</div></div>`;
}
function relationsDashboard() {
  const pendingRepairs = repairCandidates().length;
  const missingContacts = state.data.clients.filter(client => !client.email).length;
  return shell('/dashboard', `${dashboardHeading('Análise das relações')}
    <div class="metric-grid relations-metrics">${metricCard('Clientes cadastrados', state.data.clients.length, 'Total de clientes', 'dashboardClients.svg')}${rankingMetric('Top 3 empresas mais próximas', topClosestClients(), 'dashboardStar.svg')}${metricCard('Novos vínculos', '—', 'Sem histórico cadastrado', 'dashboardGrowth.svg')}${metricCard('Relações para revisão', pendingRepairs, 'Padrões de atendimento pendentes', 'dashboardAlert.svg')}</div>
    <div class="dashboard-grid"><section class="card chart-card"><div class="card-heading"><div><h2>Força dos relacionamentos</h2><p>Pontuação cadastrada por empresa, de 1 a 5</p></div><span class="tag">Situação atual</span></div>${comparisonChart([...state.data.clients].filter(client => Number(client.relationStrength) > 0).sort((a, b) => b.relationStrength - a.relationStrength).map(client => ({ label: client.name, value: Number(client.relationStrength) })), value => `${value}/5`, 5)}</section><section class="card reminders"><div class="card-heading"><div><h2>Lembretes importantes</h2><p>Assuntos de urgência</p></div></div><div class="reminder-list">${reminder('dashboardMessage.svg', 'blue', 'Consultar feedbacks', `${state.data.feedbacks.length} relatos de demonstração`, 'Consultar')}${reminder('dashboardLightbulb.svg', 'green', 'Reparações para revisão', `${pendingRepairs} ${pendingRepairs === 1 ? 'análise' : 'análises'} aguardando a equipe`, 'Pendente')}${reminder('dashboardCalendar.svg', 'gold', 'Completar dados dos clientes', `${missingContacts} contatos não informados`, 'Pendente')}</div></section></div>`);
}
function dashboard() {
  if (state.dashboardView === 'relations') return relationsDashboard();
  if (state.dashboardView === 'financial') {
    const clients = state.data.clients.filter(client => Number(client.monthlyRevenue) > 0).sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);
    const total = clients.reduce((sum, client) => sum + Number(client.monthlyRevenue), 0);
    const money = value => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const chartClients = clients.slice(0, 5);
    const concentration = total ? Math.round(clients.slice(0, 3).reduce((sum, client) => sum + Number(client.monthlyRevenue), 0) / total * 100) : 0;
    return shell('/dashboard', `${dashboardHeading('Receita por empresa')}
      <div class="metric-grid financial-metrics">${metricCard('Receita mensal cadastrada', money(total), 'Soma dos valores informados', 'dashboardGrowth.svg')}${metricCard('Projeção anual simples', money(total * 12), '12 meses no mesmo valor, sem reajustes', 'dashboardTrend.svg')}${metricCard('Média por empresa', money(clients.length ? total / clients.length : 0), `${clients.length} empresas com valor`, 'dashboardClients.svg')}${metricCard('Concentração das 3 maiores', `${concentration}%`, 'Participação na receita cadastrada', 'dashboardAlert.svg')}</div>
      <section class="card financial-chart-card"><div class="card-heading"><div><h2>Histórico da receita mensal</h2><p>Cinco empresas com maior valor mensal cadastrado. Série fictícia de demonstração; não representa dados financeiros da CTI.</p></div><span class="tag">Últimos 6 meses · R$</span></div>${chartClients.length ? revenueHistoryChart(chartClients, money) : '<p class="empty">Cadastre uma receita mensal para visualizar o gráfico.</p>'}</section>`);
  }
  const data = state.data.feedbacks;
  const average = data.length ? (data.reduce((sum, f) => sum + Number(f.rating), 0) / data.length).toFixed(1).replace('.', ',') : '0';
  const positive = data.filter(f => f.sentiment === 'Positivo').length;
  const negative = data.filter(f => f.sentiment === 'Negativo').length;
  const neutral = data.filter(f => f.sentiment === 'Neutro').length;
  return shell('/dashboard', `${dashboardHeading('Análise dos feedbacks')}
    <div class="metric-grid">${metricCard('Feedbacks recebidos', data.length, 'Total registrado', 'dashboardClients.svg')}${metricCard('Nota média', average, 'De 1 a 5 pontos', 'dashboardStar.svg')}${metricCard('Sentimento positivo', positive, `${Math.round(positive / (data.length || 1) * 100)}% dos comentários analisados`, 'dashboardGrowth.svg')}${metricCard('Sentimento negativo', negative, 'Sentimento negativo', 'dashboardAlert.svg')}${rankingMetric('Top 3 empresas mais recorrentes', topRecurringClients(), 'dashboardRecurrence.svg', client => `${client.feedbackCount} ${client.feedbackCount === 1 ? 'relato' : 'relatos'}`)}</div>
    <div class="dashboard-grid"><section class="card chart-card"><div class="card-heading"><div><h2>Feedbacks por dia</h2><p>Quantidade recebida em cada dia</p></div><span class="tag">Últimos 14 dias</span></div>${dailyFeedbackChart(data)}</section><section class="card climate"><div class="card-heading"><div><h2>Clima dos comentários</h2><p>Participação de cada sentimento no total</p></div></div>${sentimentChart([{ label: 'Positivo', value: positive, tone: 'green' }, { label: 'Neutro', value: neutral, tone: 'gold' }, { label: 'Negativo', value: negative, tone: 'rose' }])}</section></div>`);
}
function filteredFeedbacks() {
  return state.data.feedbacks.filter(f => (!state.query || `${f.comment} ${f.service} ${f.client}`.toLocaleLowerCase('pt-BR').includes(state.query.toLocaleLowerCase('pt-BR'))) && (!state.service || f.service === state.service) && (!state.sentiment || f.sentiment === state.sentiment));
}
function feedbackTheme(feedback) {
  const text = String(feedback.comment || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/retorn|respond|respost|demor|varios dias/.test(text)) return 'Demora no retorno';
  if (/context|repetir/.test(text)) return 'Falta de contexto';
  if (/responsav|quem acompanh/.test(text)) return 'Falta de responsável';
  if (/atualiz|comunic|proximos passos/.test(text)) return 'Falta de comunicação';
  return feedback.theme || 'Motivo não identificado';
}
function repairCandidates() {
  const groups = new Map();
  state.data.feedbacks.filter(feedback => feedback.sentiment === 'Negativo' && feedback.area === 'Atendimento').forEach(feedback => {
    const theme = feedbackTheme(feedback).trim();
    if (theme === 'Motivo não identificado') return;
    const normalized = theme.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!groups.has(normalized)) groups.set(normalized, { theme, feedbacks: [] });
    groups.get(normalized).feedbacks.push(feedback);
  });
  return [...groups.values()].flatMap(({ theme, feedbacks }) => {
    if (feedbacks.length < MIN_RECURRING_FEEDBACKS) return [];
    const ids = feedbacks.map(feedback => feedback.id).sort((a, b) => a - b);
    const key = `${theme}:${ids.join(',')}`;
    if (state.data.repairReviews.some(review => {
      if (review.key === key) return true;
      const previousIds = new Set((review.key?.split(':')[1] || '').split(',').map(Number));
      return previousIds.size > 0 && ids.every(id => previousIds.has(id));
    })) return [];
    const clients = [...new Set(feedbacks.map(feedback => feedback.client || 'Não vinculada'))];
    const proposal = theme === 'Demora no retorno'
      ? 'Revisar os prazos de retorno com a equipe, definir um responsável por cada atendimento e acompanhar se as respostas chegam no prazo combinado.'
      : `Revisar os atendimentos sobre ${theme.toLocaleLowerCase('pt-BR')}, identificar a causa e registrar uma medida de correção com prazo e responsável.`;
    return [{ theme, feedbacks, clients, repetitions: feedbacks.length, proposal, key }];
  }).sort((a, b) => b.repetitions - a.repetitions);
}
function feedbacks() {
  const rows = filteredFeedbacks();
  return shell('/feedbacks', `${title('Feedbacks', 'Pesquise e acompanhe cada tratativa.')}<section class="card list-card feedback-list"><div class="filters"><input id="feedback-search" type="search" placeholder="Buscar coment&#225;rio..." value="${escapeHtml(state.query)}"><select id="service-filter"><option value="">Todos os serviços</option>${state.data.services.map(service => `<option ${state.service === service.name ? 'selected' : ''}>${escapeHtml(service.name)}</option>`).join('')}</select><select id="sentiment-filter"><option value="">Todos sentimentos</option>${['Positivo', 'Neutro', 'Negativo'].map(v => `<option ${state.sentiment === v ? 'selected' : ''}>${v}</option>`).join('')}</select>${button('Filtrar', 'filter', 'outline')}</div><div class="table-wrap"><table><thead><tr><th>COMENTÁRIO</th><th>EMPRESA</th><th>SERVIÇO</th><th>NOTA</th><th>SENTIMENTO</th><th>RECEBIDO</th></tr></thead><tbody>${rows.map(f => `<tr><td class="feedback-comment">${escapeHtml(f.comment)}</td><td>${escapeHtml(f.client || 'Não vinculada')}</td><td>${escapeHtml(f.service)}</td><td class="rating">&#9733; ${f.rating}</td><td><span class="pill ${f.sentiment.toLowerCase()}">${f.sentiment}</span></td><td>${f.date}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Nenhum feedback encontrado.</td></tr>'}</tbody></table></div><div class="pagination">Página 1 a ${rows.length} registros <span>‹ Anterior &nbsp; Próxima ›</span></div></section>`);
}
function tabs(current) { return `<nav class="tabs" aria-label="Etapas de gestão">${[['/clientes', 'Clientes'], ['/tarefas', 'Tarefas'], ['/oportunidades', 'Oportunidades'], ['/triagem', 'Triagem de reparação'], ['/acoes', 'Ações']].map(([url, label]) => `<a href="${url}" data-link ${current === url ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`; }
function feedbackCount(clientName) { return state.data.feedbacks.filter(feedback => feedback.client === clientName).length; }
function feedbackSummary(clientName) { const count = feedbackCount(clientName); return `${count} ${count === 1 ? 'relato' : 'relatos'}`; }
function clientContacts(client) { return Array.isArray(client.contacts) ? client.contacts : (client.contact ? [{ name: client.contact, email: client.email || '' }] : []); }
function meetingInvitees(value) {
  return [...new Set(String(value || '').split(/[,;\n]+/).map(email => email.trim().toLowerCase()).filter(Boolean))];
}
function readMeetingAttachment(file) {
  if (!file) return Promise.resolve(null);
  if (file.size > 2 * 1024 * 1024) return Promise.reject(new Error('O arquivo da ata deve ter até 2 MB.'));
  if (!/\.(pdf|docx|txt)$/i.test(file.name)) return Promise.reject(new Error('Anexe a ata em PDF, DOCX ou TXT.'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo da ata.'));
    reader.readAsDataURL(file);
  });
}
function clientPriority(client) { const count = (client.slaIncidents || []).filter(item => item.status !== 'Resolvida').length; return count >= 2 ? 'Alta' : count === 1 ? 'Média' : 'Normal'; }
function clientBrandClass(name) { return `brand-${({ Formtap: 'formtap', Tecnolab: 'tecnolab', Sicredi: 'sicredi', Acrilex: 'acrilex', 'Maple Bear': 'maplebear', '99': 'ninenine' })[name] || 'default'}`; }
function clientBrandMark(name) { return ({ Formtap: 'formtap', Tecnolab: 'TECNOLAB', Sicredi: 'Sicredi', Acrilex: 'ACRILEX', 'Maple Bear': 'Maple Bear', '99': '99' })[name] || escapeHtml(name); }
function clients() {
  return shell('/clientes', `${tabs('/clientes')}<section class="card list-card"><div class="card-heading"><div class="inline-heading"><h1>Lista de clientes</h1></div><div class="switcher">${button('Tabela', 'table', !state.map ? 'active' : 'ghost')}${button('Análise no mapa', 'map', state.map ? 'active' : 'ghost')}</div></div>${state.map ? mapView() : `<div class="client-list">${state.data.clients.map(c => `<article class="client-row"><div class="client-wordmark ${clientBrandClass(c.name)}" aria-label="Logo ${escapeHtml(c.name)}"><span>${clientBrandMark(c.name)}</span></div><div><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.contact)} · ${feedbackSummary(c.name)}</p></div><button type="button" data-action="profile" data-id="${c.id}">Ver perfil</button></article>`).join('')}</div>`}</section>`);
}
const mapStates = [
  ['Acre',184,238,132,71,'AC'],['Alagoas',823,269,55,30,'AL'],['Amazonas',187,71,317,216,'AM'],['Amapa',526,32,89,101,'AP'],['Bahia',674,264,166,175,'BA'],['Ceara',766,162,75,90,'CE'],['EspiritoSanto',759,431,39,61,'ES'],['Goias',555,333,131,127,'GO'],['Maranhao',635,130,124,165,'MA'],['MinasGerais',595,366,199,155,'MG'],['MatoGrossoDoSul',467,418,128,123,'MS'],['MatoGrosso',406,243,203,191,'MT'],['Para',454,65,229,222,'PA'],['Paraiba',814,219,70,41,'PB'],['Pernambuco',768,242,117,39,'PE'],['Piaui',685,161,101,145,'PI'],['Parana',531,514,118,75,'PR'],['RioDeJaneiro',705,483,70,45,'RJ'],['RioGrandeDoNorte',817,199,65,37,'RN'],['Rondonia',312,254,126,102,'RO'],['Roraima',348,17,106,123,'RR'],['RioGrandeDoSul',476,596,142,118,'RS'],['SantaCatarina',544,575,96,61,'SC'],['Sergipe',823,282,33,36,'SE'],['SaoPaulo',557,466,160,98,'SP'],['Tocantins',600,204,90,148,'TO'],['DistritoFederal',644,388,17,10,'DF']
];
function mapView() {
  const locatedClients = state.data.clients.filter(client => client.address?.stateCode);
  const counts = new Map();
  locatedClients.forEach(client => counts.set(client.address.stateCode, (counts.get(client.address.stateCode) || 0) + 1));
  const shapes = mapStates.map(([name,x,y,w,h,code]) => {
    const count = counts.get(code) || 0;
    const position = `left:${x/1084*100}%;top:${y/760*100}%;width:${w/1084*100}%;height:${h/760*100}%`;
    const labelPosition = `left:${(x+w/2)/1084*100}%;top:${(y+h/2)/760*100}%`;
    return `<img class="state-shape ${count ? 'state-has-clients' : ''}" src="${A}img${name}.svg" alt="" aria-hidden="true" title="${code}: ${count} ${count === 1 ? 'empresa' : 'empresas'}" style="${position}">${count ? `<div class="map-state-label" aria-label="${code}: ${count} ${count === 1 ? 'empresa' : 'empresas'}" style="${labelPosition}"><span>${code}</span><b>${count}</b></div>` : ''}`;
  }).join('');
  const clientRows = [...locatedClients].sort((a, b) => a.address.stateCode.localeCompare(b.address.stateCode) || a.name.localeCompare(b.name)).map(client => `<li class="map-client"><strong>${escapeHtml(client.name)}</strong><span>${escapeHtml(client.address.city)}, ${escapeHtml(client.address.stateCode)}</span><small>CEP ${escapeHtml(client.address.cep)} · ${feedbackSummary(client.name)}</small></li>`).join('');
  const mapClass = locatedClients.length ? 'brazil-map' : 'brazil-map map-no-data';
  const summary = locatedClients.length ? `${locatedClients.length} empresas em ${counts.size} estados · dados fictícios de demonstração` : 'Cadastre um CEP no perfil de uma empresa para preencher o mapa.';
  return `<div class="map-intro"><div><h2>Mapa da carteira</h2><p>${summary}</p></div></div><div class="${mapClass}" aria-label="Mapa de empresas por estado">${shapes}${locatedClients.length ? '' : '<div class="map-empty"><strong>Sem localização para análise</strong><p>A distribuição por estado aparecerá quando houver dados dos clientes.</p></div>'}</div>${locatedClients.length ? `<ul class="map-client-list">${clientRows}</ul>` : ''}`;
}
const opportunityStages = ['Prospecção', 'Diagnóstico', 'Proposta', 'Negociação', 'Ganha', 'Perdida'];
const moneyBRL = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
function dateKey(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}
function dateBR(value) {
  const key = dateKey(value);
  return key ? `${key.slice(8, 10)}/${key.slice(5, 7)}/${key.slice(0, 4)}` : 'Sem data';
}
function clientTimeline(client) {
  const entries = [];
  const add = (date, type, title, detail = '') => { if (dateKey(date)) entries.push({ date, type, title, detail }); };
  (client.meetings || []).forEach(item => add(item.date, 'Reunião', item.title, item.minutes || item.notes));
  state.data.feedbacks.filter(item => item.client === client.name).forEach(item => add(item.date, 'Feedback', item.comment, `${item.sentiment} · ${item.service}`));
  (client.slaIncidents || []).forEach(item => add(item.date, 'SLA', item.title, `${item.severity} · ${item.status}`));
  (client.invites || []).forEach(item => add(item.date, 'Convite', item.subject, `Rascunho para ${item.email}`));
  (client.tasks || []).forEach(item => add(item.createdAt, 'Tarefa', item.title, `${item.status} · ${item.owner}`));
  (client.opportunities || []).forEach(item => add(item.createdAt, 'Oportunidade', item.title, item.stage));
  (client.tasks || []).forEach(item => (item.history || []).forEach(entry => add(entry.date, 'Tarefa atualizada', item.title, entry.status)));
  (client.opportunities || []).forEach(item => (item.history || []).forEach(entry => add(entry.date, 'Oportunidade atualizada', item.title, entry.stage)));
  state.data.actions.filter(item => item.clientId === client.id || item.clientNames?.includes(client.name)).forEach(item => (item.history || []).forEach(entry => add(entry.date, 'Ação', item.proposal, `${entry.status} · ${entry.note}`)));
  entries.sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)));
  return `<section class="client-work-section"><h2>Linha do tempo</h2><p class="section-note">Reúne registros vinculados a esta empresa, em ordem do mais recente.</p><div class="client-timeline">${entries.map(item => `<article class="timeline-event"><span>${escapeHtml(dateBR(item.date))}</span><div><small>${escapeHtml(item.type)}</small><strong>${escapeHtml(item.title)}</strong>${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ''}</div></article>`).join('') || '<p class="profile-empty">Nenhuma interação registrada.</p>'}</div></section>`;
}
function clientWorkspace(client) {
  const tasks = client.tasks || [];
  const opportunities = client.opportunities || [];
  return `<section class="client-work-section"><div class="client-work-heading"><div><h2>Tarefas de acompanhamento</h2><p class="section-note">Responsável, prazo e situação de cada próximo passo.</p></div>${button('Nova tarefa', 'new-task', 'primary', `data-id="${client.id}"`)}</div>${tasks.map(item => `<article class="work-row"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.owner)} · prazo ${escapeHtml(dateBR(item.dueDate))}</small></div><span class="pill ${item.status === 'Concluída' ? 'positivo' : 'neutro'}">${escapeHtml(item.status)}</span>${button('Atualizar', 'edit-task', 'outline', `data-id="${client.id}" data-item-id="${item.id}"`)}</article>`).join('') || '<p class="profile-empty">Nenhuma tarefa registrada.</p>'}</section><section class="client-work-section"><div class="client-work-heading"><div><h2>Oportunidades</h2><p class="section-note">Possibilidades de expansão em análise, sem alterar a receita contratada.</p></div>${button('Nova oportunidade', 'new-opportunity', 'primary', `data-id="${client.id}"`)}</div>${opportunities.map(item => `<article class="work-row"><div><strong>${escapeHtml(item.title)}</strong><small>${moneyBRL(item.value)} · previsão ${escapeHtml(dateBR(item.expectedDate))}${item.note ? ` · ${escapeHtml(item.note)}` : ''}</small></div><span class="pill ${item.stage === 'Ganha' ? 'positivo' : item.stage === 'Perdida' ? 'negativo' : 'neutro'}">${escapeHtml(item.stage)}</span>${button('Atualizar', 'edit-opportunity', 'outline', `data-id="${client.id}" data-item-id="${item.id}"`)}</article>`).join('') || '<p class="profile-empty">Nenhuma oportunidade registrada.</p>'}</section>${clientTimeline(client)}`;
}
function profileDetails(client) {
  const meetings = Array.isArray(client.meetings) ? client.meetings : [];
  const linkedFeedbacks = state.data.feedbacks.filter(feedback => feedback.client === client.name);
  const contacts = clientContacts(client);
  const brand = `<div class="client-wordmark ${clientBrandClass(client.name)}" aria-label="Marca ${escapeHtml(client.name)}"><span>${clientBrandMark(client.name)}</span></div>`;
  const location = client.address?.cep ? `<p class="profile-location">${escapeHtml(client.address.city)}, ${escapeHtml(client.address.stateCode)} · CEP ${escapeHtml(client.address.cep)}</p>` : '';
  const meetingRows = meetings.length ? [...meetings].sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date))).map((meeting, index) => `<article class="meeting meeting-record"><span class="meeting-date">${escapeHtml(meeting.date)}</span><div><strong>${escapeHtml(meeting.title)}</strong>${meeting.invitationText ? `<small>Convite: ${escapeHtml(meeting.invitationText)}</small>` : ''}${(meeting.invitees || []).map((invitee, inviteeIndex) => `<label class="invitee-status">${escapeHtml(invitee.email)}<select data-meeting-id="${meeting.id ?? meetings.indexOf(meeting)}" data-invitee-index="${inviteeIndex}" data-client-id="${client.id}" aria-label="Resposta de ${escapeHtml(invitee.email)}">${['Sem resposta', 'Confirmado', 'Recusado'].map(status => `<option ${invitee.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>`).join('')}${meeting.minutes || meeting.notes ? `<small><b>Ata:</b> ${escapeHtml(meeting.minutes || meeting.notes)}</small>` : '<small>Ata ainda não preenchida.</small>'}${meeting.attachment ? `<a class="meeting-attachment" href="${escapeHtml(meeting.attachment.dataUrl)}" download="${escapeHtml(meeting.attachment.name)}">Baixar ata anexada: ${escapeHtml(meeting.attachment.name)}</a>` : ''}</div>${button('Editar reunião', 'edit-meeting', 'outline', `data-id="${client.id}" data-item-id="${meeting.id ?? meetings.indexOf(meeting)}"`)}</article>`).join('') : '<p class="profile-empty">Nenhuma reunião registrada.</p>';
  const feedbackRows = linkedFeedbacks.length ? linkedFeedbacks.slice(0, 3).map(feedback => `<p class="profile-feedback"><span>${escapeHtml(feedback.date)}</span>${escapeHtml(feedback.comment)}</p>`).join('') : '<p class="profile-empty">Nenhum feedback vinculado.</p>';
  const inviteRows = (client.invites || []).map(item => `<article class="meeting"><div><strong>${escapeHtml(item.subject)}</strong><small>Para ${escapeHtml(item.email)} · ${escapeHtml(item.date)} · Não enviado</small><small>${escapeHtml(item.message)}</small></div></article>`).join('') || '<p class="profile-empty">Nenhum convite preparado.</p>';
  const incidentRows = (client.slaIncidents || []).map((item, index) => `<article class="meeting"><span class="pill ${item.severity === 'P1' ? 'negativo' : 'neutro'}">${escapeHtml(item.severity)}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.status)} · ${escapeHtml(item.date)}</small></div><button type="button" class="button soft" data-action="resolve-incident" data-id="${client.id}" data-index="${index}">Marcar resolvida</button></article>`).join('') || '<p class="profile-empty">Nenhuma ocorrência registrada.</p>';
  return `<div class="profile-head">${brand}<div class="profile-client-copy"><span class="profile-eyebrow">PERFIL DO CLIENTE</span><h1>${escapeHtml(client.name)}</h1><p>${escapeHtml(client.contact || 'Contato não informado')} · ${escapeHtml(client.email || 'E-mail não informado')}</p>${location}</div><div class="profile-actions">${button('Editar dados', 'edit-client', 'outline', `data-id="${client.id}"`)}${button('Nova reunião', 'new-meeting', 'primary', `data-id="${client.id}"`)}</div></div>
    <div class="metric-grid three profile-metrics">${metricCard('Feedbacks', feedbackCount(client.name), 'Recebidos', 'dashboardMessage.svg')}${metricCard('Reuniões', meetings.length, 'Registradas', 'dashboardCalendar.svg')}${metricCard('Prioridade', clientPriority(client), 'Ocorrências abertas de SLA', 'dashboardAlert.svg')}</div>
    <details class="profile-group" open><summary><span class="profile-section-heading"><strong>Empresa e atendimento</strong><small>Dados essenciais para entender e acompanhar esta relação.</small></span><span class="profile-group-chevron" aria-hidden="true"></span></summary>
    <div class="profile-overview-grid"><section class="profile-panel"><div class="profile-panel-heading"><h3>Contatos da empresa</h3><span>${contacts.length}</span></div>${contacts.map(contact => `<p class="profile-feedback"><strong>${escapeHtml(contact.name)}</strong><span>${escapeHtml(contact.email || 'Sem e-mail')} · ${escapeHtml(contact.role || 'Contato')}</span></p>`).join('') || '<p class="profile-empty">Nenhum contato cadastrado.</p>'}<div class="profile-panel-actions">${button('Adicionar contato', 'new-contact', 'outline', `data-id="${client.id}"`)}</div><div class="profile-panel-divider"></div><h3>Serviços vinculados</h3><div class="profile-service-list">${(client.services || []).length ? (client.services || []).map(service => `<span class="chip">${escapeHtml(service)}</span>`).join('') : '<p class="profile-empty">Nenhum serviço vinculado.</p>'}</div></section>
    <section class="profile-panel"><div class="profile-panel-heading"><h3>Qualidade e SLA</h3></div><div class="profile-info-block"><h4>Contrato de SLA</h4><p>${escapeHtml(client.slaContract || 'Contrato não cadastrado. Registre um resumo ou referência fornecida pela equipe.')}</p>${button('Editar contrato', 'edit-sla', 'outline', `data-id="${client.id}"`)}</div><div class="profile-info-block"><h4>Perfil de atendimento</h4><p>${escapeHtml(client.serviceProfile || 'Sem observações revisadas pela equipe.')}</p>${button('Editar observações', 'edit-service-profile', 'outline', `data-id="${client.id}"`)}</div></section></div></details>
    <details class="profile-group"><summary><span class="profile-section-heading"><strong>Histórico recente</strong><small>Reuniões, relatos e ocorrências ligados à empresa.</small></span><span class="profile-group-chevron" aria-hidden="true"></span></summary>
    <div class="profile-record-grid"><section class="profile-panel"><div class="profile-panel-heading"><h3>Últimas reuniões</h3><span>${meetings.length}</span></div>${meetingRows}</section><section class="profile-panel"><div class="profile-panel-heading"><h3>Feedbacks recentes</h3><span>${linkedFeedbacks.length}</span></div>${feedbackRows}</section><section class="profile-panel"><div class="profile-panel-heading"><h3>Ocorrências de SLA</h3><span>${(client.slaIncidents || []).length}</span></div>${incidentRows}<div class="profile-panel-actions">${button('Registrar ocorrência', 'new-incident', 'outline', `data-id="${client.id}"`)}</div></section>${(client.invites || []).length ? `<section class="profile-panel"><div class="profile-panel-heading"><h3>Convites antigos</h3><span>${client.invites.length}</span></div>${inviteRows}</section>` : ""}</div></details>
    <details class="profile-group"><summary><span class="profile-section-heading"><strong>Trabalho da equipe</strong><small>Tarefas, oportunidades e a linha do tempo completa.</small></span><span class="profile-group-chevron" aria-hidden="true"></span></summary><div class="profile-workspace">${clientWorkspace(client)}</div></details>`;
}
function profile(id) {
  const client = state.data.clients.find(c => c.id === Number(id));
  if (!client) return clients();
  if (!state.modal || state.modal.id !== client.id) state.modal = { kind: 'profile', id: client.id };
  return clients();
}
function tasksPage() {
  const rows = state.data.clients.flatMap(client => (client.tasks || []).map(task => ({ client, task })))
    .sort((a, b) => (a.task.status === 'Concluída') - (b.task.status === 'Concluída') || dateKey(a.task.dueDate).localeCompare(dateKey(b.task.dueDate)));
  const today = new Date().toISOString().slice(0, 10);
  return shell('/clientes', `${tabs('/tarefas')}<section class="card list-card"><div class="card-heading"><div><h1>Tarefas de acompanhamento</h1><p>Próximos passos da carteira, com responsável e prazo. Crie tarefas no perfil de cada empresa.</p></div></div><div class="summary"><div><b>${rows.filter(row => row.task.status !== 'Concluída').length}</b><span>Em aberto</span></div><div><b>${rows.filter(row => row.task.status !== 'Concluída' && dateKey(row.task.dueDate) < today).length}</b><span>Atrasadas</span></div><div><b>${rows.filter(row => row.task.status === 'Concluída').length}</b><span>Concluídas</span></div></div><div class="triage-list">${rows.map(({ client, task }) => `<article class="triage-row work-overview-row"><div><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(client.name)} · ${escapeHtml(task.owner)}</p><small>Prazo ${escapeHtml(dateBR(task.dueDate))}${task.status !== 'Concluída' && dateKey(task.dueDate) < today ? ' · Atrasada' : ''}</small></div><span class="pill ${task.status === 'Concluída' ? 'positivo' : 'neutro'}">${escapeHtml(task.status)}</span>${button('Atualizar', 'edit-task', 'outline', `data-id="${client.id}" data-item-id="${task.id}"`)}</article>`).join('') || '<p class="empty">Nenhuma tarefa registrada.</p>'}</div></section>`);
}
function opportunitiesPage() {
  const rows = state.data.clients.flatMap(client => (client.opportunities || []).map(opportunity => ({ client, opportunity })));
  const open = rows.filter(row => !['Ganha', 'Perdida'].includes(row.opportunity.stage));
  return shell('/clientes', `${tabs('/oportunidades')}<section class="card list-card"><div class="card-heading"><div><h1>Oportunidades</h1><p>Acompanhe possibilidades de expansão por etapa. Cadastre novas oportunidades no perfil da empresa.</p></div></div><div class="summary"><div><b>${open.length}</b><span>Em andamento</span></div><div><b>${moneyBRL(open.reduce((sum, row) => sum + Number(row.opportunity.value || 0), 0))}</b><span>Valor estimado em aberto</span></div><div><b>${rows.filter(row => row.opportunity.stage === 'Ganha').length}</b><span>Ganhas</span></div></div><div class="pipeline">${opportunityStages.map(stage => `<section class="pipeline-column"><h2>${stage} <span>${rows.filter(row => row.opportunity.stage === stage).length}</span></h2>${rows.filter(row => row.opportunity.stage === stage).map(({ client, opportunity }) => `<article class="pipeline-card"><strong>${escapeHtml(opportunity.title)}</strong><small>${escapeHtml(client.name)}</small><b>${moneyBRL(opportunity.value)}</b><small>Decisão prevista: ${escapeHtml(dateBR(opportunity.expectedDate))}</small>${button('Atualizar', 'edit-opportunity', 'outline', `data-id="${client.id}" data-item-id="${opportunity.id}"`)}</article>`).join('') || '<p class="profile-empty">Sem oportunidades</p>'}</section>`).join('')}</div><p class="field-note">Valores estimados não entram na receita contratada do painel Financeiro.</p></section>`);
}
function triage() {
  const cases = repairCandidates().filter(item => !state.query || `${item.theme} ${item.clients.join(' ')}`.toLocaleLowerCase('pt-BR').includes(state.query.toLocaleLowerCase('pt-BR')));
  return shell('/clientes', `${tabs('/triagem')}<section class="card list-card repair-page"><div class="card-heading"><div><h1>Triagem de reparação</h1><p>Assuntos que se repetem nos feedbacks de atendimento e precisam de revisão.</p></div><span>${cases.length} ${cases.length === 1 ? 'análise' : 'análises'}</span></div><p class="repair-criteria">Um assunto entra na triagem após ${MIN_RECURRING_FEEDBACKS} feedbacks negativos de atendimento com o mesmo motivo, mesmo que venham de empresas diferentes. Classificação por regras, sujeita à revisão da equipe.</p><div class="filters"><input id="triage-search" type="search" value="${escapeHtml(state.query)}" placeholder="Buscar assunto ou empresa">${button('Buscar', 'filter', 'outline')}</div><div class="triage-list">${cases.map(item => `<article class="triage-row repair-row"><div><h3>${escapeHtml(item.theme)}</h3><p>${item.feedbacks.length} feedbacks negativos · ${item.clients.length} ${item.clients.length === 1 ? 'empresa' : 'empresas'}</p><small>${escapeHtml(item.clients.join(', '))} · Aguardando revisão</small></div><button type="button" data-action="analyze" data-id="${escapeHtml(item.theme)}">Analisar</button></article>`).join('') || '<p class="empty">Nenhuma reparação pendente.</p>'}</div></section>`);
}
function actionsPage() {
  const actions = state.data.actions;
  const pending = actions.filter(action => action.status === 'Pendente').length;
  const active = actions.filter(action => action.status === 'Em andamento').length;
  const completed = actions.filter(action => action.status === 'Concluída').length;
  return shell('/clientes', `${tabs('/acoes')}<section class="card list-card repair-page"><div class="card-heading"><div><h1>Ações</h1><p>Propostas aceitas para conservar a relação com cada empresa, com acompanhamento e histórico.</p></div></div><div class="summary"><div><b>${pending}</b><span>Pendentes</span></div><div><b>${active}</b><span>Em andamento</span></div><div><b>${completed}</b><span>Concluídas</span></div></div><div class="triage-list">${actions.map(action => `<article class="triage-row repair-row"><div><h3>${escapeHtml(action.clientName)}</h3><p>${escapeHtml(action.proposal)}</p><small>${escapeHtml(action.source || 'Origem não registrada')} · ${escapeHtml(action.theme)} · ${action.feedbackIds.length} feedbacks relacionados · Proposta aceita em ${escapeHtml(action.createdAt)}</small><div class="action-status"><span class="pill ${action.status === 'Concluída' ? 'positivo' : 'neutro'}">${escapeHtml(action.status)}</span></div></div><button type="button" data-action="action" data-id="${action.id}">Acompanhar</button></article>`).join('') || '<p class="empty">Nenhuma ação aceita até agora. As propostas aprovadas na triagem aparecerão aqui.</p>'}</div></section>`);
}
function services() {
  return shell('/servicos', `${title('Catálogo de serviços', 'Organize os produtos e serviços da equipe.', 'GESTÃO')}<div class="services-grid"><section class="card form-card"><h2>Novo cadastro</h2><form id="service-form"><label>Nome<input name="name" required maxlength="100"></label><label>Tipo<select name="type"><option>Serviço</option><option>Produto</option></select></label><label>Descrição<textarea name="description" required rows="5" maxlength="500"></textarea></label><button class="button primary wide">Cadastrar</button></form></section><section class="card service-list"><h2>Produtos e serviços cadastrados</h2>${state.data.services.map(s => `<article><small>${escapeHtml(s.type)}</small><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description)}</p></article>`).join('')}</section></div>`);
}
function modal() {
  if (['new-task', 'edit-task', 'new-opportunity', 'edit-opportunity'].includes(state.modal?.kind)) {
    const client = state.data.clients.find(item => item.id === state.modal.id);
    if (!client) return '';
    const isTask = state.modal.kind.endsWith('task');
    const editing = state.modal.kind.startsWith('edit-');
    const item = editing ? (isTask ? client.tasks : client.opportunities)?.find(record => record.id === state.modal.itemId) : null;
    if (editing && !item) return '';
    const fields = isTask
      ? `<label>Tarefa<input name="title" required maxlength="140" value="${escapeHtml(item?.title || '')}"></label><label>Responsável<input name="owner" required maxlength="100" value="${escapeHtml(item?.owner || '')}"></label><label>Prazo<input name="dueDate" type="date" required value="${escapeHtml(item?.dueDate || '')}"></label><label>Situação<select name="status">${['Pendente', 'Em andamento', 'Concluída'].map(status => `<option ${item?.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>`
      : `<label>Oportunidade<input name="title" required maxlength="140" value="${escapeHtml(item?.title || '')}"></label><label>Valor estimado (R$)<input name="value" type="number" min="0" step="0.01" required value="${item?.value ?? ''}"></label><label>Previsão de decisão<input name="expectedDate" type="date" required value="${escapeHtml(item?.expectedDate || '')}"></label><label>Etapa<select name="stage">${opportunityStages.map(stage => `<option ${item?.stage === stage ? 'selected' : ''}>${stage}</option>`).join('')}</select></label><label>Observações<textarea name="note" rows="3" maxlength="500">${escapeHtml(item?.note || '')}</textarea></label><p class="field-note">O valor estimado não entra na receita mensal contratada do painel financeiro.</p>`;
    return `<div class="modal-backdrop" data-action="close"><section class="modal profile-form-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${editing ? 'Atualizar' : 'Nova'} ${isTask ? 'tarefa' : 'oportunidade'}</h2><p>${escapeHtml(client.name)}</p></div><button type="button" class="close" data-action="close" aria-label="Fechar">×</button></div><form id="client-work-form" data-client-id="${client.id}" data-kind="${state.modal.kind}" data-item-id="${item?.id || ''}"><div class="modal-body">${fields}</div><div class="modal-actions"><button class="button primary">Salvar</button></div></form></section></div>`;
  }
  const extraKinds = ['new-contact', 'edit-sla', 'edit-service-profile', 'new-incident'];
  if (extraKinds.includes(state.modal?.kind)) {
    const client = state.data.clients.find(item => item.id === state.modal.id);
    if (!client) return '';
    const kind = state.modal.kind;
    const fields = kind === 'new-contact' ? '<label>Nome<input name="name" required maxlength="100"></label><label>E-mail<input name="email" type="email" required></label><label>Função<input name="role" maxlength="80"></label>'
      : kind === 'edit-sla' ? `<label>Resumo ou referência do contrato<textarea name="slaContract" rows="5" required>${escapeHtml(client.slaContract || '')}</textarea></label><p class="field-note">Inclua apenas informações verificadas pela equipe.</p>`
      : kind === 'edit-service-profile' ? `<label>Observações revisadas pela equipe<textarea name="serviceProfile" rows="5" required>${escapeHtml(client.serviceProfile || '')}</textarea></label>`
      : '<label>Ocorrência<input name="title" required maxlength="140"></label><label>Severidade<select name="severity"><option>P1</option><option>P2</option><option>P3</option><option>P4</option></select></label><label>Situação<select name="status"><option>Em triagem</option><option>Em andamento</option><option>Resolvida</option></select></label><p class="field-note">P1: indisponibilidade crítica; P2: impacto alto; P3: impacto moderado; P4: impacto baixo. Classificação demonstrativa, revisada pela equipe.</p>';
    const headings = { 'new-contact': 'Adicionar contato', 'edit-sla': 'Contrato de SLA', 'edit-service-profile': 'Perfil de atendimento', 'new-incident': 'Registrar ocorrência de SLA' };
    return `<div class="modal-backdrop" data-action="close"><section class="modal profile-form-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${headings[kind]}</h2><p>${escapeHtml(client.name)}</p></div><button type="button" class="close" data-action="close" aria-label="Fechar">×</button></div><form id="client-extra-form" data-client-id="${client.id}" data-kind="${kind}"><div class="modal-body">${fields}</div><div class="modal-actions"><button class="button primary">Salvar</button></div></form></section></div>`;
  }
  if (state.modal.kind === 'profile') {
    const client = state.data.clients.find(item => item.id === state.modal.id);
    if (!client) return '';
    return `<div class="modal-backdrop" data-action="close"><section class="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title"><div class="modal-head"><div><h2 id="profile-modal-title">Perfil do cliente</h2><p>Dados e histórico da empresa</p></div><button type="button" class="close" data-action="close" aria-label="Fechar perfil">×</button></div><div class="profile-scroll"><div class="profile-card">${profileDetails(client)}</div></div></section></div>`;
  }
  if (state.modal.kind === 'new-meeting' || state.modal.kind === 'edit-meeting') {
    const client = state.data.clients.find(item => item.id === state.modal.id);
    if (!client) return '';
    const editing = state.modal.kind === 'edit-meeting';
    const meeting = editing ? (client.meetings || []).find((item, index) => (item.id ?? index) === state.modal.itemId) : null;
    if (editing && !meeting) return '';
    const invitees = meeting?.invitees?.map(item => item.email).join(', ') || (editing ? '' : client.email || '');
    return `<div class="modal-backdrop" data-action="close"><section class="modal profile-form-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${editing ? 'Editar reunião' : 'Nova reunião'}</h2><p>${escapeHtml(client.name)}</p></div><button type="button" class="close" data-action="close" aria-label="Fechar">×</button></div><form id="meeting-form" data-client-id="${client.id}" data-meeting-id="${meeting?.id ?? state.modal.itemId ?? ''}"><div class="modal-body meeting-form-section"><div class="meeting-form-fields"><label>Título<input name="title" required maxlength="120" value="${escapeHtml(meeting?.title || '')}" placeholder="Ex.: Revisão mensal"></label><label>Data<input name="date" type="date" required value="${dateKey(meeting?.date) || new Date().toISOString().slice(0, 10)}"></label><label class="meeting-field-wide">Convidados (e-mails separados por vírgula)<textarea name="invitees" rows="2" required placeholder="nome@empresa.com, equipe@empresa.com">${escapeHtml(invitees)}</textarea></label><label class="meeting-field-wide">Texto do convite<textarea name="invitationText" rows="3" required placeholder="Informe o objetivo e os assuntos da reunião">${escapeHtml(meeting?.invitationText || '')}</textarea></label><label class="meeting-field-wide">Ata da reunião<textarea name="minutes" rows="5" placeholder="Registre pauta, decisões, responsáveis e próximos passos">${escapeHtml(meeting?.minutes || meeting?.notes || '')}</textarea></label><label class="meeting-field-wide">Anexar ata (PDF, DOCX ou TXT, até 2 MB)<input name="attachment" type="file" accept=".pdf,.docx,.txt"></label>${meeting?.attachment ? `<p class="section-note">Anexo atual: ${escapeHtml(meeting.attachment.name)} <label><input name="removeAttachment" type="checkbox" value="yes"> Remover anexo</label></p>` : ''}<p class="section-note meeting-field-wide">O convite fica registrado para envio pela equipe. As respostas são atualizadas manualmente no histórico.</p></div></div><div class="modal-actions"><button class="button primary">Salvar reunião</button></div></form></section></div>`;
  }
  if (state.modal.kind === 'edit-client') {
    const client = state.data.clients.find(item => item.id === state.modal.id);
    if (!client) return '';
    return `<div class="modal-backdrop" data-action="close"><section class="modal profile-form-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>Editar dados do cliente</h2><p>${escapeHtml(client.name)}</p></div><button type="button" class="close" data-action="close" aria-label="Fechar">&times;</button></div><form id="client-edit-form" data-client-id="${client.id}"><div class="modal-body"><div class="client-edit-layout"><section class="client-edit-section"><h3>Dados da empresa</h3><div class="client-edit-fields"><label class="edit-field-wide">Nome da empresa<input name="name" required value="${escapeHtml(client.name)}"></label><label>Contato<input name="contact" value="${escapeHtml(client.contact || '')}"></label><label>E-mail<input name="email" type="email" value="${escapeHtml(client.email || '')}"></label><label>Receita mensal informada (R$)<input name="monthlyRevenue" type="number" min="0" step="0.01" value="${Number(client.monthlyRevenue || 0)}"></label></div></section><section class="client-edit-section"><h3>Serviços vinculados</h3><div class="client-edit-fields"><label class="edit-field-wide">Serviços vinculados<input name="services" value="${escapeHtml((client.services || []).join(', '))}" placeholder="Separe os serviços por vírgula"></label><p class="section-note">Separe vários serviços com vírgula.</p></div></section><section class="client-edit-section client-edit-location"><h3>Localização</h3><p class="section-note">Consulte o CEP para preencher cidade e estado.</p><div class="cep-lookup"><label>CEP<input id="client-cep" name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" value="${escapeHtml(client.address?.cep || '')}" placeholder="00000-000"></label><button type="button" class="button soft" data-action="lookup-cep">Consultar CEP</button></div><small id="cep-status" class="cep-status" aria-live="polite"></small><div class="location-fields"><label>Município<input id="client-city" name="city" value="${escapeHtml(client.address?.city || '')}" readonly></label><label>Estado (UF)<input id="client-state-code" name="stateCode" value="${escapeHtml(client.address?.stateCode || '')}" readonly></label></div></section></div></div><div class="modal-actions"><button class="button primary">Salvar dados</button></div></form></section></div>`;
  }
  if (state.modal.kind === 'repair') {
    const item = repairCandidates().find(candidate => candidate.theme === state.modal.id);
    if (!item) return '';
    return `<div class="modal-backdrop" data-action="close"><section class="modal repair-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">Reincidência: ${escapeHtml(item.theme)}</h2><p>${item.feedbacks.length} feedbacks negativos · ${item.clients.length} ${item.clients.length === 1 ? 'empresa' : 'empresas'}</p></div><button type="button" class="close" data-action="close" aria-label="Fechar">×</button></div><div class="modal-body"><div class="repair-evidence"><strong>Assunto recorrente</strong><p>Os ${item.feedbacks.length} relatos abaixo tratam de ${escapeHtml(item.theme.toLocaleLowerCase('pt-BR'))}. Confira se a classificação corresponde ao conteúdo antes de decidir.</p></div><h3>Feedbacks relacionados</h3><ol class="repair-feedbacks">${item.feedbacks.map(feedback => `<li><span>${escapeHtml(feedback.date)} · ${escapeHtml(feedback.client || 'Não vinculada')}</span>${escapeHtml(feedback.comment)}</li>`).join('')}</ol><div class="repair-guidance"><strong>Possível encaminhamento</strong><p>${escapeHtml(item.proposal)}</p><small>Revise os relatos antes de registrar a medida.</small></div><div class="proposal-editor"><label>Proposta da equipe<textarea id="repair-proposal" rows="4" placeholder="Registre a medida, o responsável e o prazo"></textarea></label>${button('Usar texto como base', 'use-suggestion', 'soft')}</div><label>Justificativa da decisão<textarea id="decision-note" rows="3" placeholder="Explique por que a proposta será aceita ou descartada"></textarea></label></div><div class="modal-actions">${button('Descartar análise', 'reject', 'outline')}${button('Aceitar e criar ação', 'accept', 'primary')}</div></section></div>`;
  }
  if (state.modal.kind === 'action') {
    const action = state.data.actions.find(item => item.id === state.modal.id);
    if (!action) return '';
    return `<div class="modal-backdrop" data-action="close"><section class="modal repair-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">Ação para ${escapeHtml(action.clientName)}</h2><p>Proposta aceita em ${escapeHtml(action.createdAt)} · ${action.feedbackIds.length} feedbacks relacionados</p></div><button type="button" class="close" data-action="close" aria-label="Fechar">×</button></div><div class="modal-body"><h3>O que deve ser feito</h3><div class="quote">${escapeHtml(action.proposal)}</div><h3>Histórico</h3><ol class="action-history">${action.history.map(entry => `<li><strong>${escapeHtml(entry.status)}</strong><span>${escapeHtml(entry.date)}</span><p>${escapeHtml(entry.note)}</p></li>`).join('')}</ol><label>Situação<select id="action-status">${['Pendente', 'Em andamento', 'Concluída'].map(status => `<option ${action.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label>Registro do acompanhamento<textarea id="action-note" rows="3" placeholder="Descreva o que foi feito ou o próximo passo"></textarea></label></div><div class="modal-actions">${button('Salvar acompanhamento', 'save-action')}</div></section></div>`;
  }
  return '';
}
function render() {
  if (document.body) document.body.classList.toggle('theme-light', state.theme === 'light');
  const current = path();
  if (current === '/problemas') { history.replaceState(null, '', '/acoes'); render(); return; }
  const guarded = ['/dashboard', '/feedbacks', '/clientes', '/tarefas', '/oportunidades', '/triagem', '/acoes', '/servicos'];
  if ((guarded.includes(current) || current.startsWith('/clientes/')) && !state.loggedIn) { history.replaceState(null, '', '/login'); app.innerHTML = login(); return; }
  app.innerHTML = ({ '/': state.loggedIn ? overview : publicOverview, '/login': login, '/dashboard': dashboard, '/feedbacks': feedbacks, '/clientes': clients, '/tarefas': tasksPage, '/oportunidades': opportunitiesPage, '/triagem': triage, '/acoes': actionsPage, '/servicos': services })[current]?.() || (current.startsWith('/clientes/') ? profile(current.split('/')[2]) : shell(current, title('Página não encontrada', 'Escolha uma opção na navegação.')));
}
function announce(message) { state.toast = message; render(); setTimeout(() => { state.toast = ''; render(); }, 3500); }
document.addEventListener('click', async event => {
  const link = event.target.closest('[data-link]');
  if (link) { event.preventDefault(); go(link.getAttribute('href')); return; }
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  if (action === 'toggle-theme') { state.theme = state.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('avaliaplay-theme', state.theme); render(); return; }
  if (action === 'close' && event.target !== control && control.classList.contains('modal-backdrop')) return;
  if (action === 'logout') { state.loggedIn = false; sessionStorage.removeItem('avaliaplay-login'); go('/'); }
  if (action === 'dashboard-feedbacks' || action === 'dashboard-relations' || action === 'dashboard-financial') { state.dashboardView = action.replace('dashboard-', ''); render(); }
  if (action === 'map' || action === 'table') { state.map = action === 'map'; render(); }
  if (action === 'lookup-cep') {
    const cepInput = document.querySelector('#client-cep');
    const status = document.querySelector('#cep-status');
    const cityInput = document.querySelector('#client-city');
    const stateInput = document.querySelector('#client-state-code');
    if (!cepInput) return;
    if (status) status.textContent = 'Consultando CEP…';
    try {
      const address = await lookupCep(cepInput.value);
      cepInput.value = address.cep;
      cityInput.value = address.city;
      stateInput.value = address.stateCode;
      if (status) status.textContent = `Localização encontrada: ${address.city} - ${address.stateCode}.`;
    } catch (error) {
      cityInput.value = '';
      stateInput.value = '';
      if (status) status.textContent = error.message;
    }
  }
  if (action === 'profile') { state.modal = { kind: 'profile', id: Number(control.dataset.id) }; render(); }
  if (action === 'resolve-incident') { const client = state.data.clients.find(item => item.id === Number(control.dataset.id)); const incident = client?.slaIncidents?.[Number(control.dataset.index)]; if (incident) { incident.status = 'Resolvida'; save(); render(); } }
  if (['new-task', 'edit-task', 'new-opportunity', 'edit-opportunity'].includes(action)) { state.modal = { kind: action, id: Number(control.dataset.id), itemId: Number(control.dataset.itemId) }; render(); }
  if (['new-contact', 'edit-sla', 'edit-service-profile', 'new-incident'].includes(action)) { state.modal = { kind: action, id: Number(control.dataset.id) }; render(); }
  if (action === 'edit-client' || action === 'new-meeting' || action === 'edit-meeting') { state.modal = { kind: action, id: Number(control.dataset.id), itemId: action === 'edit-meeting' ? Number(control.dataset.itemId) : undefined }; render(); }
  if (action === 'analyze' || action === 'action') { state.modal = { kind: action === 'analyze' ? 'repair' : 'action', id: action === 'analyze' ? control.dataset.id : Number(control.dataset.id) }; render(); }
  if (action === 'use-suggestion') {
    const proposal = repairCandidates().find(item => item.theme === state.modal?.id)?.proposal;
    const field = document.querySelector('#repair-proposal');
    if (proposal && field) field.value = proposal;
  }
  if (action === 'close') { state.modal = null; if (path().startsWith('/clientes/')) history.replaceState(null, '', '/clientes'); render(); }
  if (action === 'filter') { state.query = document.querySelector('#feedback-search, #triage-search')?.value || ''; state.service = document.querySelector('#service-filter')?.value || ''; state.sentiment = document.querySelector('#sentiment-filter')?.value || ''; render(); }
  if (action === 'accept' || action === 'reject') {
    const note = document.querySelector('#decision-note').value.trim();
    if (!note) { document.querySelector('#decision-note').focus(); return; }
    const candidate = repairCandidates().find(item => item.theme === state.modal.id);
    if (!candidate) return;
    const proposalField = document.querySelector('#repair-proposal');
    const proposal = action === 'accept' ? proposalField.value.trim() : '';
    if (action === 'accept' && !proposal) { proposalField.focus(); return; }
    const date = new Date().toLocaleDateString('pt-BR');
    state.data.repairReviews.push({ key: candidate.key, theme: candidate.theme, decision: action === 'accept' ? 'Aceita' : 'Descartada', note, date });
    if (action === 'accept') {
      state.data.actions.push({ id: Math.max(0, ...state.data.actions.map(item => item.id)) + 1, clientId: null, clientName: candidate.clients.join(', '), clientNames: candidate.clients, theme: candidate.theme, proposal, source: proposal === candidate.proposal ? 'Texto base adotado' : 'Proposta da equipe', feedbackIds: candidate.feedbacks.map(feedback => feedback.id), status: 'Pendente', createdAt: date, history: [{ status: 'Pendente', date, note }] });
    }
    save(); state.modal = null; announce(action === 'accept' ? 'Proposta aceita e enviada para Ações.' : 'Proposta descartada com justificativa.');
  }
  if (action === 'save-action') {
    const note = document.querySelector('#action-note').value.trim();
    if (!note) { document.querySelector('#action-note').focus(); return; }
    const item = state.data.actions.find(record => record.id === state.modal.id);
    if (!item) return;
    item.status = document.querySelector('#action-status').value;
    item.history.push({ status: item.status, note, date: new Date().toLocaleDateString('pt-BR') });
    save(); state.modal = null; announce('Acompanhamento registrado no histórico da empresa.');
  }
});
document.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const values = Object.fromEntries(new FormData(form));
  if (form.id === 'client-work-form') {
    const client = state.data.clients.find(item => item.id === Number(form.dataset.clientId));
    if (!client) return;
    const isTask = form.dataset.kind.endsWith('task');
    const collection = isTask ? (client.tasks ||= []) : (client.opportunities ||= []);
    const editing = form.dataset.kind.startsWith('edit-');
    const item = editing ? collection.find(record => record.id === Number(form.dataset.itemId)) : { id: Math.max(0, ...collection.map(record => record.id)) + 1, createdAt: new Date().toLocaleDateString('pt-BR'), history: [] };
    if (!item) return;
    const previous = isTask ? item.status : item.stage;
    item.title = values.title.trim();
    if (isTask) { item.owner = values.owner.trim(); item.dueDate = values.dueDate; item.status = values.status; }
    else { item.value = Number(values.value); item.expectedDate = values.expectedDate; item.stage = values.stage; item.note = values.note.trim(); }
    if (editing && previous !== (isTask ? item.status : item.stage)) { item.history ||= []; item.history.push({ date: new Date().toLocaleDateString('pt-BR'), [isTask ? 'status' : 'stage']: isTask ? item.status : item.stage }); }
    if (!editing) collection.push(item);
    save(); state.modal = { kind: 'profile', id: client.id }; render(); return;
  }
  if (form.id === 'client-extra-form') {
    const client = state.data.clients.find(item => item.id === Number(form.dataset.clientId));
    if (!client) return;
    const kind = form.dataset.kind;
    if (kind === 'new-contact') { client.contacts = clientContacts(client); client.contacts.push({ name: values.name.trim(), email: values.email.trim(), role: values.role.trim() }); }
    if (kind === 'edit-sla') client.slaContract = values.slaContract.trim();
    if (kind === 'edit-service-profile') client.serviceProfile = values.serviceProfile.trim();
    if (kind === 'new-incident') { client.slaIncidents ||= []; client.slaIncidents.push({ title: values.title.trim(), severity: values.severity, status: values.status, date: new Date().toLocaleDateString('pt-BR') }); }
    save(); state.modal = { kind: 'profile', id: client.id }; render(); return;
  }
  if (form.id === 'login-form') { state.loggedIn = true; sessionStorage.setItem('avaliaplay-login', '1'); go('/'); }
  if (form.id === 'client-edit-form') { const client = state.data.clients.find(item => item.id === Number(form.dataset.clientId)); if (!client) return; client.name = values.name.trim(); client.contact = values.contact.trim(); client.email = values.email.trim(); client.monthlyRevenue = Math.max(0, Number(values.monthlyRevenue) || 0); if (!Array.isArray(client.revenueHistory)) client.revenueHistory = []; const currentMonth = monthKey(0); const revenueRecord = client.revenueHistory.find(item => item.month === currentMonth); if (revenueRecord) revenueRecord.value = client.monthlyRevenue; else client.revenueHistory.push({ month: currentMonth, value: client.monthlyRevenue }); client.services = values.services.split(',').map(value => value.trim()).filter(Boolean); client.address = values.cep && values.city && values.stateCode ? { cep: values.cep.trim(), city: values.city.trim(), stateCode: values.stateCode.trim().toUpperCase() } : null; save(); state.modal = { kind: 'profile', id: client.id }; render(); }
  if (form.id === 'meeting-form') {
    const client = state.data.clients.find(item => item.id === Number(form.dataset.clientId));
    if (!client) return;
    client.meetings ||= [];
    const editing = state.modal?.kind === 'edit-meeting';
    const meeting = editing ? client.meetings.find((item, index) => (item.id ?? index) === Number(form.dataset.meetingId)) : { id: Math.max(client.meetings.length, ...client.meetings.map(item => item.id || 0)) + 1 };
    if (!meeting) return;
    const previousMeeting = editing ? copy(meeting) : null;
    const emails = meetingInvitees(values.invitees);
    if (!emails.length || !values.invitationText?.trim()) { announce('Informe ao menos um convidado e o texto do convite.'); return; }
    if (emails.some(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) { announce('Confira os e-mails dos convidados.'); return; }
    const file = form.querySelector?.('[name="attachment"]')?.files?.[0];
    try {
      if (file) meeting.attachment = await readMeetingAttachment(file);
    } catch (error) { announce(error.message); return; }
    if (values.removeAttachment === 'yes' && !file) delete meeting.attachment;
    meeting.title = values.title.trim();
    meeting.date = dateBR(values.date);
    meeting.invitationText = values.invitationText.trim();
    meeting.minutes = values.minutes.trim();
    meeting.invitees = emails.map(email => ({ email, status: meeting.invitees?.find(item => item.email === email)?.status || 'Sem resposta' }));
    if (!editing) client.meetings.push(meeting);
    try { save(); } catch {
      if (editing) { Object.keys(meeting).forEach(key => delete meeting[key]); Object.assign(meeting, previousMeeting); }
      else client.meetings.pop();
      announce('Não foi possível salvar a reunião no navegador. Reduza o tamanho da ata anexada.'); return;
    }
    state.modal = { kind: 'profile', id: client.id }; render(); return;
  }
  if (form.id === 'service-form') { state.data.services.unshift({ name: values.name.trim(), type: values.type, description: values.description.trim() }); save(); announce('Serviço cadastrado nesta demonstração local.'); }
});
document.addEventListener('input', event => {
  if (event.target?.id !== 'client-cep') return;
  const cityInput = document.querySelector('#client-city');
  const stateInput = document.querySelector('#client-state-code');
  const status = document.querySelector('#cep-status');
  if (cityInput) cityInput.value = '';
  if (stateInput) stateInput.value = '';
  if (status) status.textContent = 'Consulte o CEP para atualizar cidade e UF.';
});
document.addEventListener('change', event => {
  const field = event.target;
  if (!field?.dataset?.meetingId || field.dataset.inviteeIndex === undefined) return;
  const client = state.data.clients.find(item => item.id === Number(field.dataset.clientId));
  const meeting = client?.meetings?.find((item, index) => (item.id ?? index) === Number(field.dataset.meetingId));
  const invitee = meeting?.invitees?.[Number(field.dataset.inviteeIndex)];
  if (!invitee || !['Sem resposta', 'Confirmado', 'Recusado'].includes(field.value)) return;
  invitee.status = field.value;
  save(); render();
});
addEventListener('popstate', render);
render();

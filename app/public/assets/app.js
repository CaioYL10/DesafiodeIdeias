const app = document.querySelector('#app');
const DEMO_DATA_VERSION = 3;
const MIN_NEGATIVE_FEEDBACKS = 10;
const MIN_REPETITION_RATIO = 0.6;
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
const state = { data: readData(), loggedIn: sessionStorage.getItem('avaliaplay-login') === '1', query: '', service: '', sentiment: '', modal: null, map: false, dashboardView: 'feedbacks', toast: '' };
const save = () => localStorage.setItem('avaliaplay-data', JSON.stringify(state.data));
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const path = () => location.pathname.replace(/\/$/, '') || '/';
const go = destination => { history.pushState(null, '', destination); state.modal = null; state.query = ''; state.service = ''; state.sentiment = ''; render(); scrollTo(0, 0); };
const A = '/assets/';
const iconPaths = {
  company: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2m-6 10v-5h4v5"/>',
  report: '<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8m-8 4h6"/>',
  action: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;

function header(current) {
  const publicItems = [['/', 'Visão geral'], ['/login', 'Login']];
  const managerItems = [['/', 'Visão geral'], ['/dashboard', 'Dashboard'], ['/feedbacks', 'Feedbacks'], ['/clientes', 'Clientes e qualidade']];
  const items = state.loggedIn ? managerItems : publicItems;
  return `<header class="site-header"><a class="logo" href="/" data-link aria-label="CTI, visão geral"><img src="${A}imgImage2.png" alt="CTI conectando empresas e pessoas"></a><nav aria-label="Navegação principal">${items.map(([url, label]) => `<a href="${url}" data-link ${current === url ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>${state.loggedIn ? `<button class="signout" type="button" data-action="logout" aria-label="Sair da gestão"><img src="${A}imgSignOut.svg" alt=""></button>` : ''}</header>`;
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
  return `${header('/')}<main class="home crm-home"><section class="crm-hero"><div class="crm-copy"><h1>Conheça cada cliente. Cuide de cada relação.</h1><p>Acompanhe o relacionamento com cada empresa, consulte feedbacks e organize ações de melhoria em um só lugar.</p><div class="crm-actions"><a class="button primary" href="/dashboard" data-link>Abrir dashboard</a><a class="button soft" href="/clientes" data-link>Ver clientes</a></div></div><div class="crm-panel" aria-label="Carteira em foco"><div class="crm-panel-head"><div><span>Visão da equipe</span><h2>Resumo do relacionamento</h2></div></div><div class="crm-panel-row"><span class="crm-row-icon blue">${icon('company')}</span><div><strong>Clientes cadastrados</strong><small>Contexto da carteira</small></div><b>${state.data.clients.length}</b></div><div class="crm-panel-row"><span class="crm-row-icon gold">${icon('report')}</span><div><strong>Triagens de reparação</strong><small>Aguardam revisão da equipe</small></div><b>${pending}</b></div><div class="crm-panel-row"><span class="crm-row-icon green">${icon('action')}</span><div><strong>Ações em acompanhamento</strong><small>Propostas aceitas ainda não concluídas</small></div><b>${open}</b></div></div></section><nav class="crm-shortcuts" aria-label="Acesso rápido"><a href="/clientes" data-link><span class="shortcut-icon blue">${icon('company')}</span><span class="shortcut-copy"><strong>Clientes</strong><small>Consulte perfis e feedbacks</small></span><span class="shortcut-arrow" aria-hidden="true">→</span></a><a href="/triagem" data-link><span class="shortcut-icon gold">${icon('report')}</span><span class="shortcut-copy"><strong>Triagem de reparação</strong><small>Revise padrões de atendimento</small></span><span class="shortcut-arrow" aria-hidden="true">→</span></a><a href="/acoes" data-link><span class="shortcut-icon green">${icon('action')}</span><span class="shortcut-copy"><strong>Ações</strong><small>Acompanhe as propostas aceitas</small></span><span class="shortcut-arrow" aria-hidden="true">→</span></a></nav></main>`;
}
function login() {
  return shell('/login', `<div class="login-grid"><div class="login-copy"><p class="login-kicker">Acesso à equipe</p><h1>Gestão de relacionamento da CTI.</h1><p>Entre para acompanhar clientes, relatos e ações de qualidade em um só lugar.</p></div><section class="login-card"><small>ÁREA DO GESTOR</small><h2>Entrar na gestão</h2><form id="login-form"><label>E-mail<input name="email" type="email" autocomplete="username" placeholder="gestor@exemplo.com" required></label><label>Senha<input name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required></label><button class="button primary wide">Entrar no painel</button><p class="field-note">Ambiente de demonstração local.</p></form></section></div>`, true);
}
function metric(label, value, note, tone = 'blue', icon = '') { return `<article class="metric card"><div class="metric-label">${label}<span class="metric-icon ${tone}">${icon ? `<img src="${A}${icon}" alt="">` : '✦'}</span></div><strong>${escapeHtml(value)}</strong><span>${note}</span></article>`; }
function dashboardHeading(text) {
  const feedbacksActive = state.dashboardView === 'feedbacks';
  return `<div class="dashboard-page-heading"><h1>${text}</h1><div class="dashboard-switch" role="group" aria-label="Visualização do dashboard">${button('Feedbacks', 'dashboard-feedbacks', feedbacksActive ? 'primary' : 'outline', `aria-pressed="${feedbacksActive}"`)}${button('Relações', 'dashboard-relations', feedbacksActive ? 'outline' : 'primary', `aria-pressed="${!feedbacksActive}"`)}</div></div>`;
}
function relationMetric(label, value, note, tone, icon) {
  return `<article class="metric card"><div class="metric-label">${label}<span class="metric-icon ${tone}"><img src="${A}${icon}" alt=""></span></div><strong>${value}</strong><span>${note}</span></article>`;
}
function rankingMetric(label, clients, tone, iconName, detail) {
  const rows = clients.map((client, index) => `<li><span class="ranking-position">${index + 1}</span><span class="ranking-name" title="${escapeHtml(client.name)}">${escapeHtml(client.name)}</span>${detail ? `<b>${escapeHtml(detail(client))}</b>` : ''}</li>`).join('');
  return `<article class="metric card ranking-card"><div class="metric-label">${label}<span class="metric-icon ${tone}"><img src="${A}${iconName}" alt=""></span></div><ol class="ranking-list">${rows || '<li>Sem dados para este ranking</li>'}</ol></article>`;
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
function relationsDashboard() {
  const pendingRepairs = repairCandidates().length;
  const missingContacts = state.data.clients.filter(client => !client.email).length;
  return shell('/dashboard', `${dashboardHeading('Análise das relações')}
    <div class="metric-grid relations-metrics">${relationMetric('Clientes cadastrados', state.data.clients.length, 'Total de clientes', 'blue', 'dashboardClients.svg')}${rankingMetric('Top 3 empresas mais próximas', topClosestClients(), 'gold', 'dashboardStar.svg')}${relationMetric('Novos vínculos', '—', 'Sem histórico cadastrado', 'green', 'dashboardGrowth.svg')}${relationMetric('Relações para revisão', pendingRepairs, 'Padrões de atendimento pendentes', 'rose', 'dashboardAlert.svg')}</div>
    <div class="dashboard-grid"><section class="card chart-card"><div class="card-heading"><h2>Número de vínculos</h2><span class="tag">Últimos 14 dias</span></div><div class="chart"><img class="dashboard-trend" src="${A}dashboardTrend.svg" alt="Tendência ilustrativa do número de vínculos nos últimos 14 dias"><div class="chart-labels"><span>17 de out.</span><span>23 de out.</span><span>30 de out.</span></div></div></section><section class="card reminders"><div class="card-heading"><div><h2>Lembretes importantes</h2><p>Assuntos de urgência</p></div></div><div class="reminder-list">${reminder('dashboardMessage.svg', 'blue', 'Consultar feedbacks', `${state.data.feedbacks.length} relatos de demonstração`, 'Consultar')}${reminder('dashboardLightbulb.svg', 'green', 'Reparações para revisão', `${pendingRepairs} ${pendingRepairs === 1 ? 'análise' : 'análises'} aguardando a equipe`, 'Pendente')}${reminder('dashboardCalendar.svg', 'gold', 'Completar dados dos clientes', `${missingContacts} contatos não informados`, 'Pendente')}</div></section></div>`);
}
function dashboard() {
  if (state.dashboardView === 'relations') return relationsDashboard();
  const data = state.data.feedbacks;
  const average = data.length ? (data.reduce((sum, f) => sum + Number(f.rating), 0) / data.length).toFixed(1).replace('.', ',') : '0';
  const positive = data.filter(f => f.sentiment === 'Positivo').length;
  const negative = data.filter(f => f.sentiment === 'Negativo').length;
  const neutral = data.filter(f => f.sentiment === 'Neutro').length;
  return shell('/dashboard', `${dashboardHeading('Análise dos feedbacks')}
    <div class="metric-grid">${metric('Feedbacks recebidos', data.length, 'Total registrado', 'blue', 'dashboardClients.svg')}${metric('Nota média', average, 'De 1 a 5 pontos', 'gold', 'dashboardStar.svg')}${metric('Sentimento positivo', positive, `${Math.round(positive / (data.length || 1) * 100)}% dos comentários analisados`, 'green', 'dashboardGrowth.svg')}${metric('Sentimento negativo', negative, 'Sentimento negativo', 'rose', 'dashboardAlert.svg')}${rankingMetric('Top 3 empresas mais recorrentes', topRecurringClients(), 'rose', 'dashboardRecurrence.svg', client => `${client.feedbackCount} ${client.feedbackCount === 1 ? 'relato' : 'relatos'}`)}</div>
    <div class="dashboard-grid"><section class="card chart-card"><div class="card-heading"><div><h2>Movimento de feedbacks</h2><p>Nota média e volume por dia</p></div><span class="tag">Últimos 14 dias</span></div><div class="chart"><img class="dashboard-trend" src="${A}dashboardFeedbackTrend.svg" alt="Tendência ilustrativa dos feedbacks nos últimos 14 dias"><div class="chart-labels"><span>17 de out.</span><span>23 de out.</span><span>30 de out.</span></div></div></section><section class="card climate"><div class="card-heading"><div><h2>Clima dos comentários</h2><p>Distribuição de sentimento</p></div></div>${[['Positivo', positive, 'green'], ['Neutro', neutral, 'gold'], ['Negativo', negative, 'rose']].map(([label, value, color]) => `<div class="climate-label"><i class="dot ${color}"></i>${label}<b>${value}</b></div><div class="bar"><i class="${color}" style="width:${Math.round(value / (data.length || 1) * 100)}%"></i></div>`).join('')}</section></div>`);
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
  return [...state.data.clients, demoClient].flatMap(client => {
    const feedbacks = state.data.feedbacks.filter(feedback => feedback.client === client.name && feedback.sentiment === 'Negativo' && feedback.area === 'Atendimento');
    if (feedbacks.length < MIN_NEGATIVE_FEEDBACKS) return [];
    const themes = new Map();
    feedbacks.forEach(feedback => {
      const theme = feedbackTheme(feedback);
      themes.set(theme, (themes.get(theme) || 0) + 1);
    });
    const [theme, repetitions] = [...themes].sort((a, b) => b[1] - a[1])[0];
    const key = `${client.id}:${feedbacks.map(feedback => feedback.id).sort((a, b) => a - b).join(',')}`;
    if (state.data.repairReviews.some(review => review.key === key)) return [];
    const recurring = theme !== 'Motivo não identificado' && repetitions >= Math.ceil(feedbacks.length * MIN_REPETITION_RATIO);
    const proposal = recurring ? (theme === 'Demora no retorno'
      ? 'Agendar uma conversa com a empresa, reconhecer as falhas de retorno, definir um ponto focal e combinar uma frequência de atualizações. Depois, confirmar com a empresa se a comunicação melhorou.'
      : `Conversar com a empresa sobre ${theme.toLocaleLowerCase('pt-BR')}, alinhar expectativas e combinar um acompanhamento para reconstruir a confiança.`) : '';
    return [{ client, feedbacks, theme, repetitions, recurring, proposal, key }];
  });
}
function feedbacks() {
  const rows = filteredFeedbacks();
  return shell('/feedbacks', `${title('Feedbacks', 'Pesquise e acompanhe cada tratativa.')}<section class="card list-card feedback-list"><div class="filters"><input id="feedback-search" type="search" placeholder="Buscar coment&#225;rio..." value="${escapeHtml(state.query)}"><select id="service-filter"><option value="">Todos os serviços</option>${state.data.services.map(service => `<option ${state.service === service.name ? 'selected' : ''}>${escapeHtml(service.name)}</option>`).join('')}</select><select id="sentiment-filter"><option value="">Todos sentimentos</option>${['Positivo', 'Neutro', 'Negativo'].map(v => `<option ${state.sentiment === v ? 'selected' : ''}>${v}</option>`).join('')}</select>${button('Filtrar', 'filter', 'outline')}</div><div class="table-wrap"><table><thead><tr><th>COMENTÁRIO</th><th>EMPRESA</th><th>SERVIÇO</th><th>NOTA</th><th>SENTIMENTO</th><th>RECEBIDO</th></tr></thead><tbody>${rows.map(f => `<tr><td class="feedback-comment">${escapeHtml(f.comment)}</td><td>${escapeHtml(f.client || 'Não vinculada')}</td><td>${escapeHtml(f.service)}</td><td class="rating">&#9733; ${f.rating}</td><td><span class="pill ${f.sentiment.toLowerCase()}">${f.sentiment}</span></td><td>${f.date}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Nenhum feedback encontrado.</td></tr>'}</tbody></table></div><div class="pagination">Página 1 a ${rows.length} registros <span>‹ Anterior &nbsp; Próxima ›</span></div></section>`);
}
function tabs(current) { return `<nav class="tabs" aria-label="Etapas de gestão">${[['/clientes', 'Clientes'], ['/triagem', 'Triagem de reparação'], ['/acoes', 'Ações']].map(([url, label]) => `<a href="${url}" data-link ${current === url ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`; }
function feedbackCount(clientName) { return state.data.feedbacks.filter(feedback => feedback.client === clientName).length; }
function feedbackSummary(clientName) { const count = feedbackCount(clientName); return `${count} ${count === 1 ? 'relato' : 'relatos'}`; }
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
function profileDetails(client) {
  const meetings = Array.isArray(client.meetings) ? client.meetings : [];
  const brand = `<div class="client-wordmark ${clientBrandClass(client.name)}" aria-label="Marca ${escapeHtml(client.name)}"><span>${clientBrandMark(client.name)}</span></div>`;
  const meetingRows = meetings.length ? [...meetings].sort((a, b) => b.date.localeCompare(a.date)).map(meeting => `<article class="meeting"><span class="meeting-date">${escapeHtml(meeting.date)}</span><div><strong>${escapeHtml(meeting.title)}</strong><small>${escapeHtml(meeting.notes || '')}</small></div></article>`).join('') : '<p class="profile-empty">Nenhuma reunião registrada.</p>';
  const linkedFeedbacks = state.data.feedbacks.filter(feedback => feedback.client === client.name);
  const location = client.address?.cep ? `<p class="profile-location">${escapeHtml(client.address.city)}, ${escapeHtml(client.address.stateCode)} · CEP ${escapeHtml(client.address.cep)}</p>` : '';
  return `<div class="profile-head">${brand}<div class="profile-client-copy"><h1>${escapeHtml(client.name)}</h1><p>${escapeHtml(client.contact || 'Contato não informado')} · ${escapeHtml(client.email || 'E-mail não informado')}</p>${location}</div><div class="profile-actions">${button('Editar dados', 'edit-client', 'outline', `data-id="${client.id}"`)}${button('Nova reunião', 'new-meeting', 'primary', `data-id="${client.id}"`)}</div></div><div class="metric-grid three">${metric('Feedbacks', feedbackCount(client.name), 'Recebidos', 'blue', 'dashboardMessage.svg')}${metric('Reuniões', meetings.length, 'Registradas', 'gold', 'dashboardCalendar.svg')}${metric('Serviços', (client.services || []).length, 'Vinculados', 'green', 'dashboardClients.svg')}</div><h2>Últimas reuniões</h2>${meetingRows}<div class="profile-columns"><div><h2>Serviços vinculados</h2>${(client.services || []).length ? (client.services || []).map(service => `<span class="chip">${escapeHtml(service)}</span>`).join('') : '<p class="profile-empty">Nenhum serviço vinculado.</p>'}</div><div><h2>Feedbacks recentes</h2>${linkedFeedbacks.length ? linkedFeedbacks.slice(0, 3).map(feedback => `<p class="profile-feedback"><span>${escapeHtml(feedback.date)}</span>${escapeHtml(feedback.comment)}</p>`).join('') : '<p class="profile-empty">Nenhum feedback vinculado.</p>'}</div></div>`;
}
function profile(id) {
  const client = state.data.clients.find(c => c.id === Number(id));
  if (!client) return clients();
  state.modal = { kind: 'profile', id: client.id };
  return clients();
}
function triage() {
  const cases = repairCandidates().filter(item => !state.query || `${item.client.name} ${item.theme}`.toLocaleLowerCase('pt-BR').includes(state.query.toLocaleLowerCase('pt-BR')));
  return shell('/clientes', `${tabs('/triagem')}<section class="card list-card repair-page"><div class="card-heading"><div><h1>Triagem de reparação</h1><p>Revise padrões de atendimento antes de propor uma ação para conservar a relação.</p></div><span>${cases.length} ${cases.length === 1 ? 'análise' : 'análises'}</span></div><p class="repair-criteria">Critério demonstrativo: ${MIN_NEGATIVE_FEEDBACKS} ou mais feedbacks negativos de atendimento da mesma empresa. Uma sugestão aparece quando o mesmo motivo representa ao menos ${Math.round(MIN_REPETITION_RATIO * 100)}% deles. <strong>Simulação local, sem IA real.</strong></p><div class="filters"><input id="triage-search" type="search" value="${escapeHtml(state.query)}" placeholder="Buscar empresa ou motivo">${button('Buscar', 'filter', 'outline')}</div><div class="triage-list">${cases.map(item => `<article class="triage-row repair-row"><div><h3>${escapeHtml(item.client.name)}</h3><p>${item.feedbacks.length} feedbacks negativos de atendimento · ${item.repetitions} sobre ${escapeHtml(item.theme.toLocaleLowerCase('pt-BR'))}</p><small>${item.recurring ? 'Padrão recorrente identificado' : 'Sem motivo predominante'} · Revisão humana necessária</small></div><button type="button" data-action="analyze" data-id="${item.client.id}">Analisar</button></article>`).join('') || '<p class="empty">Nenhuma reparação pendente.</p>'}</div></section>`);
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
  if (state.modal.kind === 'profile') {
    const client = state.data.clients.find(item => item.id === state.modal.id);
    if (!client) return '';
    return `<div class="modal-backdrop" data-action="close"><section class="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title"><div class="modal-head"><div><h2 id="profile-modal-title">Perfil do cliente</h2><p>Dados e histórico da empresa</p></div><button type="button" class="close" data-action="close" aria-label="Fechar perfil">×</button></div><div class="profile-scroll"><div class="profile-card">${profileDetails(client)}</div></div></section></div>`;
  }
  if (state.modal.kind === 'edit-client' || state.modal.kind === 'new-meeting') {
    const client = state.data.clients.find(item => item.id === state.modal.id);
    if (!client) return '';
    const editing = state.modal.kind === 'edit-client';
    return `<div class="modal-backdrop" data-action="close"><section class="modal profile-form-modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${editing ? 'Editar dados do cliente' : 'Registrar reunião'}</h2><p>${escapeHtml(client.name)}</p></div><button type="button" class="close" data-action="close" aria-label="Fechar">&times;</button></div><form id="${editing ? 'client-edit-form' : 'meeting-form'}" data-client-id="${client.id}"><div class="modal-body">${editing ? `<div class="client-edit-layout"><section class="client-edit-section"><h3>Dados da empresa</h3><div class="client-edit-fields"><label class="edit-field-wide">Nome da empresa<input name="name" required value="${escapeHtml(client.name)}"></label><label>Contato<input name="contact" value="${escapeHtml(client.contact || '')}"></label><label>E-mail<input name="email" type="email" value="${escapeHtml(client.email || '')}"></label></div></section><section class="client-edit-section"><h3>Serviços vinculados</h3><div class="client-edit-fields"><label class="edit-field-wide">Serviços vinculados<input name="services" value="${escapeHtml((client.services || []).join(', '))}" placeholder="Separe os serviços por vírgula"></label><p class="section-note">Separe vários serviços com vírgula.</p></div></section><section class="client-edit-section client-edit-location"><h3>Localização</h3><p class="section-note">Consulte o CEP para preencher cidade e estado.</p><div class="cep-lookup"><label>CEP<input id="client-cep" name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" value="${escapeHtml(client.address?.cep || '')}" placeholder="00000-000"></label><button type="button" class="button soft" data-action="lookup-cep">Consultar CEP</button></div><small id="cep-status" class="cep-status" aria-live="polite"></small><div class="location-fields"><label>Município<input id="client-city" name="city" value="${escapeHtml(client.address?.city || '')}" readonly></label><label>Estado (UF)<input id="client-state-code" name="stateCode" value="${escapeHtml(client.address?.stateCode || '')}" readonly></label></div></section></div>` : `<section class="client-edit-section meeting-form-section"><h3>Detalhes da reunião</h3><div class="meeting-form-fields"><label>Título<input name="title" required placeholder="Ex.: Reunião de acompanhamento"></label><label>Data<input name="date" type="date" required value="${new Date().toISOString().slice(0, 10)}"></label><label class="meeting-field-wide">Registro<textarea name="notes" rows="4" placeholder="Pauta, decisões e próximos passos"></textarea></label></div></section>`}</div><div class="modal-actions"><button class="button primary">${editing ? 'Salvar dados' : 'Salvar reunião'}</button></div></form></section></div>`;
  }
  if (state.modal.kind === 'repair') {
    const item = repairCandidates().find(candidate => candidate.client.id === state.modal.id);
    if (!item) return '';
    return `<div class="modal-backdrop" data-action="close"><section class="modal repair-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">Análise da relação com ${escapeHtml(item.client.name)}</h2><p>${item.feedbacks.length} feedbacks negativos de atendimento · Simulação local, sem IA real</p></div><button type="button" class="close" data-action="close" aria-label="Fechar">×</button></div><div class="modal-body"><div class="repair-evidence"><strong>Padrão observado</strong><p>${item.repetitions} de ${item.feedbacks.length} feedbacks mencionam ${escapeHtml(item.theme.toLocaleLowerCase('pt-BR'))}. A análise considera apenas relatos marcados como atendimento.</p></div><h3>Feedbacks relacionados</h3><ol class="repair-feedbacks">${item.feedbacks.map(feedback => `<li><span>${escapeHtml(feedback.date)}</span>${escapeHtml(feedback.comment)}</li>`).join('')}</ol><div class="ai-box"><strong>Sugestão de reparação</strong><p>${item.proposal ? escapeHtml(item.proposal) : 'Não há um motivo suficientemente recorrente para sugerir uma proposta. Revise os relatos antes de decidir.'}</p><small>Proposta demonstrativa baseada em regras; a decisão é da equipe.</small></div><div class="proposal-editor"><label>Proposta da equipe<textarea id="repair-proposal" rows="4" placeholder="Escreva o que a equipe propõe fazer para conservar a relação"></textarea></label>${item.proposal ? button('Usar sugestão local', 'use-suggestion', 'soft') : ''}<p>Você pode escrever uma proposta totalmente diferente da sugestão acima.</p></div><label>Justificativa da decisão<textarea id="decision-note" rows="3" placeholder="Registre por que a proposta será aceita ou descartada"></textarea></label></div><div class="modal-actions">${button(item.proposal ? 'Descartar proposta' : 'Concluir análise', 'reject', 'outline')}${button('Aceitar e criar ação', 'accept', 'primary')}</div></section></div>`;
  }
  if (state.modal.kind === 'action') {
    const action = state.data.actions.find(item => item.id === state.modal.id);
    if (!action) return '';
    return `<div class="modal-backdrop" data-action="close"><section class="modal repair-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><div><h2 id="modal-title">Ação para ${escapeHtml(action.clientName)}</h2><p>Proposta aceita em ${escapeHtml(action.createdAt)} · ${action.feedbackIds.length} feedbacks relacionados</p></div><button type="button" class="close" data-action="close" aria-label="Fechar">×</button></div><div class="modal-body"><h3>O que deve ser feito</h3><div class="quote">${escapeHtml(action.proposal)}</div><h3>Histórico</h3><ol class="action-history">${action.history.map(entry => `<li><strong>${escapeHtml(entry.status)}</strong><span>${escapeHtml(entry.date)}</span><p>${escapeHtml(entry.note)}</p></li>`).join('')}</ol><label>Situação<select id="action-status">${['Pendente', 'Em andamento', 'Concluída'].map(status => `<option ${action.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><label>Registro do acompanhamento<textarea id="action-note" rows="3" placeholder="Descreva o que foi feito ou o próximo passo"></textarea></label></div><div class="modal-actions">${button('Salvar acompanhamento', 'save-action')}</div></section></div>`;
  }
  return '';
}
function render() {
  const current = path();
  if (current === '/problemas') { history.replaceState(null, '', '/acoes'); render(); return; }
  const guarded = ['/dashboard', '/feedbacks', '/clientes', '/triagem', '/acoes', '/servicos'];
  if ((guarded.includes(current) || current.startsWith('/clientes/')) && !state.loggedIn) { history.replaceState(null, '', '/login'); app.innerHTML = login(); return; }
  app.innerHTML = ({ '/': state.loggedIn ? overview : publicOverview, '/login': login, '/dashboard': dashboard, '/feedbacks': feedbacks, '/clientes': clients, '/triagem': triage, '/acoes': actionsPage, '/servicos': services })[current]?.() || (current.startsWith('/clientes/') ? profile(current.split('/')[2]) : shell(current, title('Página não encontrada', 'Escolha uma opção na navegação.')));
}
function announce(message) { state.toast = message; render(); setTimeout(() => { state.toast = ''; render(); }, 3500); }
document.addEventListener('click', async event => {
  const link = event.target.closest('[data-link]');
  if (link) { event.preventDefault(); go(link.getAttribute('href')); return; }
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  if (action === 'close' && event.target !== control && control.classList.contains('modal-backdrop')) return;
  if (action === 'logout') { state.loggedIn = false; sessionStorage.removeItem('avaliaplay-login'); go('/'); }
  if (action === 'dashboard-feedbacks' || action === 'dashboard-relations') { state.dashboardView = action === 'dashboard-relations' ? 'relations' : 'feedbacks'; render(); }
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
  if (action === 'edit-client' || action === 'new-meeting') { state.modal = { kind: action, id: Number(control.dataset.id) }; render(); }
  if (action === 'analyze' || action === 'action') { state.modal = { kind: action === 'analyze' ? 'repair' : 'action', id: Number(control.dataset.id) }; render(); }
  if (action === 'use-suggestion') {
    const proposal = repairCandidates().find(item => item.client.id === state.modal?.id)?.proposal;
    const field = document.querySelector('#repair-proposal');
    if (proposal && field) field.value = proposal;
  }
  if (action === 'close') { state.modal = null; if (path().startsWith('/clientes/')) history.replaceState(null, '', '/clientes'); render(); }
  if (action === 'filter') { state.query = document.querySelector('#feedback-search, #triage-search')?.value || ''; state.service = document.querySelector('#service-filter')?.value || ''; state.sentiment = document.querySelector('#sentiment-filter')?.value || ''; render(); }
  if (action === 'accept' || action === 'reject') {
    const note = document.querySelector('#decision-note').value.trim();
    if (!note) { document.querySelector('#decision-note').focus(); return; }
    const candidate = repairCandidates().find(item => item.client.id === state.modal.id);
    if (!candidate) return;
    const proposalField = document.querySelector('#repair-proposal');
    const proposal = action === 'accept' ? proposalField.value.trim() : '';
    if (action === 'accept' && !proposal) { proposalField.focus(); return; }
    const date = new Date().toLocaleDateString('pt-BR');
    state.data.repairReviews.push({ key: candidate.key, clientId: candidate.client.id, decision: action === 'accept' ? 'Aceita' : 'Descartada', note, date });
    if (action === 'accept') {
      state.data.actions.push({ id: Math.max(0, ...state.data.actions.map(item => item.id)) + 1, clientId: candidate.client.id, clientName: candidate.client.name, theme: candidate.theme, proposal, source: proposal === candidate.proposal ? 'Sugestão local aceita' : 'Proposta da equipe', feedbackIds: candidate.feedbacks.map(feedback => feedback.id), status: 'Pendente', createdAt: date, history: [{ status: 'Pendente', date, note }] });
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
document.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  const values = Object.fromEntries(new FormData(form));
  if (form.id === 'login-form') { state.loggedIn = true; sessionStorage.setItem('avaliaplay-login', '1'); go('/'); }
  if (form.id === 'client-edit-form') { const client = state.data.clients.find(item => item.id === Number(form.dataset.clientId)); if (!client) return; client.name = values.name.trim(); client.contact = values.contact.trim(); client.email = values.email.trim(); client.services = values.services.split(',').map(value => value.trim()).filter(Boolean); client.address = values.cep && values.city && values.stateCode ? { cep: values.cep.trim(), city: values.city.trim(), stateCode: values.stateCode.trim().toUpperCase() } : null; save(); state.modal = { kind: 'profile', id: client.id }; render(); }
  if (form.id === 'meeting-form') { const client = state.data.clients.find(item => item.id === Number(form.dataset.clientId)); if (!client) return; if (!Array.isArray(client.meetings)) client.meetings = []; const [year, month, day] = values.date.split('-'); client.meetings.push({ title: values.title.trim(), date: `${day}/${month}/${year}`, notes: values.notes.trim() }); save(); state.modal = { kind: 'profile', id: client.id }; render(); }
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
addEventListener('popstate', render);
render();

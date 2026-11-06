const SERVICE_LABELS = { internet: 'Internet', cloud: 'Cloud', ciberseguranca: 'Cibersegurança', suporte: 'Suporte', outro: 'Outro' };
async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', ...options });
  return response;
}
const loginForm = document.querySelector('#login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); const message = document.querySelector('#login-message'); const button = loginForm.querySelector('button');
    button.disabled = true; message.textContent = '';
    try {
      const response = await api('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: loginForm.email.value, password: loginForm.password.value }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'E-mail ou senha inválidos.');
      const next = new URLSearchParams(location.search).get('next');
      location.assign(['/products', '/workspace', '/feedbacks'].includes(next) ? next : '/dashboard');
    } catch (error) { message.className = 'form-message error'; message.textContent = error.message; }
    finally { button.disabled = false; }
  });
}


const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const identityLabels = { pending: 'Aguardando revisão', linked: 'Vinculada por revisão', created: 'Perfil criado por revisão', rejected: 'Vinculação rejeitada' };
const rows = document.querySelector('#feedback-rows');
const statusMessage = document.querySelector('#page-message');
const notify = text => { if (statusMessage) statusMessage.textContent = text; };
async function read(url) {
  const response = await api(url);
  const result = await response.json();
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Sem permissão. Entre com uma sessão de gestor para continuar.' : result.error || 'Erro ao consultar.');
  return result;
}
if (rows) {
  let page = 1, generation = 0;
  const form = document.querySelector('#filters-form');
  const pagination = document.querySelector('#pagination');
  async function load() {
    const current = ++generation;
    const params = new URLSearchParams(new FormData(form)); params.set('page', page); params.set('pageSize', 20);
    rows.innerHTML = '<tr><td colspan="7" class="table-empty">Carregando feedbacks…</td></tr>';
    pagination.innerHTML = ''; notify('Carregando…');
    document.querySelector('#export-button').href = '/api/manager/export.csv?' + params;
    try {
      const result = await read('/api/manager/feedback?' + params);
      if (current !== generation) return;
      rows.innerHTML = result.items.map(f => `<tr><td class="comment-cell"><a href="/workspace#triage/${f.id}">${safe(f.comment)}</a></td><td>${f.client_id ? `<a href="/workspace#clients/${f.client_id}">${safe(f.client_name)}</a>` : safe(f.reported_organization || 'Não vinculado')}<br>${safe(identityLabels[f.identity_status] || 'Sem pendência')}</td><td>${safe(SERVICE_LABELS[f.service] || f.service)}</td><td>${safe(f.rating ?? 'Sem nota')}</td><td>${safe(f.source_system || 'Histórico legado')}<br>${safe(f.external_event_id || 'Sem evento externo')}<br>Classificação externa: ${safe(f.external_classification || 'Não fornecida')}</td><td>${safe(f.occurred_at || f.created_at)}</td><td><a href="/workspace#triage/${f.id}">Detalhes #${f.id}</a></td></tr>`).join('') || '<tr><td colspan="7" class="table-empty">Nenhum feedback encontrado com esses filtros.</td></tr>';
      document.querySelector('#result-count').textContent = result.total + ' registros';
      pagination.innerHTML = `<span>Página ${result.page}</span><div><button class="button button-secondary" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Anterior</button><button class="button button-secondary" data-page="${page + 1}" ${page * result.pageSize >= result.total ? 'disabled' : ''}>Próxima</button></div>`;
      notify(result.total + ' registros encontrados.');
    } catch (error) { if (current !== generation) return; rows.innerHTML = '<tr><td colspan="7" class="table-empty">Consulta indisponível. Use Filtrar para tentar novamente.</td></tr>'; notify(error.message); }
  }
  form.addEventListener('submit', event => { event.preventDefault(); page = 1; load(); });
  pagination.addEventListener('click', event => { if (event.target.dataset.page) { page = Number(event.target.dataset.page); load(); } });
  load();
}
if (document.querySelector('#metric-total')) {
  async function summary() {
    notify('Carregando indicadores…');
    try {
      const result = await read('/api/manager/summary');
      document.querySelector('#metric-total').textContent = result.total;
      document.querySelector('#metric-average').textContent = result.averageRating ?? 'Sem notas';
      document.querySelector('#indicator-definitions').textContent = result.definitions.total + ' ' + result.definitions.averageRating;
      document.querySelector('#trend-chart').innerHTML = '<p>Média diária = soma das notas / registros com nota no dia de recebimento UTC. Período: ' + safe(result.definitions.from) + ' até ' + safe(result.definitions.toExclusive) + ' (fim exclusivo).</p><ol>' + result.trend.map(point => '<li>' + safe(point.date) + ': ' + safe(point.averageRating) + ' / 5 (' + safe(point.total) + ' notas)</li>').join('') + '</ol>' + (result.trend.length ? '' : '<p>Nenhuma nota no período.</p>');
      notify('Indicadores carregados.');
    } catch (error) { notify(error.message); }
  }
  document.querySelector('#retry-summary')?.addEventListener('click', summary);
  summary();
}

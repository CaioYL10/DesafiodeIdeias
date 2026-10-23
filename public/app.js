const SERVICE_LABELS = { internet: 'Internet', cloud: 'Cloud', ciberseguranca: 'Cibersegurança', suporte: 'Suporte', outro: 'Outro' };
const SENTIMENT_LABELS = { positive: 'Positivo', neutral: 'Neutro', negative: 'Negativo' };
const STATUS_LABELS = { new: 'Novo', in_review: 'Em análise', resolved: 'Resolvido' };

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  if (response.status === 401 && location.pathname.startsWith('/dashboard')) location.assign('/login');
  return response;
}

const feedbackForm = document.querySelector('#feedback-form');
if (feedbackForm) {
  const comment = document.querySelector('#comment');
  comment.addEventListener('input', () => { document.querySelector('#char-count').textContent = `${comment.value.length} / 1.000`; });
  feedbackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('#form-message');
    const data = new FormData(feedbackForm);
    const button = feedbackForm.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Enviando…'; message.textContent = '';
    try {
      const response = await api('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ service: data.get('service'), rating: Number(data.get('rating')), comment: data.get('comment'), demoData: document.querySelector('#demo-data').checked }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível enviar.');
      feedbackForm.reset(); document.querySelector('#char-count').textContent = '0 / 1.000';
      message.className = 'form-message success';
      message.textContent = result.sentimentStatus === 'completed' ? 'Feedback registrado e analisado. Obrigado por contribuir!' : 'Feedback registrado. A análise de sentimento está pendente.';
    } catch (error) { message.className = 'form-message error'; message.textContent = error.message; }
    finally { button.disabled = false; button.innerHTML = 'Enviar avaliação <span aria-hidden="true">→</span>'; }
  });
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
      location.assign(['/products', '/workspace'].includes(next) ? next : '/dashboard');
    } catch (error) { message.className = 'form-message error'; message.textContent = error.message; }
    finally { button.disabled = false; }
  });
}

const rowsElement = document.querySelector('#feedback-rows');
if (rowsElement) {
  let currentPage = 1;
  const filtersForm = document.querySelector('#filters-form');
  const filterParams = () => new URLSearchParams(new FormData(filtersForm));
  const formatDate = (value) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  async function loadSummary() {
    const response = await api('/api/manager/summary'); if (!response.ok) return;
    const summary = await response.json(); const sentiments = summary.sentimentCounts;
    document.querySelector('#metric-total').textContent = summary.total;
    document.querySelector('#metric-average').textContent = summary.averageRating === null ? '—' : summary.averageRating.toFixed(1);
    document.querySelector('#metric-positive').textContent = sentiments.positive;
    document.querySelector('#metric-negative').textContent = sentiments.negative;
    document.querySelector('#count-positive').textContent = sentiments.positive;
    document.querySelector('#count-neutral').textContent = sentiments.neutral;
    document.querySelector('#count-negative').textContent = sentiments.negative;
    const analyzed = sentiments.positive + sentiments.neutral + sentiments.negative;
    for (const [key, value] of Object.entries(sentiments)) document.querySelector(`#bar-${key}`).style.width = `${analyzed ? value / analyzed * 100 : 0}%`;
    document.querySelector('#metric-positive-foot').textContent = analyzed ? `${Math.round(sentiments.positive / analyzed * 100)}% dos comentários analisados` : 'Ainda sem comentários analisados';
    document.querySelector('#analysis-pending').textContent = summary.total > analyzed ? `${summary.total - analyzed} aguardando análise ou sem uso de IA` : `${analyzed} comentários analisados`;
    drawTrend(summary.trend);
  }

  function drawTrend(points) {
    const chart = document.querySelector('#trend-chart');
    if (!points.length) { chart.innerHTML = '<p class="chart-empty">Os dados diários aparecerão aqui quando houver feedbacks.</p>'; return; }
    const max = 5; const coords = points.map((point, index) => `${points.length === 1 ? 50 : 8 + index * 84 / (points.length - 1)},${96 - Number(point.averageRating) / max * 80}`).join(' ');
    chart.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Tendência de nota média"><defs><linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0878b4" stop-opacity=".22"/><stop offset="1" stop-color="#0878b4" stop-opacity="0"/></linearGradient></defs><path d="M ${coords} L 92,100 L 8,100 Z" fill="url(#trend-fill)"/><polyline points="${coords}" fill="none" stroke="#0878b4" stroke-width="1.6" vector-effect="non-scaling-stroke"/>${points.map((point, index) => `<circle cx="${points.length === 1 ? 50 : 8 + index * 84 / (points.length - 1)}" cy="${96 - Number(point.averageRating) / max * 80}" r="1.8" fill="#fff" stroke="#0878b4" stroke-width="1.3" vector-effect="non-scaling-stroke"/>`).join('')}</svg><div class="chart-labels">${points.filter((_, index) => index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2)).map((point) => `<span>${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${point.date}T00:00:00`))}</span>`).join('')}</div>`;
  }

  async function loadFeedback() {
    const params = filterParams(); params.set('page', currentPage); params.set('pageSize', 20);
    document.querySelector('#export-button').href = '/api/manager/export.csv?' + filterParams().toString();
    const response = await api('/api/manager/feedback?' + params.toString()); if (!response.ok) return;
    const result = await response.json();
    document.querySelector('#result-count').textContent = `${result.total} ${result.total === 1 ? 'registro' : 'registros'}`;
    if (!result.items.length) rowsElement.innerHTML = '<tr><td colspan="7" class="table-empty">Nenhum feedback encontrado com esses filtros.</td></tr>';
    else rowsElement.innerHTML = result.items.map((item) => `<tr><td class="comment-cell"><a href="/workspace#triage/${item.id}">${safe(item.comment)}</a>${item.demo_data ? '<span class="demo-chip">DEMO</span>' : ''}</td><td>${SERVICE_LABELS[item.service] || safe(item.service)}</td><td><span class="rating-value">★ ${item.rating}</span></td><td>${item.final_sentiment ? `<span class="sentiment-pill ${item.final_sentiment}">${SENTIMENT_LABELS[item.final_sentiment]}${item.reviewed_at ? ' · revisado' : ' · IA'}</span>` : `<span class="sentiment-pill pending">${item.sentiment_status === 'failed' ? 'Falhou' : 'Pendente'}</span>`}</td><td class="date-cell">${formatDate(item.created_at)}</td><td><select class="status-select ${item.handling_status}" data-status-id="${item.id}" aria-label="Status da tratativa">${Object.entries(STATUS_LABELS).map(([key, value]) => `<option value="${key}" ${item.handling_status === key ? 'selected' : ''}>${value}</option>`).join('')}</select></td><td>${item.demo_data && item.sentiment_status !== 'completed' ? `<button class="icon-button" data-reanalyze-id="${item.id}" title="Tentar análise novamente" aria-label="Tentar análise novamente">↻</button>` : ''}</td></tr>`).join('');
    document.querySelector('#pagination').innerHTML = `<span>Página ${result.page} · ${result.total} registros</span><div><button class="button button-quiet" data-page="${Math.max(1, currentPage - 1)}" ${currentPage <= 1 ? 'disabled' : ''}>← Anterior</button><button class="button button-quiet" data-page="${currentPage + 1}" ${currentPage * result.pageSize >= result.total ? 'disabled' : ''}>Próxima →</button></div>`;
  }

  filtersForm.addEventListener('submit', (event) => { event.preventDefault(); currentPage = 1; loadFeedback(); });
  filtersForm.querySelector('[name="search"]').addEventListener('search', () => { currentPage = 1; loadFeedback(); });
  rowsElement.addEventListener('change', async (event) => {
    const id = event.target.dataset.statusId; if (!id) return;
    const response = await api(`/api/manager/feedback/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: event.target.value }) });
    if (!response.ok) { alert('Não foi possível atualizar o status.'); await loadFeedback(); }
  });
  rowsElement.addEventListener('click', async (event) => {
    const id = event.target.dataset.reanalyzeId; if (!id) return;
    event.target.disabled = true;
    const response = await api(`/api/manager/feedback/${id}/reanalyze`, { method: 'POST' });
    if (!response.ok) {
      const result = await response.json();
      alert(result.error || 'Não foi possível reanalisar este comentário.');
    }
    await Promise.all([loadSummary(), loadFeedback()]);
  });
  document.querySelector('#pagination').addEventListener('click', (event) => { const page = Number(event.target.dataset.page); if (page) { currentPage = page; loadFeedback(); } });
  document.querySelector('#logout-button')?.addEventListener('click', async () => { await api('/api/auth/logout', { method: 'POST' }); location.assign('/login'); });
  async function init() {
    const response = await api('/api/auth/session'); const session = await response.json();
    if (!session.authenticated) { location.assign('/login'); return; }
    if (document.querySelector('#manager-email')) document.querySelector('#manager-email').textContent = session.email || 'Gestão';
    await Promise.all([loadSummary(), loadFeedback()]);
  }
  init();
}

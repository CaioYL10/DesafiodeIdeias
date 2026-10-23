(() => {
  const content = document.querySelector('#workspace-content');
  const message = document.querySelector('#workspace-message');
  const labels = { positive: 'Positivo', neutral: 'Neutro', negative: 'Negativo', open: 'Aberto', in_progress: 'Em tratamento', closed: 'Encerrado', pending: 'Pendente', completed: 'Aguardando verificação', effective: 'Eficaz', ineffective: 'Ineficaz · refazer ação', feedback: 'Avaliação', complaint: 'Reclamação', suggestion: 'Sugestão' };
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const date = (value) => value ? new Date(value.length === 10 ? value + 'T12:00:00' : value).toLocaleDateString('pt-BR') : '—';
  const options = (items, selected) => items.map((item) => `<option value="${item.id}" ${Number(selected) === item.id ? 'selected' : ''}>${safe(item.name)}</option>`).join('');
  let clients = [], products = [], page = 1, search = '', generation = 0;
  async function api(path, method = 'GET', body) {
    const version = generation;
    const response = await fetch('/api/manager/' + path, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (response.status === 401) { location.assign('/login?next=/workspace'); throw new Error('Entre novamente para continuar.'); }
    const result = await response.json();
    if (version !== generation) {
      const error = new Error('A navegação mudou durante a solicitação.');
      error.name = 'NavigationChanged';
      throw error;
    }
    if (!response.ok) throw new Error(result.error || 'Não foi possível concluir.');
    return result;
  }
  function notify(text, error = false) { message.textContent = text; message.className = error ? 'error' : ''; }
  function form(id, handler) {
    document.getElementById(id)?.addEventListener('submit', async (event) => {
      event.preventDefault(); const button = event.target.querySelector('button[type="submit"]'); button.disabled = true;
      try { await handler(new FormData(event.target)); }
      catch (error) { if (error.name !== 'NavigationChanged') notify(error.message, true); }
      finally { button.disabled = false; }
    });
  }
  function listen(selector, handler) {
    content.querySelectorAll(selector).forEach((button) => button.addEventListener('click', async () => {
      button.disabled = true;
      try { await handler(button); } catch (error) { if (error.name !== 'NavigationChanged') notify(error.message, true); } finally { button.disabled = false; }
    }));
  }
  async function loadClients() {
    const version = generation;
    clients = (await api('crm/clients')).items;
    products = (await api('products')).items;
    if (version !== generation) return;
    content.innerHTML = `<div class="work-grid"><section class="work-panel"><h2>Novo cliente</h2><p class="hint">Cadastre a organização e os serviços para contextualizar os relatos.</p><form id="client-form"><label for="client-name">Organização</label><input id="client-name" name="name" required maxlength="120"><label for="client-contact">Contato ou equipe de referência</label><input id="client-contact" name="contact" maxlength="200"><label for="client-products">Serviços vinculados</label><select id="client-products" name="products" multiple>${options(products)}</select><p class="hint">Use Ctrl para selecionar vários. <a href="/products">Cadastrar um serviço</a>.</p><button type="submit" class="button button-primary">Cadastrar cliente</button></form></section><section class="work-panel"><h2>Carteira de clientes <span class="work-meta">${clients.length}</span></h2><ul class="work-list">${clients.map((client) => `<li><div class="work-row"><div><h3>${safe(client.name)}</h3><p>${safe(client.contact || 'Sem contato informado')} · ${client.feedback_count} relatos</p></div><button class="text-action" data-client="${client.id}">Ver histórico</button></div></li>`).join('') || '<li class="work-empty">Nenhum cliente cadastrado. Comece pelo formulário ao lado.</li>'}</ul><div id="client-detail"></div></section></div>`;
    form('client-form', async (data) => { await api('crm/clients', 'POST', { name: data.get('name'), contact: data.get('contact'), productIds: data.getAll('products').map(Number) }); await loadClients(); notify('Cliente cadastrado.'); });
    listen('[data-client]', async (button) => {
      const result = await api('crm/clients/' + button.dataset.client);
      document.querySelector('#client-detail').innerHTML = `<div class="work-detail"><h3>Histórico · ${safe(result.client.name)}</h3><p class="work-meta">Serviços: ${result.products.map((p) => safe(p.name)).join(', ') || 'Nenhum vínculo'}</p>${result.feedbacks.map((f) => `<blockquote>${safe(f.comment)}<p class="work-meta">#${f.id} · ${date(f.created_at)} · ${safe(labels[f.kind])} · ${safe(labels[f.final_sentiment] || 'Sem classificação')}</p><a class="text-action" href="#triage/${f.id}">Abrir relato</a></blockquote>`).join('') || '<p class="work-empty">Nenhum relato associado a este cliente.</p>'}</div>`;
    });
  }
  async function loadTriage(id) {
    if (id) return feedbackDetail(id);
    const version = generation;
    const result = await api(`feedback?page=${page}&pageSize=20&search=${encodeURIComponent(search)}`);
    if (version !== generation) return;
    content.innerHTML = `<section class="work-panel"><div class="work-row"><div><h2>Fila de relatos</h2><p class="hint">Revise o contexto e o sentimento antes de decidir sobre um problema.</p></div><span class="work-meta">${result.total} registros</span></div><form id="search-form" class="work-actions"><input name="search" aria-label="Buscar relato" placeholder="Buscar comentário ou serviço" value="${safe(search)}"><button type="submit" class="button button-secondary">Buscar</button></form><ul class="work-list">${result.items.map((f) => `<li><div class="work-row"><div><h3>${safe(f.client_name || 'Cliente não vinculado')}</h3><p class="work-text">${safe(f.comment)}</p><p>#${f.id} · ${safe(f.product_name || f.service)} · ${date(f.created_at)} · ${safe(labels[f.final_sentiment] || 'Sem classificação')} ${f.reviewed_at ? '(revisado)' : '(automático ou pendente)'}</p></div><a class="text-action" href="#triage/${f.id}">Analisar</a></div></li>`).join('') || '<li class="work-empty">Nenhum relato encontrado. <a href="/feedback">Enviar feedback demonstrativo</a>.</li>'}</ul><div class="work-actions"><button class="button button-secondary" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Anterior</button><span>Página ${page}</span><button class="button button-secondary" data-page="${page + 1}" ${page * 20 >= result.total ? 'disabled' : ''}>Próxima</button></div></section>`;
    form('search-form', async (data) => { search = data.get('search'); page = 1; await loadTriage(); });
    listen('[data-page]', async (button) => { page = Number(button.dataset.page); await loadTriage(); });
  }
  async function feedbackDetail(id) {
    const version = generation;
    const [result, clientResult, productResult] = await Promise.all([api('crm/feedback/' + id), api('crm/clients'), api('products')]);
    if (version !== generation) return;
    const f = result.feedback; clients = clientResult.items; products = productResult.items;
    content.innerHTML = `<a class="text-action" href="#triage">← Voltar à fila</a><h2>Relato #${f.id}</h2><blockquote>${safe(f.comment)}<p class="work-meta">${date(f.created_at)} · ${safe(f.service)} · Nota ${f.rating}/5</p></blockquote><div class="work-grid"><section class="work-panel"><h2>Contexto do relato</h2><form id="context-form"><label for="context-client">Cliente</label><select id="context-client" name="clientId"><option value="">Não identificado</option>${options(clients, f.client_id)}</select><label for="context-product">Serviço do catálogo</label><select id="context-product" name="productId"><option value="">Não vinculado</option>${options(products, f.product_id)}</select><p class="hint">Se houver cliente, escolha um serviço cadastrado para ele.</p><label for="context-kind">Tipo de relato</label><select id="context-kind" name="kind">${['feedback', 'complaint', 'suggestion'].map((kind) => `<option value="${kind}" ${f.kind === kind ? 'selected' : ''}>${labels[kind]}</option>`).join('')}</select><button type="submit" class="button button-primary">Salvar contexto</button></form></section><section class="work-panel"><h2>Revisão humana</h2><p>Sugestão da IA: <strong>${safe(labels[f.sentiment] || 'Pendente')}</strong></p><p>Classificação adotada: <strong>${safe(labels[f.final_sentiment] || 'Ainda não definida')}</strong></p><form id="review-form"><label for="review-sentiment">Sentimento revisado</label><select id="review-sentiment" name="sentiment">${['positive', 'neutral', 'negative'].map((s) => `<option value="${s}" ${f.final_sentiment === s ? 'selected' : ''}>${labels[s]}</option>`).join('')}</select><label for="review-note">Observação da revisão</label><textarea id="review-note" name="note" maxlength="1000"></textarea><button type="submit" class="button button-primary">Registrar revisão</button></form><details><summary>Histórico de revisões (${result.reviews.length})</summary><ol class="history">${result.reviews.map((r) => `<li>${labels[r.sentiment]} · ${date(r.created_at)} · ${safe(r.reviewer)}<p>${safe(r.note)}</p></li>`).join('') || '<li>Nenhuma revisão registrada.</li>'}</ol></details></section></div><section class="work-panel work-detail"><h2>Decisão de qualidade</h2><p>Um sentimento negativo não abre um problema automaticamente. Registre aqui sua análise quando houver necessidade de tratamento.</p><form id="problem-form"><div class="work-form-row"><div><label for="problem-title">Título do problema</label><input id="problem-title" name="title" required maxlength="160"></div><div><label for="problem-category">Categoria</label><input id="problem-category" name="category" required maxlength="80" placeholder="Ex.: conectividade"></div></div><label for="problem-analysis">Análise inicial</label><textarea id="problem-analysis" name="analysis" required maxlength="2000"></textarea><label for="related-feedbacks">Outros relatos relacionados (IDs separados por vírgula)</label><input id="related-feedbacks" name="related" placeholder="Ex.: 2, 3"><p class="hint">O relato #${f.id} será incluído automaticamente. Informe apenas IDs já existentes.</p><button type="submit" class="button button-primary">Abrir problema de qualidade</button></form></section>`;
    form('context-form', async (data) => { await api('crm/feedback/' + id, 'PUT', { clientId: data.get('clientId') ? Number(data.get('clientId')) : null, productId: data.get('productId') ? Number(data.get('productId')) : null, kind: data.get('kind') }); notify('Contexto atualizado.'); });
    form('review-form', async (data) => { await api(`crm/feedback/${id}/reviews`, 'POST', { sentiment: data.get('sentiment'), note: data.get('note') }); await feedbackDetail(id); notify('Revisão registrada; sugestão original preservada.'); });
    form('problem-form', async (data) => { const related = data.get('related').trim(); const feedbackIds = [...new Set([Number(id), ...(related ? related.split(',').map((v) => Number(v.trim())) : [])])]; const created = await api('quality', 'POST', { title: data.get('title'), category: data.get('category'), analysis: data.get('analysis'), feedbackIds }); location.hash = 'quality/' + created.id; notify('Problema aberto por decisão humana.'); });
  }
  async function loadQuality(id) {
    if (id) return qualityDetail(id);
    const version = generation;
    const { items } = await api('quality');
    if (version !== generation) return;
    const open = items.filter((p) => p.status !== 'closed').length;
    const overdue = items.reduce((sum, p) => sum + p.overdue_count, 0);
    content.innerHTML = `<section class="work-panel"><div class="work-row"><div><h2>Problemas e ações</h2><p class="hint">Acompanhe o tratamento até a comprovação do resultado.</p></div><a class="button button-secondary" href="#triage">Triar relatos</a></div><div class="work-summary"><div><strong>${open}</strong><span>Problemas em aberto</span></div><div><strong>${overdue}</strong><span>Ações vencidas</span></div><div><strong>${items.length - open}</strong><span>Encerrados</span></div></div><ul class="work-list">${items.map((p) => `<li><div class="work-row"><div><h3>${safe(p.title)}</h3><p>#${p.id} · ${safe(p.category)} · ${p.action_count} ações · ${date(p.created_at)}</p><p><span class="work-status">${labels[p.status]}</span> ${p.overdue_count ? `<span class="work-status overdue">${p.overdue_count} vencidas</span>` : ''}</p></div><a class="text-action" href="#quality/${p.id}">Acompanhar</a></div></li>`).join('') || '<li class="work-empty">Nenhum problema aberto. A abertura acontece na triagem de um relato.</li>'}</ul></section>`;
  }
  async function qualityDetail(id) {
    const version = generation;
    const { problem: p, actions, events, feedbacks } = await api('quality/' + id);
    if (version !== generation) return;
    content.innerHTML = `<a class="text-action" href="#quality">← Todos os problemas</a><div class="work-row"><div><h2>${safe(p.title)}</h2><p class="work-meta">Problema #${p.id} · ${safe(p.category)} · ${labels[p.status]}</p></div>${p.status !== 'closed' ? '<button id="close-problem" class="button button-secondary">Encerrar problema</button>' : ''}</div><p class="work-text">${safe(p.analysis)}</p><p class="hint">Para encerrar, todas as ações precisam ter eficácia verificada.</p><div class="work-grid work-detail"><section class="work-panel"><h2>Contexto e histórico</h2>${feedbacks.map((f) => `<blockquote>${safe(f.comment)}<p class="work-meta">${safe(f.client_name || 'Cliente não vinculado')} · ${safe(f.product_name || f.service)}</p><a href="#triage/${f.id}" class="text-action">Relato #${f.id}</a></blockquote>`).join('')}<details open><summary>Histórico do tratamento</summary><ol class="history">${events.map((e) => `<li><span class="work-text">${safe(e.description)}</span><p class="work-meta">${date(e.created_at)} · ${safe(e.actor)}</p></li>`).join('')}</ol></details></section><section class="work-panel"><h2>Ações de melhoria</h2>${actions.map((a) => `<article class="work-action"><h3>#${a.id} · ${safe(a.description)}</h3><p>${safe(a.owner)} · Prazo ${date(a.due_date)}</p><span class="work-status">${labels[a.status]}</span>${a.evidence ? `<p class="work-text"><strong>Evidência:</strong> ${safe(a.evidence)}</p>` : ''}${a.verification_note ? `<p class="work-text"><strong>Verificação:</strong> ${safe(a.verification_note)}</p>` : ''}${['pending', 'ineffective'].includes(a.status) ? `<form id="complete-${a.id}"><label for="evidence-${a.id}">Evidência da execução</label><textarea id="evidence-${a.id}" name="evidence" required maxlength="2000"></textarea><button type="submit" class="button button-secondary">Concluir ação</button></form>` : ''}${a.status === 'completed' ? `<form id="verify-${a.id}"><label for="effective-${a.id}">Resultado da verificação posterior</label><select id="effective-${a.id}" name="effective"><option value="" selected disabled>Selecione o resultado</option><option value="true">Eficaz</option><option value="false">Ineficaz, requer nova execução</option></select><label for="verification-${a.id}">Evidência da eficácia ou falha</label><textarea id="verification-${a.id}" name="note" required maxlength="2000"></textarea><button type="submit" class="button button-secondary">Registrar verificação</button></form>` : ''}</article>`).join('') || '<p class="work-empty">Defina a primeira ação para iniciar o tratamento.</p>'}${p.status !== 'closed' ? '<details open><summary>Adicionar ação</summary><form id="action-form"><label for="action-description">O que será feito</label><textarea id="action-description" name="description" required maxlength="1000"></textarea><label for="action-owner">Responsável</label><input id="action-owner" name="owner" required maxlength="120"><label for="action-due">Prazo</label><input id="action-due" name="dueDate" type="date" required><button type="submit" class="button button-primary">Adicionar ação</button></form></details>' : ''}</section></div>`;
    form('action-form', async (data) => { await api(`quality/${id}/actions`, 'POST', Object.fromEntries(data)); await qualityDetail(id); notify('Ação adicionada ao tratamento.'); });
    for (const a of actions) {
      form('complete-' + a.id, async (data) => { await api(`quality/actions/${a.id}/complete`, 'POST', Object.fromEntries(data)); await qualityDetail(id); notify('Conclusão registrada. Verifique a eficácia posteriormente.'); });
      form('verify-' + a.id, async (data) => { if (!data.get('effective')) throw new Error('Selecione o resultado da verificação.'); await api(`quality/actions/${a.id}/verify`, 'POST', { effective: data.get('effective') === 'true', note: data.get('note') }); await qualityDetail(id); notify('Verificação registrada.'); });
    }
    listen('#close-problem', async () => { await api(`quality/${id}/close`, 'POST'); await qualityDetail(id); notify('Problema encerrado com eficácia verificada.'); });
  }
  async function render() {
    const [route, id] = location.hash.slice(1).split('/');
    const tab = route || 'clients';
    const current = ++generation;
    notify('');
    document.querySelectorAll('[data-tab]').forEach((link) => { if (link.dataset.tab === tab) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
    content.innerHTML = '<p class="work-empty">Carregando…</p>';
    try {
      if (tab === 'triage') await loadTriage(id);
      else if (tab === 'quality') await loadQuality(id);
      else await loadClients();
    } catch (error) {
      if (current !== generation) return;
      content.innerHTML = '<section class="work-panel"><p>Não foi possível carregar esta área.</p><button id="retry" class="button button-secondary">Tentar novamente</button></section>';
      document.querySelector('#retry').addEventListener('click', render); notify(error.message, true);
    }
  }
  window.addEventListener('hashchange', render);
  render();
})();

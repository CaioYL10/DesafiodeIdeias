(async function () {
  const container = document.querySelector('#site-navigation');
  if (!container) return;
  try {
    const response = await fetch('/api/auth/session', { cache: 'no-store' });
    const session = await response.json();
    const path = location.pathname;
    const active = (url) => path === url ? ' aria-current="page"' : '';
    container.innerHTML = `<header class="site-header"><a class="brand cti-brand" href="/" aria-label="CTI AvaliaPlay - Visão geral"><span class="cti-symbol">cti</span><span>AvaliaPlay<span class="brand-sub">Relacionamento e qualidade</span></span></a><nav class="site-nav" aria-label="Navegação principal"><a href="/"${active('/')}>Visão geral</a><a href="/feedback"${active('/feedback')}>Enviar feedback</a>${session.authenticated ? `<a href="/dashboard"${active('/dashboard')}>Dashboard</a><a href="/workspace"${active('/workspace')}>Clientes e qualidade</a><a href="/products"${active('/products')}>Serviços</a>` : `<a href="/login"${active('/login')}>Área do gestor</a>`}</nav>${session.authenticated ? '<button class="button button-secondary" id="nav-logout">Sair</button>' : ''}</header>`;
    document.querySelector('#nav-logout')?.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST' }); location.assign('/');
    });
  } catch { container.textContent = 'Não foi possível carregar a navegação. Atualize a página.'; }
})();

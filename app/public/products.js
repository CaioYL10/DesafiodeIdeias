(async function () {
  const form = document.querySelector('#product-form');
  const message = document.querySelector('#product-message');
  const list = document.querySelector('#product-list');
  async function load() {
    const response = await fetch('/api/manager/products', { cache: 'no-store' });
    if (response.status === 401) { location.assign('/login?next=/products'); return; }
    if (!response.ok) throw new Error('Não foi possível carregar os cadastros.');
    const result = await response.json();
    list.replaceChildren();
    if (!result.items.length) { list.textContent = 'Nenhum cadastro ainda. Adicione o primeiro produto ou serviço.'; return; }
    for (const item of result.items) {
      const article = document.createElement('article'); article.className = 'product-item';
      const title = document.createElement('h3'); title.textContent = item.name;
      const type = document.createElement('span'); type.className = 'muted'; type.textContent = item.type === 'service' ? 'Serviço' : 'Produto';
      const description = document.createElement('p'); description.textContent = item.description;
      article.append(type, title, description); list.append(article);
    }
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const button = form.querySelector('button'); button.disabled = true; message.textContent = '';
    try {
      const response = await fetch('/api/manager/products', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      if (response.status === 401) { location.assign('/login?next=/products'); return; }
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      form.reset(); message.className = 'form-message success'; message.textContent = 'Cadastro salvo.'; await load();
    } catch (error) { message.className = 'form-message error'; message.textContent = error.message; }
    finally { button.disabled = false; }
  });
  try { await load(); } catch (error) { list.textContent = error.message; }
})();

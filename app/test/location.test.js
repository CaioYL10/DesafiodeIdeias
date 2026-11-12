const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../public/assets/app.js'), 'utf8');

function createPage(route = '/clientes', savedData) {
  const root = { innerHTML: '' };
  const location = { pathname: route };
  const listeners = {};
  const fields = {
    '#client-cep': { value: '01001-000' },
    '#client-city': { value: '' },
    '#client-state-code': { value: '' },
    '#cep-status': { textContent: '' }
  };
  const values = {
    'avaliaplay-login': '1',
    'avaliaplay-data': savedData ? JSON.stringify(savedData) : null
  };
  const storage = {
    getItem(key) { return values[key] || null; },
    setItem(key, value) { values[key] = value; },
    removeItem(key) { delete values[key]; }
  };
  const context = {
    document: {
      querySelector: selector => selector === '#app' ? root : fields[selector] || null,
      addEventListener(type, callback) { listeners[type] = callback; }
    },
    location,
    localStorage: storage,
    sessionStorage: storage,
    history: {
      replaceState(_state, _title, url) { location.pathname = url; },
      pushState(_state, _title, url) { location.pathname = url; }
    },
    addEventListener() {},
    scrollTo() {},
    setTimeout() {},
    Intl,
    Date
  };
  vm.runInNewContext(source, context);
  return { root, listeners, context, fields };
}

test('consulta CEP válido e devolve município e UF para o cadastro', async () => {
  const { context } = createPage();
  const requestedUrls = [];
  const address = await context.lookupCep('01001-000', async url => {
    requestedUrls.push(url);
    return {
      ok: true,
      json: async () => ({ cep: '01001-000', localidade: 'São Paulo', uf: 'SP' })
    };
  });

  assert.deepEqual(JSON.parse(JSON.stringify(address)), {
    cep: '01001-000',
    city: 'São Paulo',
    stateCode: 'SP'
  });
  assert.deepEqual(requestedUrls, ['https://viacep.com.br/ws/01001000/json/']);
});

test('rejeita CEP inválido ou inexistente sem criar uma localização', async () => {
  const { context } = createPage();
  let requests = 0;
  const fetcher = async () => {
    requests += 1;
    return { ok: true, json: async () => ({ erro: true }) };
  };

  await assert.rejects(context.lookupCep('0100A-000', fetcher), /8 dígitos/);
  await assert.rejects(context.lookupCep('99999-999', fetcher), /não encontrado/);
  assert.equal(requests, 1);
});

test('botão de consulta preenche cidade e UF no formulário do cliente', async () => {
  const page = createPage();
  page.context.fetch = async url => {
    assert.equal(url, 'https://viacep.com.br/ws/01001000/json/');
    return {
      ok: true,
      json: async () => ({ cep: '01001-000', localidade: 'São Paulo', uf: 'SP' })
    };
  };

  await page.listeners.click({
    target: {
      closest: selector => selector === '[data-action]' ? { dataset: { action: 'lookup-cep' } } : null
    }
  });

  assert.equal(page.fields['#client-city'].value, 'São Paulo');
  assert.equal(page.fields['#client-state-code'].value, 'SP');
  assert.match(page.fields['#cep-status'].textContent, /Localização encontrada/);
});

test('mapa agrupa clientes de demonstração por estado e mostra suas cidades', () => {
  const page = createPage();
  page.listeners.click({
    target: {
      closest: selector => selector === '[data-action]' ? { dataset: { action: 'map' } } : null
    }
  });

  assert.match(page.root.innerHTML, /São Paulo/);
  assert.match(page.root.innerHTML, /class="map-state-label"[^>]*><span>SP<\/span><b>1<\/b>/);
  assert.match(page.root.innerHTML, /title="SP: 1 empresa"/);
  assert.doesNotMatch(page.root.innerHTML, /Sem localização para análise/);
});

test('migra clientes já salvos sem CEP e recupera as localizações demonstrativas', () => {
  const savedData = {
    clients: [
      { id: 1, name: 'Formtap', contact: 'Equipe de relacionamento', email: '', services: [], meetings: [] },
      { id: 2, name: 'Tecnolab', contact: 'Equipe de relacionamento', email: '', services: [], meetings: [] },
      { id: 3, name: 'Sicredi', contact: 'Equipe de relacionamento', email: '', services: [], meetings: [] },
      { id: 4, name: 'Acrilex', contact: 'Equipe de relacionamento', email: '', services: [], meetings: [] },
      { id: 5, name: 'Maple Bear', contact: 'Equipe de relacionamento', email: '', services: [], meetings: [] },
      { id: 6, name: '99', contact: 'Contato não informado', email: '', services: [], meetings: [] }
    ],
    feedbacks: [],
    services: []
  };
  const page = createPage('/clientes', savedData);
  page.listeners.click({
    target: {
      closest: selector => selector === '[data-action]' ? { dataset: { action: 'map' } } : null
    }
  });

  assert.match(page.root.innerHTML, /6 empresas em 6 estados/);
  assert.match(page.root.innerHTML, /Salvador/);
  assert.equal(JSON.parse(page.context.localStorage.getItem('avaliaplay-data')).demoDataVersion, 6);
});

test('formulário de cliente permite editar CEP e município', () => {
  const page = createPage();
  page.listeners.click({
    target: {
      closest: selector => selector === '[data-action]' ? { dataset: { action: 'edit-client', id: '1' } } : null
    }
  });

  assert.match(page.root.innerHTML, /name="cep"/);
  assert.match(page.root.innerHTML, /name="city"/);
  assert.match(page.root.innerHTML, /Consultar CEP/);
  assert.equal((page.root.innerHTML.match(/Consulte o CEP/g) || []).length, 1);
});

test('modal de edição organiza dados da empresa, contato e localização por seção', () => {
  const page = createPage();
  page.listeners.click({
    target: {
      closest: selector => selector === '[data-action]' ? { dataset: { action: 'edit-client', id: '1' } } : null
    }
  });

  assert.match(page.root.innerHTML, /class="client-edit-layout"/);
  assert.match(page.root.innerHTML, /<h3>Dados da empresa<\/h3>/);
  assert.match(page.root.innerHTML, /<h3>Serviços vinculados<\/h3>/);
  assert.match(page.root.innerHTML, /<h3>Localização<\/h3>/);
});

test('modal de reunião organiza convite e ata no mesmo formulário', () => {
  const page = createPage();
  page.listeners.click({
    target: {
      closest: selector => selector === '[data-action]' ? { dataset: { action: 'new-meeting', id: '1' } } : null
    }
  });

  assert.match(page.root.innerHTML, /class="modal-body meeting-form-section"/);
  assert.match(page.root.innerHTML, /class="meeting-form-fields"/);
  assert.match(page.root.innerHTML, /name="title"/);
  assert.match(page.root.innerHTML, /name="date"/);
  assert.match(page.root.innerHTML, /name="invitees"/);
  assert.match(page.root.innerHTML, /name="invitationText"/);
  assert.match(page.root.innerHTML, /name="minutes"/);
  assert.match(page.root.innerHTML, /name="attachment"/);
});

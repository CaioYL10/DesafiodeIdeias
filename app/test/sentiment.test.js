const test = require('node:test');
const assert = require('node:assert/strict');
const { createSentimentService } = require('../src/services/sentiment');

test('usa formato estruturado e valida o rótulo de sentimento', async () => {
  let request;
  const service = createSentimentService({ apiKey: 'demo-key', model: 'modelo-demo', fetchImpl: async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: '{"sentiment":"positive"}' }] }] }) };
  } });
  assert.deepEqual(await service.classify('Comentário fictício.'), { sentiment: 'positive' });
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  const body = JSON.parse(request.options.body);
  assert.equal(body.store, false);
  assert.equal(body.text.format.type, 'json_schema');
  assert.equal(body.text.format.schema.properties.sentiment.enum.length, 3);
});

test('recusa a chamada sem chave de API', async () => {
  const service = createSentimentService({ apiKey: '', fetchImpl: async () => { throw new Error('não deve chamar rede'); } });
  await assert.rejects(service.classify('comentário fictício'), /OPENAI_API_KEY/);
});

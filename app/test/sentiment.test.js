const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('serviço local de sentimento e rota de coleta foram retirados', () => {
  for (const file of ['services/sentiment.js', 'routes/feedback-routes.js']) {
    assert.equal(fs.existsSync(path.join(__dirname, '../src', file)), false);
  }
  const { createFeedbackRepository } = require('../src/db/feedback-repository');
  assert.equal(typeof createFeedbackRepository({}).setSentiment, 'undefined');
});

test('runtime e configuração de exemplo não dependem de OPENAI', () => {
  for (const file of ['src/app.js', 'src/server.js', 'routes/manager-routes.js', '.env.example']) {
    const location = file.startsWith('routes/') ? '../src/' + file : '../' + file;
    assert.doesNotMatch(fs.readFileSync(path.join(__dirname, location), 'utf8'), /OPENAI_|createSentimentService|sentimentService|\.classify\(/);
  }
});

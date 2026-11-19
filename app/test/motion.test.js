const test = require('node:test');
const assert = require('node:assert/strict');
const { createMotionController } = require('../public/assets/motion');

test('anima apenas mudancas de tela e abertura de janela', () => {
  const calls = [];
  const page = {};
  const modal = {};
  const root = { querySelector: selector => selector === '.modal' ? modal : page };
  const motion = createMotionController({ from: (element, options) => calls.push({ element, options }) }, () => false);
  motion(root, '/clientes', null);
  motion(root, '/clientes', null);
  motion(root, '/clientes', 'profile:1');
  motion(root, '/clientes', 'profile:1');
  motion(root, '/clientes', null);
  motion(root, '/dashboard', null);
  assert.deepEqual(calls.map(call => call.element), [page, modal, page]);
});

test('respeita movimento reduzido e funciona sem GSAP', () => {
  let calls = 0;
  const root = { querySelector: () => ({}) };
  createMotionController({ from: () => calls++ }, () => true)(root, '/', null);
  createMotionController(null, () => false)(root, '/', null);
  assert.equal(calls, 0);
});

test('entre abas da gestao anima somente o conteudo', () => {
  const calls = [];
  const page = {};
  const content = {};
  const root = { querySelector: selector => selector === '.tabs + section' ? content : page };
  const motion = createMotionController({ from: element => calls.push(element) }, () => false);
  motion(root, '/dashboard', null);
  motion(root, '/clientes', null);
  motion(root, '/tarefas', null);
  motion(root, '/acoes', null);
  motion(root, '/dashboard', null);
  assert.equal(calls.length, 5);
  [page, page, content, content, page].forEach((element, index) => assert.strictEqual(calls[index], element));
});

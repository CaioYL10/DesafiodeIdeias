// Dados fictícios locais; este formato não representa um contrato externo oficial.
function getDemoFeedbacks() {
  const base = { sourceSystem: 'demo-external', occurredAt: '2026-11-01T12:00:00.000Z', service: 'internet', kind: 'complaint', comment: 'Não recebemos retorno sobre o prazo informado.', dimension: 'relationship', client: { name: 'Alvorada Exemplo Ltda', cnpj: '11222333000181' }, externalClientId: 'cli-100' };
  const first = { ...base, externalEventId: 'evt-1001', externalClassification: 'prioridade informada pela origem' };
  const mixed = { ...base, externalEventId: 'evt-1002', dimension: 'mixed', technicalReference: 'ticket técnico fictício T-2', comment: 'Houve oscilação e não recebemos retorno.' };
  return [first, mixed, { ...mixed },
    { ...base, externalEventId: 'evt-1003', client: { name: 'Identidade conflitante', cnpj: '11444777000161' } },
    { ...base, externalEventId: 'evt-1004', dimension: 'technical', comment: 'Oscilação técnica registrada na origem.', technicalReference: 'ticket técnico fictício T-4' },
    { ...base, externalEventId: 'evt-1005', externalClientId: 'cli-200', client: { name: 'Horizonte Exemplo Ltda', cnpj: '11444777000161' } },
    { ...base, externalEventId: 'evt-invalido', rating: 9 }];
}
module.exports = { getDemoFeedbacks };

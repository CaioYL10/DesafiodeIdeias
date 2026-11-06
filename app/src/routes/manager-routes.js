const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { ALLOWED_HANDLING_STATUSES } = require('../db/feedback-repository');
const { audit, atomic } = require('./client-routes');

const services = new Set(['internet', 'cloud', 'ciberseguranca', 'suporte', 'outro']);

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function queryFilters(query) {
  const filters = [];
  const values = [];
  if (query.service && services.has(query.service)) { filters.push('service = ?'); values.push(query.service); }
  if (query.status && ALLOWED_HANDLING_STATUSES.has(query.status)) { filters.push('handling_status = ?'); values.push(query.status); }
  for (const [key, column] of [['dimension', 'dimension'], ['identity', 'identity_status'], ['source', 'source_system']]) {
    if (query[key]) { filters.push(column + ' = ?'); values.push(query[key]); }
  }
  if (isIsoDate(query.from)) { filters.push('created_at >= ?'); values.push(query.from + 'T00:00:00.000Z'); }
  if (isIsoDate(query.to)) { filters.push('created_at < ?'); values.push(new Date(Date.parse(query.to + 'T00:00:00.000Z') + 86400000).toISOString()); }
  if (typeof query.search === 'string' && query.search.trim()) {
    filters.push('(comment LIKE ? ESCAPE \'\\\' OR service LIKE ? ESCAPE \'\\\' OR client_name LIKE ? ESCAPE \'\\\' OR external_event_id LIKE ? ESCAPE \'\\\')');
    const escaped = '%' + query.search.trim().replace(/[\\%_]/g, '\\$&') + '%';
    values.push(escaped, escaped, escaped, escaped);
  }
  return { where: filters.length ? 'WHERE ' + filters.join(' AND ') : '', values };
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function createManagerRouter(database) {
  const router = express.Router();
  router.use(requireManager(database));
  router.use((request, response, next) => {
    response.set('Cache-Control', 'no-store');
    if (Object.hasOwn(request.query, 'sentiment')) return response.status(400).json({ error: 'Filtro de sentimento local removido.' });
    const q = request.query;
    if ((q.service && !services.has(q.service)) || (q.status && !ALLOWED_HANDLING_STATUSES.has(q.status)) ||
      (q.dimension && !['technical', 'relationship', 'mixed'].includes(q.dimension)) ||
      (q.identity && !['pending', 'linked', 'created', 'rejected'].includes(q.identity)) ||
      (q.source !== undefined && (typeof q.source !== 'string' || q.source.length > 100)) ||
      (q.search !== undefined && (typeof q.search !== 'string' || q.search.length > 200)) ||
      (q.from && !isIsoDate(q.from)) || (q.to && !isIsoDate(q.to)) || (q.from && q.to && q.from > q.to) ||
      ['page', 'pageSize'].some(key => q[key] !== undefined && (!/^\d+$/.test(q[key]) || !Number.isSafeInteger(Number(q[key])) || Number(q[key]) < 1 || Number(q[key]) > (key === 'pageSize' ? 100 : 1000000)))) {
      return response.status(400).json({ error: 'Filtros ou paginação inválidos.' });
    }
    return next();
  });

  router.get('/summary', (request, response) => {
    const total = database.prepare('SELECT COUNT(*) AS total FROM feedbacks').get().total;
    const average = database.prepare('SELECT AVG(rating) AS average FROM feedbacks').get().average;
    const rangeEnd = new Date();
    rangeEnd.setUTCHours(0, 0, 0, 0);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);
    const rangeStart = new Date(rangeEnd.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const trend = database.prepare(`SELECT substr(created_at, 1, 10) AS date, ROUND(AVG(rating), 2) AS averageRating,
      COUNT(*) AS total FROM feedbacks WHERE rating IS NOT NULL AND created_at >= ? AND created_at < ? GROUP BY date ORDER BY date`)
      .all(rangeStart, rangeEnd.toISOString());
    return response.json({ total, averageRating: average === null ? null : Number(average.toFixed(2)), trend,
      definitions: { total: 'Contagem de todos os registros autorizados, incluindo histórico legado; todo o período armazenado.',
        averageRating: 'Soma das notas / quantidade de registros com nota; escala 1 a 5; todo o período armazenado.',
        trend: 'Média diária das notas não nulas, agrupada pela data de recebimento UTC.', from: rangeStart, toExclusive: rangeEnd.toISOString() } });
  });

  router.get('/feedback', (request, response) => {
    const { where, values } = queryFilters(request.query);
    const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(request.query.pageSize, 10) || 50));
    const total = database.prepare(`SELECT COUNT(*) AS total FROM feedback_overview ${where}`).get(...values).total;
    const rows = database.prepare(`SELECT * FROM feedback_overview ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .all(...values, pageSize, (page - 1) * pageSize);
    return response.json({ items: rows, total, page, pageSize });
  });

  router.patch('/feedback/:id/status', (request, response) => {
    const data = request.body || {};
    const { status } = data;
    if (Object.keys(data).some(key => key !== 'status') || !ALLOWED_HANDLING_STATUSES.has(status)) return response.status(400).json({ error: 'Somente status interno válido é aceito.' });
    const feedback = database.prepare('SELECT * FROM feedback_overview WHERE id = ?').get(request.params.id);
    if (!feedback) return response.status(404).json({ error: 'Feedback não encontrado.' });
    if (!feedback.client_id || feedback.identity_status === 'pending') return response.status(409).json({ error: 'Resolva a identidade do cliente antes de alterar o acompanhamento interno.' });
    if (feedback.handling_status === status) return response.json({ updated: false });
    atomic(database, () => {
      database.prepare('UPDATE feedbacks SET handling_status = ? WHERE id = ?').run(status, feedback.id);
      audit(database, feedback.client_id, request.manager.id, { action: 'feedback-handling-status', feedbackId: feedback.id,
        before: feedback.handling_status, after: status });
    });
    return response.json({ updated: true });
  });

  router.get('/export.csv', (request, response) => {
    const { where, values } = queryFilters(request.query);
    const rows = database.prepare(`SELECT id, service, rating, comment, created_at, handling_status, source_system, external_event_id, external_classification
      FROM feedback_overview ${where} ORDER BY created_at DESC, id DESC`).all(...values);
    const header = ['ID', 'Serviço', 'Nota', 'Comentário', 'Criado em', 'Tratativa', 'Sistema de origem', 'Evento externo', 'Classificação externa (origem)'];
    const csv = '\uFEFF' + [header, ...rows.map((row) => [row.id, row.service, row.rating, row.comment, row.created_at,
      row.handling_status, row.source_system, row.external_event_id, row.external_classification])].map((line) => line.map(csvCell).join(',')).join('\r\n');
    response.setHeader('content-type', 'text/csv; charset=utf-8');
    response.setHeader('content-disposition', 'attachment; filename="feedbacks-cti.csv"');
    return response.send(csv);
  });

  return router;
}

module.exports = { createManagerRouter, queryFilters, csvCell };

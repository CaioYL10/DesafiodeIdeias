const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { ALLOWED_HANDLING_STATUSES } = require('../db/feedback-repository');

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
  if (isIsoDate(query.from)) { filters.push('created_at >= ?'); values.push(query.from + 'T00:00:00.000Z'); }
  if (isIsoDate(query.to)) { filters.push('created_at < ?'); values.push(new Date(Date.parse(query.to + 'T00:00:00.000Z') + 86400000).toISOString()); }
  if (typeof query.search === 'string' && query.search.trim()) {
    filters.push('(comment LIKE ? ESCAPE \'\\\' OR service LIKE ? ESCAPE \'\\\')');
    const escaped = '%' + query.search.trim().replace(/[\\%_]/g, '\\$&') + '%';
    values.push(escaped, escaped);
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
    if (Object.hasOwn(request.query, 'sentiment')) return response.status(400).json({ error: 'Filtro de sentimento local removido.' });
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
    return response.json({ total, averageRating: average === null ? null : Number(average.toFixed(2)), trend });
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
    const { status } = request.body || {};
    if (!ALLOWED_HANDLING_STATUSES.has(status)) return response.status(400).json({ error: 'Status inválido.' });
    const result = database.prepare('UPDATE feedbacks SET handling_status = ? WHERE id = ?').run(status, request.params.id);
    if (!result.changes) return response.status(404).json({ error: 'Feedback não encontrado.' });
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

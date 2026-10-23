const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { ALLOWED_HANDLING_STATUSES, ALLOWED_SENTIMENTS } = require('../db/feedback-repository');

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
  if (query.sentiment && ALLOWED_SENTIMENTS.has(query.sentiment)) { filters.push('final_sentiment = ?'); values.push(query.sentiment); }
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

function createManagerRouter(database, sentimentService) {
  const router = express.Router();
  router.use(requireManager(database));

  router.get('/summary', (request, response) => {
    const total = database.prepare('SELECT COUNT(*) AS total FROM feedbacks').get().total;
    const average = database.prepare('SELECT AVG(rating) AS average FROM feedbacks').get().average;
    const sentimentRows = database.prepare("SELECT final_sentiment AS sentiment, COUNT(*) AS count FROM feedback_overview WHERE final_sentiment IS NOT NULL GROUP BY final_sentiment").all();
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    for (const row of sentimentRows) sentimentCounts[row.sentiment] = row.count;
    const rangeEnd = new Date();
    rangeEnd.setUTCHours(0, 0, 0, 0);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);
    const rangeStart = new Date(rangeEnd.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const trend = database.prepare(`SELECT substr(created_at, 1, 10) AS date, ROUND(AVG(rating), 2) AS averageRating,
      COUNT(*) AS total FROM feedbacks WHERE created_at >= ? AND created_at < ? GROUP BY date ORDER BY date`)
      .all(rangeStart, rangeEnd.toISOString());
    return response.json({ total, averageRating: average === null ? null : Number(average.toFixed(2)), sentimentCounts, trend });
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

  router.post('/feedback/:id/reanalyze', async (request, response) => {
    const feedback = database.prepare('SELECT * FROM feedbacks WHERE id = ?').get(request.params.id);
    if (!feedback) return response.status(404).json({ error: 'Feedback não encontrado.' });
    if (!feedback.demo_data) return response.status(403).json({ error: 'A IA só analisa dados demonstrativos.' });
    if (!['pending', 'failed'].includes(feedback.sentiment_status)) return response.status(409).json({ error: 'Este feedback já foi analisado.' });
    if (!sentimentService || typeof sentimentService.classify !== 'function' || sentimentService.isConfigured === false) return response.status(503).json({ error: 'Configure OPENAI_API_KEY para habilitar a análise.' });
    try {
      const result = await sentimentService.classify(feedback.comment);
      if (!ALLOWED_SENTIMENTS.has(result?.sentiment)) throw new Error('Resposta inválida');
      database.prepare("UPDATE feedbacks SET sentiment = ?, sentiment_status = 'completed' WHERE id = ?").run(result.sentiment, feedback.id);
      return response.json({ sentimentStatus: 'completed', sentiment: result.sentiment });
    } catch {
      database.prepare("UPDATE feedbacks SET sentiment = NULL, sentiment_status = 'failed' WHERE id = ?").run(feedback.id);
      return response.status(502).json({ error: 'Não foi possível analisar agora.' });
    }
  });

  router.get('/export.csv', (request, response) => {
    const { where, values } = queryFilters(request.query);
    const rows = database.prepare(`SELECT id, service, rating, comment, created_at, sentiment, sentiment_status, handling_status, reviewed_sentiment, final_sentiment
      FROM feedback_overview ${where} ORDER BY created_at DESC, id DESC`).all(...values);
    const header = ['ID', 'Serviço', 'Nota', 'Comentário', 'Criado em', 'Sugestão da IA', 'Status da análise', 'Tratativa', 'Revisão humana', 'Sentimento adotado'];
    const csv = '\uFEFF' + [header, ...rows.map((row) => [row.id, row.service, row.rating, row.comment, row.created_at,
      row.sentiment, row.sentiment_status, row.handling_status, row.reviewed_sentiment, row.final_sentiment])].map((line) => line.map(csvCell).join(',')).join('\r\n');
    response.setHeader('content-type', 'text/csv; charset=utf-8');
    response.setHeader('content-disposition', 'attachment; filename="feedbacks-cti.csv"');
    return response.send(csv);
  });

  return router;
}

module.exports = { createManagerRouter, queryFilters, csvCell };

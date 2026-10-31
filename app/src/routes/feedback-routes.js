const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { ALLOWED_SERVICES, ALLOWED_SENTIMENTS, SOURCE_CHANNELS, createFeedbackRepository } = require('../db/feedback-repository');

function optionalText(value, limit) {
  return typeof value === 'string' && value.trim().length <= limit ? value.trim() : null;
}

function createFeedbackRouter(database, sentimentService) {
  const router = express.Router();
  const repository = createFeedbackRepository(database);

  async function receive(request, response, internal) {
    const body = request.body || {};
    const { service, rating, comment, demoData, kind = 'feedback' } = body;
    const sourceChannel = internal ? body.sourceChannel : 'form';
    const sourceProtocol = optionalText(internal ? body.sourceProtocol ?? '' : '', 120);
    const reportedOrganization = optionalText(body.reportedOrganization, 120);
    const reportedContact = optionalText(body.reportedContact, 120);
    const reportedEmail = optionalText(body.reportedEmail ?? '', 254);
    const parsedRating = rating === null || rating === undefined || rating === '' ? null : rating;
    if (!ALLOWED_SERVICES.has(service) || !['feedback', 'complaint', 'suggestion'].includes(kind) ||
      (parsedRating !== null && (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5)) ||
      (kind === 'feedback' && parsedRating === null) ||
      typeof comment !== 'string' || !comment.trim() || comment.trim().length > 1000 ||
      !SOURCE_CHANNELS.includes(sourceChannel) || (internal && sourceChannel === 'form') ||
      sourceProtocol === null || reportedOrganization === null || reportedContact === null || reportedEmail === null ||
      !reportedOrganization || !reportedContact ||
      (reportedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reportedEmail))) {
      return response.status(400).json({ error: 'Informe origem, organização, contato, serviço, tipo e comentário válidos; nota é obrigatória apenas para avaliação.' });
    }
    if (sourceProtocol) {
      const duplicate = database.prepare('SELECT id FROM feedbacks WHERE source_channel = ? AND source_protocol = ? LIMIT 1')
        .get(sourceChannel, sourceProtocol);
      if (duplicate && !(internal && body.allowDuplicate === true)) {
        return response.status(409).json({ error: `Possível duplicidade: relato #${duplicate.id} usa este canal e protocolo. Revise antes de registrar novamente.`, duplicateId: duplicate.id });
      }
    }

    const feedback = repository.create({ service, rating: parsedRating, comment: comment.trim(), demoData: demoData === true,
      sourceChannel, sourceProtocol, reportedOrganization, reportedContact, reportedEmail, kind });
    const created = (sentimentStatus) => response.status(201).json({ id: feedback.id, sentimentStatus });
    if (demoData !== true || !sentimentService || typeof sentimentService.classify !== 'function' || sentimentService.isConfigured === false) {
      return created('pending');
    }
    try {
      const result = await sentimentService.classify(feedback.comment);
      if (!result || !ALLOWED_SENTIMENTS.has(result.sentiment)) throw new Error('Resposta de sentimento inválida.');
      repository.setSentiment(feedback.id, result.sentiment, 'completed');
      return created('completed');
    } catch {
      repository.setSentiment(feedback.id, null, 'failed');
      return created('failed');
    }
  }

  router.post('/', (request, response) => receive(request, response, false));
  router.post('/internal', requireManager(database), (request, response) => receive(request, response, true));
  return router;
}

module.exports = { createFeedbackRouter };

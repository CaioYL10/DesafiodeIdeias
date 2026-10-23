const express = require('express');
const { ALLOWED_SERVICES, ALLOWED_SENTIMENTS, createFeedbackRepository } = require('../db/feedback-repository');

function createFeedbackRouter(database, sentimentService) {
  const router = express.Router();
  const repository = createFeedbackRepository(database);

  router.post('/', async (request, response) => {
    const { service, rating, comment, demoData } = request.body || {};
    if (!ALLOWED_SERVICES.has(service) || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
        typeof comment !== 'string' || !comment.trim() || comment.trim().length > 1000) {
      return response.status(400).json({ error: 'Informe serviço, nota de 1 a 5 e comentário de até 1.000 caracteres.' });
    }

    const feedback = repository.create({ service, rating, comment: comment.trim(), demoData: demoData === true });
    if (demoData !== true) return response.status(201).json({ id: feedback.id, sentimentStatus: 'pending' });
    if (sentimentService?.isConfigured === false) return response.status(201).json({ id: feedback.id, sentimentStatus: 'pending' });
    if (!sentimentService || typeof sentimentService.classify !== 'function') {
      return response.status(201).json({ id: feedback.id, sentimentStatus: 'pending' });
    }

    try {
      const result = await sentimentService.classify(feedback.comment);
      if (!result || !ALLOWED_SENTIMENTS.has(result.sentiment)) throw new Error('Resposta de sentimento inválida.');
      repository.setSentiment(feedback.id, result.sentiment, 'completed');
      return response.status(201).json({ id: feedback.id, sentimentStatus: 'completed' });
    } catch {
      repository.setSentiment(feedback.id, null, 'failed');
      return response.status(201).json({ id: feedback.id, sentimentStatus: 'failed' });
    }
  });

  return router;
}

module.exports = { createFeedbackRouter };

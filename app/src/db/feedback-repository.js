const ALLOWED_SERVICES = new Set(['internet', 'cloud', 'ciberseguranca', 'suporte', 'outro']);
const ALLOWED_SENTIMENTS = new Set(['positive', 'neutral', 'negative']);
const ALLOWED_HANDLING_STATUSES = new Set(['new', 'in_review', 'resolved']);

function createFeedbackRepository(database) {
  return {
    create({ service, rating, comment, demoData = false, sentiment = null, sentimentStatus = 'pending' }) {
      const result = database.prepare(`
        INSERT INTO feedbacks (service, rating, comment, demo_data, created_at, sentiment, sentiment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(service, rating, comment, demoData ? 1 : 0, new Date().toISOString(), sentiment, sentimentStatus);
      return database.prepare('SELECT * FROM feedbacks WHERE id = ?').get(result.lastInsertRowid);
    },
    setSentiment(id, sentiment, status) {
      database.prepare('UPDATE feedbacks SET sentiment = ?, sentiment_status = ? WHERE id = ?')
        .run(sentiment, status, id);
    }
  };
}

module.exports = { ALLOWED_SERVICES, ALLOWED_SENTIMENTS, ALLOWED_HANDLING_STATUSES, createFeedbackRepository };

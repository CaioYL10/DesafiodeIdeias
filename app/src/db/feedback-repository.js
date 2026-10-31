const ALLOWED_SERVICES = new Set(['internet', 'cloud', 'ciberseguranca', 'suporte', 'outro']);
const ALLOWED_SENTIMENTS = new Set(['positive', 'neutral', 'negative']);
const ALLOWED_HANDLING_STATUSES = new Set(['new', 'in_review', 'resolved']);
const SOURCE_CHANNELS = Object.freeze(['form', 'email', 'phone', 'internal']);

function createFeedbackRepository(database) {
  return {
    create({ service, rating = null, comment, demoData = false, sentiment = null, sentimentStatus = 'pending',
      sourceChannel = 'form', sourceProtocol = '', reportedOrganization = '', reportedContact = '', reportedEmail = '', kind = 'feedback' }) {
      const now = new Date().toISOString();
      const result = database.prepare(`
        INSERT INTO feedbacks (service, rating, comment, demo_data, created_at, received_at, sentiment, sentiment_status,
          source_channel, source_protocol, reported_organization, reported_contact, reported_email, source_kind)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(service, rating, comment, demoData ? 1 : 0, now, now, sentiment, sentimentStatus,
        sourceChannel, sourceProtocol, reportedOrganization, reportedContact, reportedEmail, kind);
      return database.prepare('SELECT * FROM feedbacks WHERE id = ?').get(result.lastInsertRowid);
    },
    setSentiment(id, sentiment, status) {
      database.prepare('UPDATE feedbacks SET sentiment = ?, sentiment_status = ? WHERE id = ?')
        .run(sentiment, status, id);
    }
  };
}

module.exports = { ALLOWED_SERVICES, ALLOWED_SENTIMENTS, ALLOWED_HANDLING_STATUSES, SOURCE_CHANNELS, createFeedbackRepository };

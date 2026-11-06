// Uso local: node scripts/load-demo-feedbacks.js [caminho-sqlite]; sem caminho usa memória.
const { openDatabase } = require('../src/db/database');
const { createIngestionService } = require('../src/services/feedback-ingestion');
const { getDemoFeedbacks } = require('../src/services/demo-feedback-source');
const db = openDatabase(process.argv[2] || ':memory:');
try {
  const results = createIngestionService(db).ingestBatch(getDemoFeedbacks());
  console.log(JSON.stringify(results.map(({ status, feedbackId }) => ({ status, feedbackId })), null, 2));
} finally { db.close(); }

const path = require('node:path');
const { openDatabase } = require('./db/database');
const { createSentimentService } = require('./services/sentiment');
const { createApp } = require('./app');

const database = openDatabase(process.env.DB_PATH || path.join(__dirname, '..', 'data', 'feedback.sqlite'));
const sentimentService = createSentimentService();
const app = createApp({ database, sentimentService });
const server = app.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => {
  process.stdout.write(`MVP de feedback disponível em http://127.0.0.1:${server.address().port}${String.fromCharCode(10)}`);
});

function close() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}
process.on('SIGINT', close);
process.on('SIGTERM', close);

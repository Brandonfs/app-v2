const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(process.cwd(), '.env'),
  quiet: true
});

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  qrSecret: process.env.QR_SECRET || process.env.JWT_SECRET || 'change-me-qr-secret',
  lateAfter: process.env.LATE_AFTER || '09:05',
  dbClient: process.env.DB_CLIENT || 'sqlite3',
  dbFilename: process.env.DB_FILENAME || path.join(process.cwd(), 'backend', 'data', 'app.db'),
  databaseUrl: process.env.DATABASE_URL || ''
};

module.exports = env;

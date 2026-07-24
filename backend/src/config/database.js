const fs = require('fs');
const path = require('path');
const knex = require('knex');
const env = require('./env');
const knexConfig = require('../../knexfile');

const targetEnv = env.nodeEnv === 'production' ? 'production' : 'development';
const config = { ...knexConfig[targetEnv] };

if (env.dbClient === 'pg' && env.databaseUrl) {
  config.client = 'pg';
  config.connection = {
    connectionString: env.databaseUrl,
    ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
  };
}

if (config.client === 'sqlite3') {
  const filename = env.dbFilename || path.join(process.cwd(), 'backend', 'data', 'app.db');
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  config.connection = { filename };
  config.useNullAsDefault = true;
}

const db = knex(config);

module.exports = db;

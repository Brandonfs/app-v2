const path = require('path');
const knex = require('knex');
const env = require('../config/env');
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
  config.connection = { filename: env.dbFilename };
  config.useNullAsDefault = true;
}

(async () => {
  const db = knex(config);
  try {
    await db.seed.run({
      directory: path.join(__dirname, 'seeds')
    });
    console.log('Seeds ejecutados correctamente.');
  } catch (error) {
    console.error('Error ejecutando seeds:', error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
})();

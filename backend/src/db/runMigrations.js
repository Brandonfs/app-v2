const path = require('path');
const knex = require('knex');
const env = require('../config/env');
const knexConfig = require('../../knexfile');

if (env.dbClient === 'pg' && !env.databaseUrl) {
  console.error('Configuracion invalida: DB_CLIENT=pg pero DATABASE_URL no esta definida.');
  process.exit(1);
}

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
    console.log(`Ejecutando migraciones con DB_CLIENT=${config.client}`);
    const [batchNo, log] = await db.migrate.latest({
      directory: path.join(__dirname, 'migrations')
    });
    console.log(`Migrations batch ${batchNo} ejecutado.`, log);
  } catch (error) {
    console.error('Error ejecutando migraciones:', error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
})();

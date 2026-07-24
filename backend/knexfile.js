const path = require('path');

const base = {
  migrations: {
    directory: path.join(__dirname, 'src/db/migrations')
  },
  seeds: {
    directory: path.join(__dirname, 'src/db/seeds')
  }
};

module.exports = {
  development: {
    ...base,
    client: 'sqlite3',
    connection: {
      filename: process.env.DB_FILENAME || path.join(__dirname, 'data', 'app.db')
    },
    useNullAsDefault: true
  },
  production: {
    ...base,
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'src/db/migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'src/db/seeds')
    }
  }
};

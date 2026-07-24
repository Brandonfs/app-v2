const app = require('./app');
const env = require('./config/env');
const db = require('./config/database');

const start = async () => {
  try {
    await db.raw('select 1+1 as result');
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();

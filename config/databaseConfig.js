const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'main-app-v1.0',
  password: 'root',
  port: '5432',
});

module.exports = pool;

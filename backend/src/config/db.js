const { Pool } = require('pg');

// Pool de conexões com o PostgreSQL. A string de conexão vem do .env.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 10,
});

module.exports = pool;

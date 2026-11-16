const { Pool } = require('pg');

/* Pool de conexões com o PostgreSQL - a string de conexão vem do .env */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 10,
});

/* Executa `fn(client)` dentro de uma transação (BEGIN/COMMIT, ROLLBACK em erro) */
async function comTransacao(fn) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resultado = await fn(client);

    await client.query('COMMIT');

    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');

    throw error;
  } finally {
    client.release();
  }
};

module.exports = pool;
module.exports.comTransacao = comTransacao;
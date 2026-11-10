// Executa os scripts SQL no banco indicado em DATABASE_URL.
// Uso: npm run db:setup   (schema + seed)   |   npm run db:schema   |   npm run db:seed
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const arquivos = { schema: ['schema.sql'], seed: ['seed.sql'], all: ['schema.sql', 'seed.sql'] };
const alvo = process.argv[2] || 'all';

(async () => {
  if (!arquivos[alvo]) {
    console.error('Use: schema, seed ou all');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('Defina DATABASE_URL no arquivo .env');
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    for (const nome of arquivos[alvo]) {
      const sql = fs.readFileSync(path.join(__dirname, '..', 'database', nome), 'utf8');
      await client.query(sql);
      console.log(`OK: ${nome}`);
    }
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error('Falha ao executar o script:', e.message);
  process.exit(1);
});

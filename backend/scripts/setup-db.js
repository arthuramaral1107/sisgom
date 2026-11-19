/* Executa os scripts SQL no banco indicado em DATABASE_URL */
// uso: npm run db:setup (schema + seed) | npm run db:schema | npm run db:seed
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

/* Arquivos SQL executados por cada alvo (schema, seed ou all) */
const arquivos = {
  schema: ['schema.sql'],
  seed: ['seed.sql'],
  all: [
    'schema.sql',
    'seed.sql'
  ]
};

/* Alvo do script - sem argumento executa schema e seed */
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
      const sql = fs.readFileSync(path.join(
        __dirname,
        '..',
        'database',
        nome
      ), 'utf8');

      await client.query(sql);

      console.log(`OK: ${nome}`);
    }
  } finally {
    await client.end();
  }
})().catch((error) => {
  console.error('Falha ao executar o script:', error.message);

  process.exit(1);
});
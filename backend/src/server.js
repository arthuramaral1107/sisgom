require('dotenv').config();

for (const variavel of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[variavel]) {
    console.error(`
      Variável de ambiente ausente: ${variavel}.
      Copie o .env.example para .env e preencha!
    `);

    process.exit(1);
  }
};

const app = require('./app');
const porta = process.env.PORT || 3333;

app.listen(porta, () => console.log(`SISGOM API rodando na porta ${porta}`));
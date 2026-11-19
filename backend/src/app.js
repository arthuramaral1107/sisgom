require('dotenv').config();

const cors = require('cors');
const helmet = require('helmet');
const rotas = require('./routes');
const express = require('express');
const { naoEncontrado, tratarErros } = require('./middlewares/erros');

/* Aplicação Express - segurança, CORS, JSON, rotas e tratamento de erros */
const app = express();

app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean) }));
app.use(express.json());
app.use('/api', rotas);
app.use(naoEncontrado);
app.use(tratarErros);

module.exports = app;
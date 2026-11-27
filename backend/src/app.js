require('dotenv').config();

const cors = require('cors');
const helmet = require('helmet');
const rotas = require('./routes');
const express = require('express');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const especificacao = require('./docs/openapi');
const { naoEncontrado, tratarErros } = require('./middlewares/erros');

/* Limita as requisições por IP em toda a API (proteção contra abuso) */
const limitarApi = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.API_LIMITE) || 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        erro: 'Muitas requisições. Tente novamente em alguns minutos!'
    }
});

/* Aplicação Express - segurança, CORS, JSON, rotas e tratamento de erros */
const app = express();

/* Atrás do proxy do Render, usa o IP real do cliente (limite de login) */
app.set('trust proxy', 1);

/* A documentação vem antes do helmet (o CSP padrão bloqueia os scripts do Swagger) */
app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(
        especificacao,
        { customSiteTitle: 'SISGOM - API' }
    )
);

app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean) }));
app.use(express.json());
app.use('/api', limitarApi, rotas);
app.use(naoEncontrado);
app.use(tratarErros);

module.exports = app;
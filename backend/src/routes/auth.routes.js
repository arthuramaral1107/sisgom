const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { autenticar } = require('../middlewares/auth');
const ctrl = require('../controllers/auth.controller');
const { asyncHandler } = require('../middlewares/erros');

/* Limita as tentativas de login por IP (proteção contra força bruta) */
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_LIMITE) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    erro: 'Muitas tentativas de login. Tente novamente em alguns minutos!'
  }
});

router.post('/login', limitarLogin, asyncHandler(ctrl.login));
router.get('/me', autenticar, asyncHandler(ctrl.me));

module.exports = router;
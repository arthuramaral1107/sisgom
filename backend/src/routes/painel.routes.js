const router = require('express').Router();
const { autenticar } = require('../middlewares/auth');
const ctrl = require('../controllers/painel.controller');
const { asyncHandler } = require('../middlewares/erros');

router.use(autenticar);

/* Todos os perfis veem o painel - o financeiro é filtrado no controller */
router.get('/', asyncHandler(ctrl.resumo));

module.exports = router;
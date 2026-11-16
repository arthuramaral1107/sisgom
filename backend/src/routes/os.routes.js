const router = require('express').Router();
const { autenticar, autorizar } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/erros');
const ctrl = require('../controllers/os.controller');

router.use(autenticar);

// Todos os perfis podem consultar
router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', asyncHandler(ctrl.buscar));

// Abrir a OS: administrador e atendente
router.post('/', autorizar('ADMIN', 'ATENDENTE'), asyncHandler(ctrl.criar));

module.exports = router;
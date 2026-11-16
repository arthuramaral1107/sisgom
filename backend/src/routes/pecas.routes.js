const router = require('express').Router();
const { asyncHandler } = require('../middlewares/erros');
const ctrl = require('../controllers/pecas.controller');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);

/* Todos os perfis podem consultar */
router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', asyncHandler(ctrl.buscar));

/* Administrador e atendente podem cadastrar e editar */
router.post('/', autorizar('ADMIN', 'ATENDENTE'), asyncHandler(ctrl.criar));
router.put('/:id', autorizar('ADMIN', 'ATENDENTE'), asyncHandler(ctrl.atualizar));

/* Só o administrador exclui */
router.delete('/:id', autorizar('ADMIN'), asyncHandler(ctrl.excluir));

module.exports = router;
const router = require('express').Router();
const ctrl = require('../controllers/os.controller');
const { asyncHandler } = require('../middlewares/erros');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);

/* Todos os perfis podem consultar */
router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', asyncHandler(ctrl.buscar));

/* Abrir a OS: administrador e atendente */
router.post('/', autorizar('ADMIN', 'ATENDENTE'), asyncHandler(ctrl.criar));
router.put('/:id', autorizar('ADMIN', 'ATENDENTE'), asyncHandler(ctrl.atualizar));

/* Só o administrador exclui */
router.delete('/:id', autorizar('ADMIN'), asyncHandler(ctrl.excluir));

/* Itens da OS: todos os perfis (o mecânico executa a OS) */
const todos = autorizar('ADMIN', 'ATENDENTE', 'MECANICO');

router.post('/:id/servicos', todos, asyncHandler(ctrl.adicionarServico));
router.delete('/:id/servicos/:itemId', todos, asyncHandler(ctrl.removerServico));
router.post('/:id/pecas', todos, asyncHandler(ctrl.adicionarPeca));
router.delete('/:id/pecas/:itemId', todos, asyncHandler(ctrl.removerPeca));

/* Andamento da OS: todos os perfis - o cancelamento é validado no controller */
router.patch('/:id/status', todos, asyncHandler(ctrl.mudarStatus));

/* Pagamentos: administrador e atendente registram, só o administrador estorna */
router.post('/:id/pagamentos', autorizar('ADMIN', 'ATENDENTE'), asyncHandler(ctrl.adicionarPagamento));
router.delete('/:id/pagamentos/:pagamentoId', autorizar('ADMIN'), asyncHandler(ctrl.removerPagamento));

module.exports = router;
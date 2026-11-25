const pool = require('../config/db');
const router = require('express').Router();
const { asyncHandler } = require('../middlewares/erros');
const ctrl = require('../controllers/usuarios.controller');
const { autenticar, autorizar } = require('../middlewares/auth');

router.use(autenticar);

/* Lista de mecânicos ativos (usada para escolher o responsável pela OS) - todos os perfis */
router.get('/mecanicos', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      id,
      nome
    FROM usuario
    WHERE perfil = 'MECANICO' AND ativo
    ORDER BY nome
  `);

  res.json(rows);
}));

/* Daqui para baixo o gerenciamento de usuários é só do administrador */
router.use(autorizar('ADMIN'));

router.get('/', asyncHandler(ctrl.listar));
router.get('/:id', asyncHandler(ctrl.buscar));
router.post('/', asyncHandler(ctrl.criar));
router.put('/:id', asyncHandler(ctrl.atualizar));
router.patch('/:id/ativo', asyncHandler(ctrl.alterarAtivo));

module.exports = router;
const pool = require('../config/db');
const router = require('express').Router();
const { autenticar } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/erros');

router.use(autenticar);

/* Lista de mecânicos ativos (usada para escolher o responsável pela OS) */
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

module.exports = router;
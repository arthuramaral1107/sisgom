const router = require('express').Router();
const pool = require('../config/db');
const { asyncHandler } = require('../middlewares/erros');

// Verificação simples para saber se a API e o banco estão no ar.
router.get('/saude', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', banco: 'ok' });
}));

router.use('/auth', require('./auth.routes'));
router.use('/clientes', require('./clientes.routes'));
router.use('/veiculos', require('./veiculos.routes'));
router.use('/servicos', require('./servicos.routes'));
router.use('/pecas', require('./pecas.routes'));
router.use('/os', require('./os.routes'));
router.use('/usuarios', require('./usuarios.routes'));

module.exports = router;

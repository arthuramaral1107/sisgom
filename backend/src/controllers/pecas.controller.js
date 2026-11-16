const pool = require('../config/db');
const { ErroHttp } = require('../middlewares/erros');
const { validarPeca, idDaRota } = require('../utils/validacao');

const COLUNAS = `
  id,
  codigo,
  descricao,
  preco_venda::float8 AS preco_venda,
  quantidade_estoque,
  estoque_minimo,
  (quantidade_estoque <= estoque_minimo) AS estoque_baixo
`;

/* GET /api/pecas?busca=&baixo=1&pagina=&limite= */
async function listar(req, res) {
  const busca = String(req.query.busca ?? '').trim();
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);

  const condicoes = [];
  const params = [];

  if (busca) {
    params.push(`%${busca}%`);

    condicoes.push(`(
      codigo ILIKE $${params.length} OR
      descricao ILIKE $${params.length}
    )`);
  }

  if (req.query.baixo === '1') condicoes.push('quantidade_estoque <= estoque_minimo');

  const filtro = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  const total = (await pool.query(`
    SELECT COUNT(*)::int AS n FROM peca ${filtro}
  `, params)).rows[0].n;

  const { rows } = await pool.query(`
    SELECT ${COLUNAS}
    FROM peca ${filtro}
    ORDER BY descricao LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `, [
    ...params,
    limite,
    (pagina - 1) * limite
  ]);

  res.json({ dados: rows, total, pagina, limite });
};

/* GET /api/pecas/:id */
async function buscar(req, res) {
  const { rows } = await pool.query(`
    SELECT ${COLUNAS}
    FROM peca
    WHERE id = $1
  `, [idDaRota(req)]);

  if (!rows[0]) throw new ErroHttp(404, 'Peça não encontrada');

  res.json(rows[0]);
};

/* POST /api/pecas */
async function criar(req, res) {
  const d = validarPeca(req.body);

  const { rows } = await pool.query(`
    INSERT INTO peca (
      codigo,
      descricao,
      preco_venda,
      quantidade_estoque,
      estoque_minimo
    ) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUNAS}
  `, [
    d.codigo,
    d.descricao,
    d.preco_venda,
    d.quantidade_estoque,
    d.estoque_minimo
  ]);

  res.status(201).json(rows[0]);
};

/* PUT /api/pecas/:id (também serve para ajustar o estoque manualmente) */
async function atualizar(req, res) {
  const d = validarPeca(req.body);

  const { rows } = await pool.query(`
    UPDATE peca
    SET
      codigo = $1,
      descricao = $2,
      preco_venda = $3,
      quantidade_estoque = $4,
      estoque_minimo = $5
    WHERE id = $6 RETURNING ${COLUNAS}
  `, [
    d.codigo,
    d.descricao,
    d.preco_venda,
    d.quantidade_estoque,
    d.estoque_minimo,
    idDaRota(req)
  ]);

  if (!rows[0]) throw new ErroHttp(404, 'Peça não encontrada');

  res.json(rows[0]);
};

/* DELETE /api/pecas/:id */
async function excluir(req, res) {
  try {
    const { rowCount } = await pool.query(`
      DELETE FROM peca
      WHERE id = $1
    `, [idDaRota(req)]);

    if (!rowCount) throw new ErroHttp(404, 'Peça não encontrada');

    res.status(204).end();
  } catch (error) {
    if (error.code === '23503' || error.code === '23001') {
      throw new ErroHttp(
        409,
        'Não é possível excluir: a peça já foi usada em ordens de serviço'
      );
    }

    throw error;
  }
};

module.exports = {
  listar,
  buscar,
  criar,
  atualizar,
  excluir
};
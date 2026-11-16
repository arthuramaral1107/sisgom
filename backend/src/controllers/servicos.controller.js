const pool = require('../config/db');
const { ErroHttp } = require('../middlewares/erros');
const { validarServico, idDaRota } = require('../utils/validacao');

const COLUNAS = 'id, descricao, valor_padrao::float8 AS valor_padrao';

// GET /api/servicos?busca=&pagina=&limite=
async function listar(req, res) {
  const busca = String(req.query.busca ?? '').trim();
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);

  const filtro = busca ? 'WHERE descricao ILIKE $1' : '';
  const params = busca ? [`%${busca}%`] : [];

  const total = (await pool.query(`SELECT COUNT(*)::int AS n FROM servico ${filtro}`, params)).rows[0].n;
  const { rows } = await pool.query(
    `SELECT ${COLUNAS} FROM servico ${filtro} ORDER BY descricao LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limite, (pagina - 1) * limite],
  );
  res.json({ dados: rows, total, pagina, limite });
}

// GET /api/servicos/:id
async function buscar(req, res) {
  const { rows } = await pool.query(`SELECT ${COLUNAS} FROM servico WHERE id = $1`, [idDaRota(req)]);
  if (!rows[0]) throw new ErroHttp(404, 'Serviço não encontrado');
  res.json(rows[0]);
}

// POST /api/servicos
async function criar(req, res) {
  const d = validarServico(req.body);
  const { rows } = await pool.query(
    `INSERT INTO servico (descricao, valor_padrao) VALUES ($1, $2) RETURNING ${COLUNAS}`,
    [d.descricao, d.valor_padrao],
  );
  res.status(201).json(rows[0]);
}

// PUT /api/servicos/:id
async function atualizar(req, res) {
  const d = validarServico(req.body);
  const { rows } = await pool.query(
    `UPDATE servico SET descricao = $1, valor_padrao = $2 WHERE id = $3 RETURNING ${COLUNAS}`,
    [d.descricao, d.valor_padrao, idDaRota(req)],
  );
  if (!rows[0]) throw new ErroHttp(404, 'Serviço não encontrado');
  res.json(rows[0]);
}

// DELETE /api/servicos/:id
async function excluir(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM servico WHERE id = $1', [idDaRota(req)]);
    if (!rowCount) throw new ErroHttp(404, 'Serviço não encontrado');
    res.status(204).end();
  } catch (err) {
    if (err.code === '23503' || err.code === '23001') {
      throw new ErroHttp(409, 'Não é possível excluir: o serviço já foi usado em ordens de serviço');
    }
    throw err;
  }
}

module.exports = { listar, buscar, criar, atualizar, excluir };
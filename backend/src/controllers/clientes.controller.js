const pool = require('../config/db');
const { ErroHttp } = require('../middlewares/erros');
const { validarCliente, idDaRota } = require('../utils/validacao');

/* Colunas retornadas nas consultas de clientes */
const COLUNAS = `
  id,
  nome,
  cpf_cnpj,
  telefone,
  email,
  endereco,
  criado_em
`;

/* GET /api/clientes?busca=&pagina=&limite= */
async function listar(req, res) {
  const busca = String(req.query.busca ?? '').trim();
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);

  const filtro = busca ? `
    WHERE nome ILIKE $1
      OR cpf_cnpj ILIKE $1
      OR telefone ILIKE $1
  ` : '';

  const params = busca ? [`%${busca}%`] : [];

  const total = (await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM cliente ${filtro}
  `, params)).rows[0].n;

  const { rows } = await pool.query(`
    SELECT ${COLUNAS}
    FROM cliente ${filtro}
    ORDER BY nome LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `, [
    ...params,
    limite,
    (pagina - 1) * limite
  ]);

  res.json({ dados: rows, total, pagina, limite });
};

/* GET /api/clientes/:id */
async function buscar(req, res) {
  const { rows } = await pool.query(`
    SELECT ${COLUNAS}
    FROM cliente
    WHERE id = $1
  `, [idDaRota(req)]);

  if (!rows[0]) throw new ErroHttp(404, 'Cliente não encontrado');

  res.json(rows[0]);
};

/* POST /api/clientes */
async function criar(req, res) {
  const d = validarCliente(req.body);

  const { rows } = await pool.query(`
    INSERT INTO cliente (
      nome,
      cpf_cnpj,
      telefone,
      email,
      endereco
    ) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUNAS}
  `, [
    d.nome,
    d.cpf_cnpj,
    d.telefone,
    d.email,
    d.endereco
  ]);

  res.status(201).json(rows[0]);
};

/* PUT /api/clientes/:id */
async function atualizar(req, res) {
  const id = idDaRota(req);
  const d = validarCliente(req.body);

  const { rows } = await pool.query(`
    UPDATE cliente
    SET
      nome = $1,
      cpf_cnpj = $2,
      telefone = $3,
      email = $4,
      endereco = $5
    WHERE id = $6 RETURNING ${COLUNAS}
  `, [
    d.nome,
    d.cpf_cnpj,
    d.telefone,
    d.email,
    d.endereco,
    id
  ]);

  if (!rows[0]) throw new ErroHttp(404, 'Cliente não encontrado');

  res.json(rows[0]);
};

/* DELETE /api/clientes/:id */
async function excluir(req, res) {
  try {
    const { rowCount } = await pool.query(`
      DELETE FROM cliente
      WHERE id = $1
    `, [idDaRota(req)]);

    if (!rowCount) throw new ErroHttp(404, 'Cliente não encontrado');

    res.status(204).end();
  } catch (error) {
    if (error.code === '23503' || error.code === '23001') {
      throw new ErroHttp(
        409,
        'Não é possível excluir: o cliente possui veículos cadastrados'
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
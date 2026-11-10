const pool = require('../config/db');
const { ErroHttp } = require('../middlewares/erros');
const { validarVeiculo, idDaRota } = require('../utils/validacao');

const SELECT = `SELECT v.id, v.cliente_id, c.nome AS cliente_nome, v.placa, v.marca, v.modelo,
                       v.ano, v.cor, v.km_atual, v.criado_em
                FROM veiculo v JOIN cliente c ON c.id = v.cliente_id`;

async function garantirCliente(clienteId) {
  const { rowCount } = await pool.query('SELECT 1 FROM cliente WHERE id = $1', [clienteId]);
  if (!rowCount) {
    throw new ErroHttp(400, 'Dados inválidos', [{ campo: 'cliente_id', mensagem: 'Cliente não encontrado' }]);
  }
}

// GET /api/veiculos?cliente_id=&busca=&pagina=&limite=
async function listar(req, res) {
  const busca = String(req.query.busca ?? '').trim();
  const clienteId = parseInt(req.query.cliente_id, 10);
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);

  const condicoes = [];
  const params = [];
  if (clienteId > 0) {
    params.push(clienteId);
    condicoes.push(`v.cliente_id = $${params.length}`);
  }
  if (busca) {
    params.push(`%${busca}%`);
    condicoes.push(`(v.placa ILIKE $${params.length} OR v.modelo ILIKE $${params.length} OR v.marca ILIKE $${params.length} OR c.nome ILIKE $${params.length})`);
  }
  const filtro = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  const total = (await pool.query(
    `SELECT COUNT(*)::int AS n FROM veiculo v JOIN cliente c ON c.id = v.cliente_id ${filtro}`, params,
  )).rows[0].n;
  const { rows } = await pool.query(
    `${SELECT} ${filtro} ORDER BY v.placa LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limite, (pagina - 1) * limite],
  );
  res.json({ dados: rows, total, pagina, limite });
}

// GET /api/veiculos/:id
async function buscar(req, res) {
  const { rows } = await pool.query(`${SELECT} WHERE v.id = $1`, [idDaRota(req)]);
  if (!rows[0]) throw new ErroHttp(404, 'Veículo não encontrado');
  res.json(rows[0]);
}

// POST /api/veiculos
async function criar(req, res) {
  const d = validarVeiculo(req.body);
  await garantirCliente(d.cliente_id);
  const { rows } = await pool.query(
    `INSERT INTO veiculo (cliente_id, placa, marca, modelo, ano, cor, km_atual)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [d.cliente_id, d.placa, d.marca, d.modelo, d.ano, d.cor, d.km_atual],
  );
  const criado = await pool.query(`${SELECT} WHERE v.id = $1`, [rows[0].id]);
  res.status(201).json(criado.rows[0]);
}

// PUT /api/veiculos/:id
async function atualizar(req, res) {
  const id = idDaRota(req);
  const d = validarVeiculo(req.body);
  await garantirCliente(d.cliente_id);
  const { rowCount } = await pool.query(
    `UPDATE veiculo SET cliente_id = $1, placa = $2, marca = $3, modelo = $4, ano = $5, cor = $6, km_atual = $7
     WHERE id = $8`,
    [d.cliente_id, d.placa, d.marca, d.modelo, d.ano, d.cor, d.km_atual, id],
  );
  if (!rowCount) throw new ErroHttp(404, 'Veículo não encontrado');
  const atualizado = await pool.query(`${SELECT} WHERE v.id = $1`, [id]);
  res.json(atualizado.rows[0]);
}

// DELETE /api/veiculos/:id
async function excluir(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM veiculo WHERE id = $1', [idDaRota(req)]);
    if (!rowCount) throw new ErroHttp(404, 'Veículo não encontrado');
    res.status(204).end();
  } catch (err) {
    if (err.code === '23503' || err.code === '23001') {
      throw new ErroHttp(409, 'Não é possível excluir: o veículo possui ordens de serviço');
    }
    throw err;
  }
}

module.exports = { listar, buscar, criar, atualizar, excluir };

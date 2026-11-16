const pool = require('../config/db');
const { comTransacao } = require('../config/db');
const { ErroHttp } = require('../middlewares/erros');
const { validarOS, STATUS_OS, idDaRota } = require('../utils/validacao');

const CABECALHO = `
  SELECT
    os.id,
    os.status,
    os.data_abertura,
    os.data_fechamento,
    os.defeito_relatado,
    os.valor_total::float8 AS valor_total,
    v.id AS veiculo_id, v.placa, v.marca, v.modelo,
    c.id AS cliente_id, c.nome AS cliente_nome,
    os.atendente_id, a.nome AS atendente_nome,
    os.mecanico_id, m.nome AS mecanico_nome
  FROM ordem_servico os
  JOIN veiculo v ON v.id = os.veiculo_id
  JOIN cliente c ON c.id = v.cliente_id
  JOIN usuario a ON a.id = os.atendente_id
  LEFT JOIN usuario m ON m.id = os.mecanico_id
`;

/* Monta a OS completa - `db` pode ser o pool ou um client de transação */
async function carregarOS(db, id) {
  const { rows } = await db.query(`
    ${CABECALHO}
    WHERE os.id = $1
  `, [id]);

  if (!rows[0]) throw new ErroHttp(404, 'Ordem de serviço não encontrada');

  const servicos = await db.query(`
    SELECT
      i.id,
      i.servico_id,
      s.descricao,
      i.quantidade,
      i.valor_unitario::float8 AS valor_unitario,
      (i.quantidade * i.valor_unitario)::float8 AS subtotal
    FROM os_servico i
    JOIN servico s ON s.id = i.servico_id
    WHERE i.os_id = $1
    ORDER BY i.id
  `, [id]);

  const pecas = await db.query(`
    SELECT
      i.id,
      i.peca_id,
      p.codigo,
      p.descricao,
      i.quantidade,
      i.valor_unitario::float8 AS valor_unitario,
      (i.quantidade * i.valor_unitario)::float8 AS subtotal,
      p.quantidade_estoque
    FROM os_peca i
    JOIN peca p ON p.id = i.peca_id
    WHERE i.os_id = $1
    ORDER BY i.id
  `, [id]);

  return {
    ...rows[0],
    servicos: servicos.rows,
    pecas: pecas.rows
  };
};

/* Confere se o mecânico informado existe - é do perfil MECANICO e está ativo */
async function validarMecanico(client, mecanicoId) {
  if (!mecanicoId) return;

  const { rows } = await client.query(`
    SELECT 1
    FROM usuario
    WHERE id = $1 AND perfil = 'MECANICO' AND ativo
  `, [mecanicoId]);

  if (!rows[0]) {
    throw new ErroHttp(
      400,
      'Dados inválidos',
      [{
        campo: 'mecanico_id',
        mensagem: 'Mecânico não encontrado'
      }]
    );
  }
};

/* GET /api/os?status=&busca=&pagina=&limite= */
async function listar(req, res) {
  const busca = String(req.query.busca ?? '').trim();
  const status = String(req.query.status ?? '').trim();
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);

  const condicoes = [];
  const params = [];

  if (status) {
    if (!STATUS_OS.includes(status)) throw new ErroHttp(400, 'Status inválido');

    params.push(status);

    condicoes.push(`os.status = $${params.length}`);
  }

  if (busca) {
    params.push(`%${busca}%`);

    const n = `$${params.length}`;

    condicoes.push(`(
      v.placa ILIKE ${n} OR
      c.nome ILIKE ${n} OR
      os.id::text ILIKE ${n}
    )`);
  }

  const filtro = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  const juncoes = `
    FROM ordem_servico os
    JOIN veiculo v ON v.id = os.veiculo_id
    JOIN cliente c ON c.id = v.cliente_id
  `;

  const total = (await pool.query(`
    SELECT COUNT(*)::int AS n ${juncoes} ${filtro}
  `, params)).rows[0].n;

  const { rows } = await pool.query(`
    SELECT
      os.id,
      os.status,
      os.data_abertura,
      os.valor_total::float8 AS valor_total,
      os.defeito_relatado,
      v.placa,
      v.marca,
      v.modelo,
      c.nome AS cliente_nome
      ${juncoes} ${filtro}
    ORDER BY os.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `, [
    ...params,
    limite,
    (pagina - 1) * limite
  ]);

  res.json({ dados: rows, total, pagina, limite });
};

/* GET /api/os/:id */
async function buscar(req, res) {
  res.json(await carregarOS(pool, idDaRota(req)));
};

/* POST /api/os */
async function criar(req, res) {
  const d = validarOS(req.body);

  const id = await comTransacao(async (client) => {
    const veiculo = await client.query(`
      SELECT 1
      FROM veiculo
      WHERE id = $1
    `, [d.veiculo_id]);

    if (!veiculo.rows[0]) {
      throw new ErroHttp(
        400,
        'Dados inválidos',
        [{
          campo: 'veiculo_id',
          mensagem: 'Veículo não encontrado'
        }]
      );
    }

    await validarMecanico(client, d.mecanico_id);

    const { rows } = await client.query(`
      INSERT INTO ordem_servico (
        veiculo_id,
        atendente_id,
        mecanico_id,
        defeito_relatado
      ) VALUES ($1, $2, $3, $4) RETURNING id
    `, [
      d.veiculo_id,
      req.usuario.id,
      d.mecanico_id,
      d.defeito_relatado
    ]);

    return rows[0].id;
  });

  res.status(201).json(await carregarOS(pool, id));
};

module.exports = {
  listar,
  buscar,
  criar
};
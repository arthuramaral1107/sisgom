const {
  validarOS,
  validarItemServico,
  validarItemPeca,
  STATUS_OS,
  idDaRota,
  idParam
} = require('../utils/validacao');
const pool = require('../config/db');
const { comTransacao } = require('../config/db');
const { ErroHttp } = require('../middlewares/erros');

/* Consulta base da OS - traz veículo, cliente, atendente e mecânico */
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

/* Status em que a OS ainda pode ser alterada */
const EDITAVEIS = [
  'aberta',
  'em_andamento'
];

/* Transições de status permitidas - a finalização tem regras próprias */
const TRANSICOES = {
  aberta: [
    'em_andamento',
    'cancelada'
  ],
  em_andamento: [
    'finalizada',
    'cancelada'
  ],
  finalizada: [],
  cancelada: []
};

/* Trava a linha da OS durante a transação - evita duas alterações simultâneas */
async function travarOS(client, id) {
  const { rows } = await client.query(`
    SELECT
      id,
      status,
      mecanico_id
    FROM ordem_servico
    WHERE id = $1
    FOR UPDATE
  `, [id]);

  if (!rows[0]) throw new ErroHttp(404, 'Ordem de serviço não encontrada');

  return rows[0];
};

/* Bloqueia alterações em OS finalizada ou cancelada */
function exigirEditavel(os) {
  if (!EDITAVEIS.includes(os.status)) {
    throw new ErroHttp(
      409,
      `Ordem de serviço ${os.status === 'finalizada' ? 'finalizada' : 'cancelada'} não pode ser alterada`
    );
  }
};

/* Recalcula o valor total da OS a partir dos serviços e das peças */
async function recalcularTotal(client, osId) {
  await client.query(`
    UPDATE ordem_servico
    SET valor_total =
      COALESCE((
        SELECT SUM(quantidade * valor_unitario)
        FROM os_servico
        WHERE os_id = $1
      ), 0) + COALESCE((
        SELECT SUM(quantidade * valor_unitario)
        FROM os_peca
        WHERE os_id = $1
      ), 0)
    WHERE id = $1
  `, [osId]);
};

/* GET /api/os?status=&busca=&pagina=&limite= */
async function listar(req, res) {
  const busca = String(req.query.busca ?? '').trim();
  const status = String(req.query.status ?? '').trim();
  const veiculoId = parseInt(req.query.veiculo_id, 10);
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);

  const condicoes = [];
  const params = [];

  if (status) {
    if (!STATUS_OS.includes(status)) throw new ErroHttp(400, 'Status inválido');

    params.push(status);

    condicoes.push(`os.status = $${params.length}`);

    if (veiculoId) {
      params.push(veiculoId);

      condicoes.push(`os.veiculo_id = $${params.length}`);
    }
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
    SELECT COUNT(*)::int AS n ${juncoes}
    ${filtro}
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

/* PUT /api/os/:id - defeito relatado e mecânico responsável */
async function atualizar(req, res) {
  const id = idDaRota(req);
  const d = validarOS(req.body, { exigeVeiculo: false });

  await comTransacao(async (client) => {
    exigirEditavel(await travarOS(client, id));

    await validarMecanico(client, d.mecanico_id);

    await client.query(`
      UPDATE ordem_servico
      SET
        defeito_relatado = $1,
        mecanico_id = $2
      WHERE id = $3
    `, [
      d.defeito_relatado,
      d.mecanico_id,
      id
    ]);
  });

  res.json(await carregarOS(pool, id));
};

/* DELETE /api/os/:id - apenas OS aberta ou cancelada */
async function excluir(req, res) {
  const id = idDaRota(req);

  await comTransacao(async (client) => {
    const os = await travarOS(client, id);

    if (!['aberta', 'cancelada'].includes(os.status)) {
      throw new ErroHttp(
        409,
        'Só é possível excluir ordens abertas ou canceladas'
      );
    }

    await client.query(`
      DELETE FROM ordem_servico
      WHERE id = $1
    `, [id]);
  });

  res.status(204).end();
};

/* POST /api/os/:id/servicos */
async function adicionarServico(req, res) {
  const id = idDaRota(req);
  const d = validarItemServico(req.body);

  await comTransacao(async (client) => {
    exigirEditavel(await travarOS(client, id));

    const servico = await client.query(`
      SELECT valor_padrao
      FROM servico
      WHERE id = $1
    `, [d.servico_id]);

    if (!servico.rows[0]) {
      throw new ErroHttp(
        400,
        'Dados inválidos',
        [{
          campo: 'servico_id',
          mensagem: 'Serviço não encontrado'
        }]
      );
    }

    // sem valor informado, usa o valor padrão do catálogo
    const valor = d.valor_unitario ?? servico.rows[0].valor_padrao;

    await client.query(`
      INSERT INTO os_servico (
        os_id,
        servico_id,
        quantidade,
        valor_unitario
      ) VALUES ($1, $2, $3, $4)
    `, [
      id,
      d.servico_id,
      d.quantidade,
      valor
    ]);

    await recalcularTotal(client, id);
  });

  res.status(201).json(await carregarOS(pool, id));
};

/* DELETE /api/os/:id/servicos/:itemId */
async function removerServico(req, res) {
  const id = idDaRota(req);
  const itemId = idParam(req, 'itemId');

  await comTransacao(async (client) => {
    exigirEditavel(await travarOS(client, id));

    const { rowCount } = await client.query(`
      DELETE FROM os_servico
      WHERE id = $1 AND os_id = $2
    `, [itemId, id]);

    if (!rowCount) throw new ErroHttp(404, 'Serviço não encontrado nesta OS');

    await recalcularTotal(client, id);
  });

  res.json(await carregarOS(pool, id));
};

/* POST /api/os/:id/pecas - grava o preço de venda atual da peça no item */
async function adicionarPeca(req, res) {
  const id = idDaRota(req);
  const d = validarItemPeca(req.body);

  await comTransacao(async (client) => {
    exigirEditavel(await travarOS(client, id));

    const peca = await client.query(`
      SELECT preco_venda
      FROM peca
      WHERE id = $1
    `, [d.peca_id]);

    if (!peca.rows[0]) {
      throw new ErroHttp(
        400,
        'Dados inválidos',
        [{
          campo: 'peca_id',
          mensagem: 'Peça não encontrada'
        }]
      );
    }

    await client.query(`
      INSERT INTO os_peca (
        os_id,
        peca_id,
        quantidade,
        valor_unitario
      ) VALUES ($1, $2, $3, $4)
    `, [
      id,
      d.peca_id,
      d.quantidade,
      peca.rows[0].preco_venda
    ]);

    await recalcularTotal(client, id);
  });

  res.status(201).json(await carregarOS(pool, id));
};

/* DELETE /api/os/:id/pecas/:itemId */
async function removerPeca(req, res) {
  const id = idDaRota(req);
  const itemId = idParam(req, 'itemId');

  await comTransacao(async (client) => {
    exigirEditavel(await travarOS(client, id));

    const { rowCount } = await client.query(`
      DELETE FROM os_peca
      WHERE id = $1 AND os_id = $2
    `, [itemId, id]);

    if (!rowCount) throw new ErroHttp(404, 'Peça não encontrada nesta OS');

    await recalcularTotal(client, id);
  });

  res.json(await carregarOS(pool, id));
};

/* Dá baixa no estoque das peças da OS - se faltar alguma, cancela tudo (409) */
async function baixarEstoque(client, osId) {
  const { rows: itens } = await client.query(`
    SELECT
      peca_id,
      SUM(quantidade)::int AS qtd
    FROM os_peca
    WHERE os_id = $1
    GROUP BY peca_id
    ORDER BY peca_id
  `, [osId]);

  if (!itens.length) return;

  // FOR UPDATE: ninguém altera o estoque dessas peças até o fim da transação
  const { rows: estoque } = await client.query(`
    SELECT
      id,
      codigo,
      descricao,
      quantidade_estoque
    FROM peca
    WHERE id = ANY($1)
    ORDER BY id
    FOR UPDATE
  `, [itens.map((item) => item.peca_id)]);

  const porId = new Map(estoque.map((peca) => [peca.id, peca]));
  const faltas = [];

  for (const item of itens) {
    const peca = porId.get(item.peca_id);

    if (peca.quantidade_estoque < item.qtd) {
      faltas.push({
        campo: 'peca',
        mensagem: `${peca.codigo} - ${peca.descricao}: estoque ${peca.quantidade_estoque}, necessário ${item.qtd}`
      });
    }
  }

  if (faltas.length) {
    throw new ErroHttp(
      409,
      'Estoque insuficiente para finalizar a OS',
      faltas
    );
  }

  for (const item of itens) {
    await client.query(`
      UPDATE peca
      SET quantidade_estoque = quantidade_estoque - $1
      WHERE id = $2
    `, [
      item.qtd,
      item.peca_id
    ]);
  }
};

/* PATCH /api/os/:id/status - { "status": "em_andamento" | "finalizada" | "cancelada" } */
async function mudarStatus(req, res) {
  const id = idDaRota(req);
  const novo = String(req.body?.status ?? '');

  if (!STATUS_OS.includes(novo)) {
    throw new ErroHttp(
      400,
      'Dados inválidos',
      [{
        campo: 'status',
        mensagem: 'Status inválido'
      }]
    );
  }

  if (novo === 'cancelada' && req.usuario.perfil === 'MECANICO') {
    throw new ErroHttp(403, 'Sem permissão para cancelar ordens de serviço');
  }

  await comTransacao(async (client) => {
    const os = await travarOS(client, id);

    if (!TRANSICOES[os.status].includes(novo)) {
      throw new ErroHttp(
        409,
        `Transição inválida: de "${os.status}" para "${novo}"`
      );
    }

    // mecânico que inicia uma OS sem responsável assume ela
    if (novo === 'em_andamento' && !os.mecanico_id && req.usuario.perfil === 'MECANICO') {
      await client.query(`
        UPDATE ordem_servico
        SET mecanico_id = $1
        WHERE id = $2
      `, [req.usuario.id, id]);
    }

    if (novo === 'finalizada') {
      const itens = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM os_servico WHERE os_id = $1) +
          (SELECT COUNT(*) FROM os_peca WHERE os_id = $1) AS n
      `, [id]);

      if (Number(itens.rows[0].n) === 0) {
        throw new ErroHttp(
          409,
          'Adicione ao menos um serviço ou peça antes de finalizar a OS'
        );
      }

      await baixarEstoque(client, id);
      await recalcularTotal(client, id);

      await client.query(`
        UPDATE ordem_servico
        SET data_fechamento = NOW()
        WHERE id = $1
      `, [id]);
    }

    await client.query(`
      UPDATE ordem_servico
      SET status = $1
      WHERE id = $2
    `, [novo, id]);
  });

  res.json(await carregarOS(pool, id));
};

module.exports = {
  listar,
  buscar,
  criar,
  atualizar,
  excluir,
  adicionarServico,
  removerServico,
  adicionarPeca,
  removerPeca,
  mudarStatus
};
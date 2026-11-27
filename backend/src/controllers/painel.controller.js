const pool = require('../config/db');

/* Fuso usado para definir o início do mês atual */
const FUSO = 'America/Sao_Paulo';

/* Perfis que enxergam os valores financeiros */
const PERFIS_FINANCEIRO = [
    'ADMIN',
    'ATENDENTE'
];

/* Arredonda em centavos - o banco devolve a soma como número de ponto flutuante */
const centavos = (valor) => Math.round(valor * 100) / 100;

/* Conta as OS por status - todos os status aparecem, mesmo sem nenhuma OS */
async function contarPorStatus() {
    const { rows } = await pool.query(`
        SELECT
            status,
            COUNT(*)::int AS total
        FROM ordem_servico
        GROUP BY status
    `);

    const contagem = {
        aberta: 0,
        em_andamento: 0,
        finalizada: 0,
        cancelada: 0
    };

    rows.forEach((linha) => { contagem[linha.status] = linha.total; });

    return contagem;
};

/* Peças com estoque no mínimo ou abaixo - total e as 5 mais críticas */
async function pecasComEstoqueBaixo() {
    const { rows } = await pool.query(`
        SELECT
            id,
            codigo,
            descricao,
            quantidade_estoque,
            estoque_minimo
        FROM peca
        WHERE quantidade_estoque <= estoque_minimo
        ORDER BY
            quantidade_estoque,
            descricao
        LIMIT 5
    `);

    const { rows: total } = await pool.query(`
        SELECT COUNT(*)::int AS n
        FROM peca
        WHERE quantidade_estoque <= estoque_minimo
    `);

    return {
        total: total[0].n,
        itens: rows
    };
};

/* As 5 últimas OS abertas */
async function ultimasOS() {
    const { rows } = await pool.query(`
        SELECT
            os.id,
            os.status,
            os.data_abertura,
            os.valor_total::float8 AS valor_total,
            v.placa,
            v.modelo,
            c.nome AS cliente_nome
        FROM ordem_servico os
        JOIN veiculo v ON v.id = os.veiculo_id
        JOIN cliente c ON c.id = v.cliente_id
        ORDER BY os.id DESC
        LIMIT 5
    `);

    return rows;
};

/* Valores do financeiro - a receber, faturado e recebido no mês */
async function financeiro() {
    const aReceber = await pool.query(`
        SELECT COALESCE(SUM(os.valor_total - COALESCE(pg.total_pago, 0)), 0)::float8 AS valor
        FROM ordem_servico os
        LEFT JOIN (
            SELECT
                os_id,
                SUM(valor) AS total_pago
            FROM pagamento
            GROUP BY os_id
        ) pg ON pg.os_id = os.id
        WHERE os.status = 'finalizada' AND os.valor_total > COALESCE(pg.total_pago, 0)
    `);

    const faturado = await pool.query(`
        SELECT COALESCE(SUM(valor_total), 0)::float8 AS valor
        FROM ordem_servico
        WHERE status = 'finalizada' AND data_fechamento >= date_trunc('month', NOW() AT TIME ZONE $1) AT TIME ZONE $1
    `, [FUSO]);

    const recebido = await pool.query(`
        SELECT COALESCE(SUM(valor), 0)::float8 AS valor
        FROM pagamento
        WHERE data_pagamento >= date_trunc('month', NOW() AT TIME ZONE $1) AT TIME ZONE $1
    `, [FUSO]);

    return {
        a_receber: centavos(aReceber.rows[0].valor),
        faturado_mes: centavos(faturado.rows[0].valor),
        recebido_mes: centavos(recebido.rows[0].valor)
    };
};

/* GET /api/painel - resumo da oficina */
async function resumo(req, res) {
    const [
        osPorStatus,
        pecas,
        ultimas
    ] = await Promise.all([
        contarPorStatus(),
        pecasComEstoqueBaixo(),
        ultimasOS()
    ]);

    const podeVerFinanceiro = PERFIS_FINANCEIRO.includes(req.usuario.perfil);

    res.json({
        os_por_status: osPorStatus,
        pecas_estoque_baixo: pecas,
        ultimas_os: ultimas,
        financeiro: podeVerFinanceiro ? await financeiro() : null
    });
};

module.exports = {
    resumo
};
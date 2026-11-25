require('dotenv').config();

/* Libera o limite de login - o teste entra com 3 perfis em sequência */
process.env.LOGIN_LIMITE = '1000';

const app = require('../src/app');
const pool = require('../src/config/db');
const assert = require('node:assert/strict');

const {
    after,
    before,
    test
} = require('node:test');

/* Senha dos usuários de teste do seed */
const SENHA = 'sisgom123';

/* Código único - evita conflito com peças já cadastradas */
const CODIGO = `PAG-${Date.now()}`;

const tokens = {};
const dados = {};

let base;
let servidor;

/* Faz a requisição na API e devolve o status e o corpo já convertido */
async function requisitar(
    metodo,
    caminho,
    corpo,
    token
) {
    const resposta = await fetch(`${base}${caminho}`, {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        },
        body: corpo ? JSON.stringify(corpo) : undefined
    });

    return {
        status: resposta.status,
        corpo: await resposta.json().catch(() => null)
    };
};

/* Entra com o e-mail do seed e devolve o token */
async function entrar(email) {
    const { corpo } = await requisitar(
        'POST',
        '/auth/login',
        {
            email,
            senha: SENHA
        }
    );

    return corpo.token;
};

/* Registra um pagamento na OS do teste com o perfil informado */
function pagar(
    forma_pagamento,
    valor,
    token = tokens.atendente
) {
    return requisitar(
        'POST',
        `/os/${dados.osId}/pagamentos`,
        {
            forma_pagamento,
            valor
        },
        token
    );
};

/* Muda o status da OS do teste com o perfil atendente */
function mudarStatus(status) {
    return requisitar(
        'PATCH',
        `/os/${dados.osId}/status`,
        { status },
        tokens.atendente
    );
};

before(async () => {
    await new Promise((resolve) => {
        servidor = app.listen(0, resolve);
    });

    base = `http://localhost:${servidor.address().port}/api`;

    tokens.admin = await entrar('admin@sisgom.com');
    tokens.atendente = await entrar('atendente@sisgom.com');
    tokens.mecanico = await entrar('mecanico@sisgom.com');

    const veiculos = await requisitar(
        'GET',
        '/veiculos?limite=1',
        null,
        tokens.admin
    );

    const servico = await requisitar(
        'POST',
        '/servicos',
        {
            descricao: `Serviço ${CODIGO}`,
            valor_padrao: 100
        },
        tokens.admin
    );

    const peca = await requisitar(
        'POST',
        '/pecas',
        {
            codigo: CODIGO,
            descricao: 'Peça do teste de pagamentos',
            preco_venda: 12.5,
            quantidade_estoque: 5,
            estoque_minimo: 0
        },
        tokens.admin
    );

    const os = await requisitar(
        'POST',
        '/os',
        {
            veiculo_id: veiculos.corpo.dados[0].id,
            defeito_relatado: 'OS criada pelo teste de pagamentos'
        },
        tokens.atendente
    );

    dados.osId = os.corpo.id;
    dados.servicoId = servico.corpo.id;
    dados.pecaId = peca.corpo.id;

    // total da OS: 1 serviço de 100 + 2 peças de 12,50 = 125
    await requisitar(
        'POST',
        `/os/${dados.osId}/servicos`,
        { servico_id: dados.servicoId },
        tokens.atendente
    );

    await requisitar(
        'POST',
        `/os/${dados.osId}/pecas`,
        {
            peca_id: dados.pecaId,
            quantidade: 2
        },
        tokens.atendente
    );
});

/* Remove tudo que o teste criou, direto no banco (pagamento vem antes por causa da FK) */
after(async () => {
    await pool.query(`
        DELETE FROM pagamento
        WHERE os_id = $1
    `, [dados.osId]);

    await pool.query(`
        DELETE FROM os_peca
        WHERE os_id = $1
    `, [dados.osId]);

    await pool.query(`
        DELETE FROM os_servico
        WHERE os_id = $1
    `, [dados.osId]);

    await pool.query(`
        DELETE FROM ordem_servico
        WHERE id = $1
    `, [dados.osId]);

    await pool.query(`
        DELETE FROM peca
        WHERE id = $1
    `, [dados.pecaId]);

    await pool.query(`
        DELETE FROM servico
        WHERE id = $1
    `, [dados.servicoId]);

    await pool.end();

    servidor.close();
});

test(
    'OS aberta não aceita pagamento (409)',
    async () => {
        const { status } = await pagar(
            'pix',
            10
        );

        assert.equal(
            status,
            409
        );
    }
);

test(
    'OS recém-finalizada começa pendente e sem pagamentos',
    async () => {
        await mudarStatus('em_andamento');

        const { status, corpo } = await mudarStatus('finalizada');

        assert.equal(
            status,
            200
        );

        assert.equal(
            corpo.valor_total,
            125
        );

        assert.equal(
            corpo.total_pago,
            0
        );

        assert.equal(
            corpo.saldo,
            125
        );

        assert.equal(
            corpo.situacao_pagamento,
            'pendente'
        );

        assert.deepEqual(
            corpo.pagamentos,
            []
        );
    }
);

test(
    'forma inválida e valor zero são recusados com detalhes por campo (400)',
    async () => {
        const forma = await pagar(
            'cheque',
            10
        );

        assert.equal(
            forma.status,
            400
        );

        assert.ok(forma.corpo.detalhes.some((d) => d.campo === 'forma_pagamento'));

        const valor = await pagar(
            'pix',
            0
        );

        assert.equal(
            valor.status,
            400
        );

        assert.ok(valor.corpo.detalhes.some((d) => d.campo === 'valor'));
    }
);

test(
    'mecânico não registra pagamento (403)',
    async () => {
        const { status } = await pagar(
            'pix',
            10,
            tokens.mecanico
        );

        assert.equal(
            status,
            403
        );
    }
);

test(
    'pagamento parcial atualiza total pago, saldo e situação',
    async () => {
        const { status, corpo } = await pagar(
            'pix',
            33.33
        );

        assert.equal(
            status,
            201
        );

        assert.equal(
            corpo.total_pago,
            33.33
        );

        // centavos: 125 - 33,33 precisa fechar exato, sem 91.67000000000002
        assert.equal(
            corpo.saldo,
            91.67
        );

        assert.equal(
            corpo.situacao_pagamento,
            'parcial'
        );

        assert.equal(
            corpo.pagamentos.length,
            1
        );

        dados.pagamentoId = corpo.pagamentos[0].id;
    }
);

test(
    'valor acima do saldo é recusado (409) e nada é registrado',
    async () => {
        const { status, corpo } = await pagar(
            'dinheiro',
            91.68
        );

        assert.equal(
            status,
            409
        );

        assert.ok(corpo.detalhes.some((d) => d.campo === 'valor'));

        const os = await requisitar(
            'GET',
            `/os/${dados.osId}`,
            null,
            tokens.admin
        );

        assert.equal(
            os.corpo.saldo,
            91.67
        );

        assert.equal(
            os.corpo.pagamentos.length,
            1
        );
    }
);

test(
    'pagar o saldo exato quita a OS',
    async () => {
        const { status, corpo } = await pagar(
            'cartao_credito',
            91.67
        );

        assert.equal(
            status,
            201
        );

        assert.equal(
            corpo.total_pago,
            125
        );

        assert.equal(
            corpo.saldo,
            0
        );

        assert.equal(
            corpo.situacao_pagamento,
            'pago'
        );
    }
);

test(
    'OS totalmente paga não aceita novo pagamento (409)',
    async () => {
        const { status } = await pagar(
            'pix',
            1
        );

        assert.equal(
            status,
            409
        );
    }
);

test(
    'atendente não estorna pagamento (403)',
    async () => {
        const { status } = await requisitar(
            'DELETE',
            `/os/${dados.osId}/pagamentos/${dados.pagamentoId}`,
            null,
            tokens.atendente
        );

        assert.equal(
            status,
            403
        );
    }
);

test(
    'admin estorna o pagamento e o saldo volta a abrir',
    async () => {
        const { status, corpo } = await requisitar(
            'DELETE',
            `/os/${dados.osId}/pagamentos/${dados.pagamentoId}`,
            null,
            tokens.admin
        );

        assert.equal(
            status,
            200
        );

        assert.equal(
            corpo.total_pago,
            91.67
        );

        assert.equal(
            corpo.saldo,
            33.33
        );

        assert.equal(
            corpo.situacao_pagamento,
            'parcial'
        );

        assert.equal(
            corpo.pagamentos.length,
            1
        );
    }
);

test(
    'estornar pagamento que não existe na OS retorna 404',
    async () => {
        const { status } = await requisitar(
            'DELETE',
            `/os/${dados.osId}/pagamentos/${dados.pagamentoId}`,
            null,
            tokens.admin
        );

        assert.equal(
            status,
            404
        );
    }
);
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
const CODIGO = `TST-${Date.now()}`;

const tokens = {};
const dados = {};
const criadas = [];

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

/* Consulta o estoque atual de uma peça */
async function estoqueDa(pecaId) {
    const { corpo } = await requisitar(
        'GET',
        `/pecas/${pecaId}`,
        null,
        tokens.admin
    );

    return corpo.quantidade_estoque;
};

/* Abre uma OS para o veículo de teste com o perfil atendente */
async function abrirOS() {
    const { status, corpo } = await requisitar(
        'POST',
        '/os',
        {
            veiculo_id: dados.veiculoId,
            defeito_relatado: 'OS criada pelo teste automatizado'
        },
        tokens.atendente
    );

    assert.equal(
        status,
        201
    );

    criadas.push(corpo.id);

    return corpo;
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

    dados.veiculoId = veiculos.corpo.dados[0].id;

    const servico = await requisitar(
        'POST',
        '/servicos',
        {
            descricao: `Serviço ${CODIGO}`,
            valor_padrao: 100
        },
        tokens.admin
    );

    dados.servicoId = servico.corpo.id;

    const pecaA = await requisitar(
        'POST',
        '/pecas',
        {
            codigo: `${CODIGO}-A`,
            descricao: 'Peça A do teste',
            preco_venda: 12.5,
            quantidade_estoque: 5,
            estoque_minimo: 1
        },
        tokens.admin
    );

    const pecaB = await requisitar(
        'POST',
        '/pecas',
        {
            codigo: `${CODIGO}-B`,
            descricao: 'Peça B do teste',
            preco_venda: 7,
            quantidade_estoque: 1,
            estoque_minimo: 0
        },
        tokens.admin
    );

    dados.pecaA = pecaA.corpo.id;
    dados.pecaB = pecaB.corpo.id;
});

/* Remove tudo que o teste criou, direto no banco (OS finalizada não é excluída pela API) */
after(async () => {
    if (criadas.length) {
        await pool.query(`
            DELETE FROM os_peca
            WHERE os_id = ANY($1)
        `, [criadas]);

        await pool.query(`
            DELETE FROM os_servico
            WHERE os_id = ANY($1)
        `, [criadas]);

        await pool.query(`
            DELETE FROM ordem_servico
            WHERE id = ANY($1)
        `, [criadas]);
    }

    await pool.query(`
        DELETE FROM peca
        WHERE id = ANY($1)
    `, [[
        dados.pecaA,
        dados.pecaB
    ]]);

    await pool.query(`
        DELETE FROM servico
        WHERE id = $1
    `, [dados.servicoId]);

    await pool.end();

    servidor.close();
});

test(
    'login com senha errada retorna 401',
    async () => {
        const { status } = await requisitar(
            'POST',
            '/auth/login',
            {
                email: 'admin@sisgom.com',
                senha: 'senha-errada'
            }
        );

        assert.equal(status,
            401
        );
    }
);

test('rota protegida sem token retorna 401', async () => {
    const { status } = await requisitar(
        'GET',
        '/os'
    );

    assert.equal(
        status,
        401
    );
});

test(
    'mecânico não abre OS (403)',
    async () => {
        const { status } = await requisitar(
            'POST',
            '/os',
            { veiculo_id: dados.veiculoId },
            tokens.mecanico
        );

        assert.equal(
            status,
            403
        );
    }
);

test(
    'atendente abre OS com status aberta e total zero',
    async () => {
        const os = await abrirOS();

        dados.osId = os.id;

        assert.equal(
            os.status,
            'aberta'
        );

        assert.equal(
            os.valor_total,
            0
        );
    }
);

test(
    'itens da OS recalculam o total',
    async () => {
        const servico = await requisitar(
            'POST',
            `/os/${dados.osId}/servicos`,
            { servico_id: dados.servicoId },
            tokens.atendente
        );

        assert.equal(
            servico.status,
            201
        );

        assert.equal(
            servico.corpo.valor_total,
            100
        );

        const peca = await requisitar(
            'POST',
            `/os/${dados.osId}/pecas`,
            {
                peca_id: dados.pecaA,
                quantidade: 2
            },
            tokens.atendente
        );

        assert.equal(
            peca.status,
            201
        );

        assert.equal(
            peca.corpo.valor_total,
            125
        );
    }
);

test(
    'OS aberta não pode ser finalizada direto (409)',
    async () => {
        const { status } = await requisitar(
            'PATCH',
            `/os/${dados.osId}/status`,
            { status: 'finalizada' },
            tokens.atendente
        );

        assert.equal(
            status,
            409
        );
    }
);

test(
    'iniciar atendimento muda o status para em_andamento',
    async () => {
        const { status, corpo } = await requisitar(
            'PATCH',
            `/os/${dados.osId}/status`,
            { status: 'em_andamento' },
            tokens.atendente
        );

        assert.equal(
            status,
            200
        );

        assert.equal(
            corpo.status,
            'em_andamento'
        );
    }
);

test(
    'estoque insuficiente barra a finalização e não altera o estoque',
    async () => {
        const peca = await requisitar(
            'POST',
            `/os/${dados.osId}/pecas`,
            {
                peca_id: dados.pecaB,
                quantidade: 5
            },
            tokens.atendente
        );

        dados.itemB = peca.corpo.pecas.find((i) => i.peca_id === dados.pecaB).id;

        const { status } = await requisitar(
            'PATCH',
            `/os/${dados.osId}/status`,
            { status: 'finalizada' },
            tokens.atendente
        );

        assert.equal(
            status,
            409
        );

        const os = await requisitar(
            'GET',
            `/os/${dados.osId}`,
            null,
            tokens.admin
        );

        assert.equal(
            os.corpo.status,
            'em_andamento'
        );

        assert.equal(
            await estoqueDa(dados.pecaA),
            5
        );

        assert.equal(
            await estoqueDa(dados.pecaB),
            1
        );
    }
);

test(
    'remover o item problemático recalcula o total',
    async () => {
        const { status, corpo } = await requisitar(
            'DELETE',
            `/os/${dados.osId}/pecas/${dados.itemB}`,
            null,
            tokens.atendente
        );

        assert.equal(
            status,
            200
        );

        assert.equal(
            corpo.valor_total,
            125
        );
    }
);

test(
    'finalizar a OS baixa o estoque das peças',
    async () => {
        const { status, corpo } = await requisitar(
            'PATCH',
            `/os/${dados.osId}/status`,
            { status: 'finalizada' },
            tokens.atendente
        );

        assert.equal(
            status,
            200
        );

        assert.equal(
            corpo.status,
            'finalizada'
        );

        assert.equal(
            corpo.valor_total,
            125
        );

        assert.equal(
            await estoqueDa(dados.pecaA),
            3
        );

        assert.equal(
            await estoqueDa(dados.pecaB),
            1

        );
    }
);

test(
    'OS finalizada não aceita novos itens (409)',
    async () => {
        const { status } = await requisitar(
            'POST',
            `/os/${dados.osId}/servicos`,
            { servico_id: dados.servicoId },
            tokens.atendente
        );

        assert.equal(
            status,
            409
        );
    }
);

test(
    'OS sem itens não finaliza e só atendente ou admin cancelam', async () => {
        const os = await abrirOS();

        await requisitar(
            'PATCH',
            `/os/${os.id}/status`,
            { status: 'em_andamento' },
            tokens.atendente
        );

        const finalizar = await requisitar(
            'PATCH',
            `/os/${os.id}/status`,
            { status: 'finalizada' },
            tokens.atendente
        );

        assert.equal(
            finalizar.status,
            409
        );

        const mecanico = await requisitar(
            'PATCH',
            `/os/${os.id}/status`,
            { status: 'cancelada' },
            tokens.mecanico
        );

        assert.equal(
            mecanico.status,
            403
        );

        const cancelar = await requisitar(
            'PATCH',
            `/os/${os.id}/status`,
            { status: 'cancelada' },
            tokens.atendente
        );

        assert.equal(
            cancelar.status,
            200
        );

        assert.equal(
            cancelar.corpo.status,
            'cancelada'
        );
    }
);

test(
    'histórico do veículo lista só as OS dele',
    async () => {
        const { status, corpo } = await requisitar(
            'GET',
            `/os?veiculo_id=${dados.veiculoId}`,
            null,
            tokens.admin
        );

        assert.equal(
            status,
            200
        );

        assert.ok(corpo.dados.some((os) => os.id === dados.osId));

        assert.equal(
            new Set(corpo.dados.map((os) => os.placa)).size,
            1
        );
    }
);
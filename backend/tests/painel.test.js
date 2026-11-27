require('dotenv').config();

/* Libera o limite de login - o teste entra várias vezes */
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

const tokens = {};

let base;
let servidor;

/* Faz a requisição na API e devolve o status e o corpo já convertido */
async function requisitar(
    caminho,
    token
) {
    const resposta = await fetch(`${base}${caminho}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    return {
        status: resposta.status,
        corpo: await resposta.json().catch(() => null)
    };
};

/* Entra com o e-mail do seed e devolve o token */
async function entrar(email) {
    const resposta = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            senha: SENHA
        })
    });

    return (await resposta.json()).token;
};

before(async () => {
    await new Promise((resolve) => {
        servidor = app.listen(0, resolve);
    });

    base = `http://localhost:${servidor.address().port}/api`;

    tokens.admin = await entrar('admin@sisgom.com');
    tokens.atendente = await entrar('atendente@sisgom.com');
    tokens.mecanico = await entrar('mecanico@sisgom.com');
});

after(async () => {
    await new Promise((resolve) => servidor.close(resolve));
    await pool.end();
});

test('Painel exige autenticação', async () => {
    const { status } = await requisitar('/painel');

    assert.equal(
        status,
        401
    );
});

test(
    'Administrador recebe contagens, últimas OS e financeiro',
    async () => {
        const { status, corpo } = await requisitar(
            '/painel',
            tokens.admin
        );

        assert.equal(
            status,
            200
        );

        [
            'aberta',
            'em_andamento',
            'finalizada',
            'cancelada'
        ].forEach((chave) => {
            assert.equal(
                typeof corpo.os_por_status[chave],
                'number'
            );
        });

        assert.ok(Array.isArray(corpo.ultimas_os));
        assert.ok(corpo.ultimas_os.length <= 5);
        assert.ok(corpo.pecas_estoque_baixo.itens.length <= 5);

        [
            'a_receber',
            'faturado_mes',
            'recebido_mes'
        ].forEach((chave) => {
            assert.equal(
                typeof corpo.financeiro[chave],
                'number'
            );
        });
    }
);

test(
    'Atendente vê o financeiro e mecânico não',
    async () => {
        const atendente = await requisitar(
            '/painel',
            tokens.atendente
        );

        assert.equal(
            atendente.status,
            200
        );

        assert.notEqual(
            atendente.corpo.financeiro,
            null
        );

        const mecanico = await requisitar(
            '/painel',
            tokens.mecanico
        );

        assert.equal(
            mecanico.status,
            200
        );

        assert.equal(
            mecanico.corpo.financeiro,
            null
        );

        assert.equal(
            typeof mecanico.corpo.os_por_status.aberta,
            'number'
        );
    }
);

test(
    'Contagens do painel batem com as listas',
    async () => {
        const painel = await requisitar(
            '/painel',
            tokens.admin
        );

        const finalizadas = await requisitar(
            '/os?status=finalizada&limite=1',
            tokens.admin
        );

        assert.equal(
            painel.corpo.os_por_status.finalizada,
            finalizadas.corpo.total
        );

        const pecas = await requisitar(
            '/pecas?baixo=1&limite=1',
            tokens.admin
        );

        assert.equal(
            painel.corpo.pecas_estoque_baixo.total,
            pecas.corpo.total
        );
    }
);
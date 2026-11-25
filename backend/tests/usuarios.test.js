require('dotenv').config();

/* Libera o limite de login - o teste entra várias vezes, inclusive com senha errada */
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

/* E-mail único - evita conflito com usuários já cadastrados */
const EMAIL = `teste.${Date.now()}@sisgom.com`;

const tokens = {};
const dados = {};
const criados = [];

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

/* Tenta entrar com e-mail e senha e devolve a resposta da API */
function login(
    email,
    senha
) {
    return requisitar(
        'POST',
        '/auth/login',
        {
            email,
            senha
        }
    );
};

/* Entra com o e-mail do seed e devolve o token */
async function entrar(email) {
    const { corpo } = await login(
        email,
        SENHA
    );

    return corpo.token;
};

/* Edita o usuário de teste com o perfil admin - o corpo padrão mantém os dados atuais */
function editar(extra = {}) {
    return requisitar(
        'PUT',
        `/usuarios/${dados.id}`,
        {
            nome: 'Teste Automatizado',
            email: EMAIL,
            perfil: 'MECANICO',
            ...extra
        },
        tokens.admin
    );
};

/* Inativa ou reativa o usuário de teste com o perfil admin */
function alterarAtivo(ativo) {
    return requisitar(
        'PATCH',
        `/usuarios/${dados.id}/ativo`,
        { ativo },
        tokens.admin
    );
};

/* Diz se o usuário de teste aparece na lista de mecânicos ativos */
async function apareceEntreMecanicos() {
    const { corpo } = await requisitar(
        'GET',
        '/usuarios/mecanicos',
        null,
        tokens.admin
    );

    return corpo.some((mecanico) => mecanico.id === dados.id);
};

before(async () => {
    await new Promise((resolve) => {
        servidor = app.listen(0, resolve);
    });

    base = `http://localhost:${servidor.address().port}/api`;

    tokens.admin = await entrar('admin@sisgom.com');
    tokens.atendente = await entrar('atendente@sisgom.com');
    tokens.mecanico = await entrar('mecanico@sisgom.com');

    const eu = await requisitar(
        'GET',
        '/auth/me',
        null,
        tokens.admin
    );

    dados.adminId = eu.corpo.id;
});

/* Remove os usuários que o teste criou, direto no banco (a API não exclui usuário) */
after(async () => {
    if (criados.length) {
        await pool.query(`
            DELETE FROM usuario
            WHERE id = ANY($1)
        `, [criados]);
    }

    await pool.end();

    servidor.close();
});

test(
    'atendente e mecânico não acessam o gerenciamento de usuários (403)',
    async () => {
        for (const token of [tokens.atendente, tokens.mecanico]) {
            const listar = await requisitar(
                'GET',
                '/usuarios',
                null,
                token
            );

            assert.equal(
                listar.status,
                403
            );

            const criar = await requisitar(
                'POST',
                '/usuarios',
                {
                    nome: 'Não deveria criar',
                    email: `bloqueado.${EMAIL}`,
                    perfil: 'ADMIN',
                    senha: 'senha12345'
                },
                token
            );

            assert.equal(
                criar.status,
                403
            );
        }
    }
);

test(
    'admin lista os usuários sem expor o hash da senha',
    async () => {
        const { status, corpo } = await requisitar(
            'GET',
            '/usuarios',
            null,
            tokens.admin
        );

        assert.equal(
            status,
            200
        );

        assert.ok(corpo.total >= 3);

        assert.ok(corpo.dados.every((u) => !('senha_hash' in u) && !('senha' in u)));
    }
);

test(
    'cadastro inválido devolve 400 com detalhes por campo',
    async () => {
        const { status, corpo } = await requisitar(
            'POST',
            '/usuarios',
            {
                nome: '',
                email: 'x',
                perfil: 'ROOT',
                senha: '123'
            },
            tokens.admin
        );

        assert.equal(
            status,
            400
        );

        assert.deepEqual(
            corpo.detalhes.map((d) => d.campo).sort(),
            [
                'email',
                'nome',
                'perfil',
                'senha'
            ]
        );
    }
);

test(
    'cadastro válido normaliza o e-mail e guarda a senha só como hash',
    async () => {
        const { status, corpo } = await requisitar(
            'POST',
            '/usuarios',
            {
                nome: 'Teste Automatizado',
                email: EMAIL.toUpperCase(),
                perfil: 'MECANICO',
                senha: 'teste12345'
            },
            tokens.admin
        );

        assert.equal(
            status,
            201
        );

        dados.id = corpo.id;
        criados.push(corpo.id);

        assert.equal(
            corpo.email,
            EMAIL
        );

        assert.equal(
            corpo.ativo,
            true
        );

        assert.ok(!('senha_hash' in corpo));

        const { rows } = await pool.query(`
            SELECT senha_hash
            FROM usuario
            WHERE id = $1
        `, [dados.id]);

        assert.notEqual(
            rows[0].senha_hash,
            'teste12345'
        );

        assert.ok(rows[0].senha_hash.startsWith('$2'));
    }
);

test(
    'e-mail repetido é recusado (409) com erro no campo email',
    async () => {
        const { status, corpo } = await requisitar(
            'POST',
            '/usuarios',
            {
                nome: 'Outro Teste',
                email: EMAIL,
                perfil: 'ATENDENTE',
                senha: 'teste12345'
            },
            tokens.admin
        );

        assert.equal(
            status,
            409
        );

        assert.ok(corpo.detalhes.some((d) => d.campo === 'email'));
    }
);

test(
    'o novo usuário entra com a senha cadastrada e recebe o perfil certo',
    async () => {
        const { status, corpo } = await login(
            EMAIL,
            'teste12345'
        );

        assert.equal(
            status,
            200
        );

        assert.equal(
            corpo.usuario.perfil,
            'MECANICO'
        );
    }
);

test(
    'editar sem informar senha mantém a senha atual',
    async () => {
        const { status, corpo } = await editar({ nome: 'Teste Automatizado 2' });

        assert.equal(
            status,
            200
        );

        assert.equal(
            corpo.nome,
            'Teste Automatizado 2'
        );

        const { status: statusLogin } = await login(
            EMAIL,
            'teste12345'
        );

        assert.equal(
            statusLogin,
            200
        );
    }
);

test(
    'editar com senha nova troca a senha',
    async () => {
        const { status } = await editar({ senha: 'novasenha99' });

        assert.equal(
            status,
            200
        );

        const antiga = await login(
            EMAIL,
            'teste12345'
        );

        assert.equal(
            antiga.status,
            401
        );

        const nova = await login(
            EMAIL,
            'novasenha99'
        );

        assert.equal(
            nova.status,
            200
        );
    }
);

test(
    'admin não altera o próprio perfil nem inativa o próprio usuário (409)',
    async () => {
        const perfil = await requisitar(
            'PUT',
            `/usuarios/${dados.adminId}`,
            {
                nome: 'Administrador SISGOM',
                email: 'admin@sisgom.com',
                perfil: 'ATENDENTE'
            },
            tokens.admin
        );

        assert.equal(
            perfil.status,
            409
        );

        const inativar = await requisitar(
            'PATCH',
            `/usuarios/${dados.adminId}/ativo`,
            { ativo: false },
            tokens.admin
        );

        assert.equal(
            inativar.status,
            409
        );
    }
);

test(
    'inativar bloqueia o login e tira o mecânico da lista de escolha',
    async () => {
        assert.equal(
            await apareceEntreMecanicos(),
            true
        );

        const { status, corpo } = await alterarAtivo(false);

        assert.equal(
            status,
            200
        );

        assert.equal(
            corpo.ativo,
            false
        );

        const entrada = await login(
            EMAIL,
            'novasenha99'
        );

        assert.equal(
            entrada.status,
            401
        );

        assert.equal(
            await apareceEntreMecanicos(),
            false
        );
    }
);

test(
    'reativar devolve o acesso',
    async () => {
        const { status, corpo } = await alterarAtivo(true);

        assert.equal(
            status,
            200
        );

        assert.equal(
            corpo.ativo,
            true
        );

        const entrada = await login(
            EMAIL,
            'novasenha99'
        );

        assert.equal(
            entrada.status,
            200
        );

        assert.equal(
            await apareceEntreMecanicos(),
            true
        );
    }
);

test(
    'valor inválido em ativo e ids ruins são recusados',
    async () => {
        const texto = await requisitar(
            'PATCH',
            `/usuarios/${dados.id}/ativo`,
            { ativo: 'false' },
            tokens.admin
        );

        assert.equal(
            texto.status,
            400
        );

        const inexistente = await requisitar(
            'GET',
            '/usuarios/99999999',
            null,
            tokens.admin
        );

        assert.equal(
            inexistente.status,
            404
        );

        const invalido = await requisitar(
            'GET',
            '/usuarios/abc',
            null,
            tokens.admin
        );

        assert.equal(
            invalido.status,
            400
        );
    }
);
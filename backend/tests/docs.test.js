const app = require('../src/app');
const assert = require('node:assert/strict');
const especificacao = require('../src/docs/openapi');

const {
    after,
    before,
    test
} = require('node:test');

let base;
let servidor;

before(async () => {
    servidor = app.listen(0);
    base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => servidor.close());

test(
    'GET /api/docs/ devolve a página do Swagger',
    async () => {
        const resposta = await fetch(`${base}/api/docs/`);
        const html = await resposta.text();

        assert.equal(
            resposta.status,
            200
        );

        assert.match(
            html,
            /swagger-ui/
        );
    });

test('A especificação cobre as rotas principais', () => {
    const caminhos = Object.keys(especificacao.paths);

    [
        '/auth/login',
        '/painel',
        '/clientes/{id}',
        '/os/{id}/pagamentos',
        '/usuarios/{id}/ativo'
    ].forEach((caminho) => assert.ok(
        caminhos.includes(caminho),
        caminho
    ));
});
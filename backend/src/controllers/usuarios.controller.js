const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { ErroHttp } = require('../middlewares/erros');
const { validarUsuario, idDaRota } = require('../utils/validacao');

/* Colunas retornadas nas consultas de usuários - nunca devolve o hash da senha */
const COLUNAS = `
  id,
  nome,
  email,
  perfil,
  ativo,
  criado_em
`;

/* Converte e-mail repetido (23505) em erro de campo - os demais erros seguem */
function tratarEmailRepetido(error) {
    if (error.code === '23505') {
        throw new ErroHttp(
            409,
            'Já existe um usuário com este e-mail',
            [{
                campo: 'email',
                mensagem: 'E-mail já cadastrado!'
            }]
        );
    }

    throw error;
};

/* GET /api/usuarios?busca=&pagina=&limite= */
async function listar(req, res) {
    const busca = String(req.query.busca ?? '').trim();
    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 200);
    const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);

    const filtro = busca ? 'WHERE nome ILIKE $1 OR email ILIKE $1' : '';
    const params = busca ? [`%${busca}%`] : [];

    const total = (await pool.query(`
        SELECT COUNT(*)::int AS n
        FROM usuario ${filtro}
    `, params)).rows[0].n;

    const { rows } = await pool.query(`
        SELECT ${COLUNAS}
        FROM usuario ${filtro}
        ORDER BY nome LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [
        ...params,
        limite,
        (pagina - 1) * limite
    ]);

    res.json({
        dados: rows,
        total,
        pagina,
        limite
    });
};

/* GET /api/usuarios/:id */
async function buscar(req, res) {
    const { rows } = await pool.query(`
        SELECT ${COLUNAS}
        FROM usuario
        WHERE id = $1
    `, [idDaRota(req)]);

    if (!rows[0]) throw new ErroHttp(
        404,
        'Usuário não encontrado'
    );

    res.json(rows[0]);
};

/* POST /api/usuarios - a senha é guardada só como hash */
async function criar(req, res) {
    const d = validarUsuario(
        req.body,
        { senhaObrigatoria: true }
    );

    const senhaHash = await bcrypt.hash(
        d.senha,
        10
    );

    try {
        const { rows } = await pool.query(`
            INSERT INTO usuario (
                nome,
                email,
                senha_hash,
                perfil
            ) VALUES ($1, $2, $3, $4) RETURNING ${COLUNAS}
        `, [
            d.nome,
            d.email,
            senhaHash,
            d.perfil
        ]);

        res.status(201).json(rows[0]);
    } catch (error) {
        tratarEmailRepetido(error);
    }
};

/* PUT /api/usuarios/:id - senha em branco mantém a atual */
async function atualizar(req, res) {
    const id = idDaRota(req);
    const d = validarUsuario(req.body);

    if (id === req.usuario.id && d.perfil !== req.usuario.perfil) {
        throw new ErroHttp(
            409,
            'Você não pode alterar o seu próprio perfil'
        );
    }

    const senhaHash = d.senha ? await bcrypt.hash(d.senha, 10) : null;

    try {
        const { rows } = await pool.query(`
            UPDATE usuario
            SET
                nome = $1,
                email = $2,
                perfil = $3,
                senha_hash = COALESCE($4, senha_hash)
            WHERE id = $5 RETURNING ${COLUNAS}
        `, [
            d.nome,
            d.email,
            d.perfil,
            senhaHash,
            id
        ]);

        if (!rows[0]) throw new ErroHttp(
            404,
            'Usuário não encontrado'
        );

        res.json(rows[0]);
    } catch (error) {
        if (error instanceof ErroHttp) throw error;

        tratarEmailRepetido(error);
    }
};

/* PATCH /api/usuarios/:id/ativo - inativa ou reativa (usuário não é excluído) */
async function alterarAtivo(req, res) {
    const id = idDaRota(req);
    const ativo = req.body?.ativo;

    if (typeof ativo !== 'boolean') {
        throw new ErroHttp(
            400,
            'Dados inválidos!',
            [{
                campo: 'ativo',
                mensagem: 'Informe true ou false'
            }]
        );
    }

    if (id === req.usuario.id && !ativo) {
        throw new ErroHttp(
            409,
            'Você não pode inativar o seu próprio usuário'
        );
    }

    const { rows } = await pool.query(`
        UPDATE usuario
        SET ativo = $1
        WHERE id = $2 RETURNING ${COLUNAS}
    `, [
        ativo,
        id
    ]);

    if (!rows[0]) throw new ErroHttp(
        404,
        'Usuário não encontrado'
    );

    res.json(rows[0]);
};

module.exports = {
    listar,
    buscar,
    criar,
    atualizar,
    alterarAtivo
};
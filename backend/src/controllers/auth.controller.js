const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ErroHttp } = require('../middlewares/erros');

/* Hash falso para gastar o mesmo tempo quando o e-mail não existe */
const HASH_FALSO = bcrypt.hashSync('senha-falsa', 10);

async function login(req, res) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const senha = String(req.body?.senha ?? '');

  if (!email || !senha) throw new ErroHttp(400, 'Informe e-mail e senha');

  const { rows } = await pool.query(`
    SELECT
      id,
      nome,
      email,
      senha_hash,
      perfil,
      ativo
    FROM usuario
    WHERE email = $1
  `, [email]);

  const usuario = rows[0];

  const senhaOk = await bcrypt.compare(
    senha,
    usuario ? usuario.senha_hash : HASH_FALSO
  );

  if (!usuario || !usuario.ativo || !senhaOk) {
    throw new ErroHttp(401, 'E-mail ou senha inválidos');
  }

  const token = jwt.sign({
    perfil: usuario.perfil,
    nome: usuario.nome
  }, process.env.JWT_SECRET, {
    subject: String(usuario.id),
    expiresIn: process.env.JWT_EXPIRA || '8h',
    algorithm: 'HS256',
  });

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }
  });
};

async function me(req, res) {
  const { rows } = await pool.query(`
    SELECT
      id,
      nome,
      email,
      perfil
    FROM usuario
    WHERE id = $1 AND ativo
  `, [req.usuario.id]);

  if (!rows[0]) throw new ErroHttp(401, 'Usuário não encontrado ou inativo');

  res.json(rows[0]);
};

module.exports = {
  login,
  me
};
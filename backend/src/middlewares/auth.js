const jwt = require('jsonwebtoken');
const { ErroHttp } = require('./erros');

// Exige um token Bearer válido e coloca os dados do usuário em req.usuario.
function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new ErroHttp(401, 'Token não informado'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.usuario = { id: Number(payload.sub), perfil: payload.perfil, nome: payload.nome };
    return next();
  } catch {
    return next(new ErroHttp(401, 'Token inválido ou expirado'));
  }
}

// Libera a rota apenas para os perfis informados (ADMIN, ATENDENTE, MECANICO).
const autorizar = (...perfis) => (req, res, next) =>
  perfis.includes(req.usuario.perfil)
    ? next()
    : next(new ErroHttp(403, 'Sem permissão para esta operação'));

module.exports = { autenticar, autorizar };

/* Erro com status HTTP, lançado pelos controllers e tratado em um único lugar */
class ErroHttp extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
};

/* Permite usar async/await nos controllers sem try/catch em cada um */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(
  req,
  res,
  next
)).catch(next);

/* Resposta padrão para rotas inexistentes */
function naoEncontrado(req, res) {
  res.status(404).json({
    erro: 'Rota não encontrada!'
  });
};

/* eslint-disable-next-line no-unused-vars */
function tratarErros(error, req, res, next) {
  if (error instanceof ErroHttp) {
    return res.status(error.status).json({
      erro: error.message,
      detalhes: error.detalhes
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      erro: 'JSON inválido no corpo da requisição!'
    });
  }

  // erros do PostgreSQL
  if (error.code === '23505') {
    return res.status(409).json({
      erro: 'Já existe um registro com esse valor único (ex.: CPF/CNPJ ou placa)'
    });
  }

  if (error.code === '23503' || error.code === '23001') {
    return res.status(409).json({
      erro: 'Operação bloqueada por vínculo com outros registros!'
    });
  }

  if (error.code === '23514' || error.code === '22P02') {
    return res.status(400).json({
      erro: 'Dados inválidos!'
    });
  }

  console.error(error);

  return res.status(500).json({
    erro: 'Erro interno do servidor'
  });
};

module.exports = {
  ErroHttp,
  asyncHandler,
  naoEncontrado,
  tratarErros
};
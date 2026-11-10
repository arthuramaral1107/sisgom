// Erro com status HTTP, lançado pelos controllers e tratado em um único lugar.
class ErroHttp extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

// Permite usar async/await nos controllers sem try/catch em cada um.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function naoEncontrado(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
  if (err instanceof ErroHttp) {
    return res.status(err.status).json({ erro: err.message, detalhes: err.detalhes });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição' });
  }
  // Erros do PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ erro: 'Já existe um registro com esse valor único (ex.: CPF/CNPJ ou placa)' });
  }
  if (err.code === '23503' || err.code === '23001') {
    return res.status(409).json({ erro: 'Operação bloqueada por vínculo com outros registros' });
  }
  if (err.code === '23514' || err.code === '22P02') {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}

module.exports = { ErroHttp, asyncHandler, naoEncontrado, tratarErros };

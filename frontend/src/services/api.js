const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
const CHAVE_TOKEN = 'sisgom_token';

export const tokenStorage = {
  obter: () => localStorage.getItem(CHAVE_TOKEN),
  salvar: (t) => localStorage.setItem(CHAVE_TOKEN, t),
  limpar: () => localStorage.removeItem(CHAVE_TOKEN),
};

export class ErroApi extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes || [];
  }
}

let aoExpirarSessao = () => {};
export const definirAoExpirarSessao = (fn) => { aoExpirarSessao = fn; };

async function requisicao(caminho, { metodo = 'GET', corpo, semAuth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStorage.obter();
  if (token && !semAuth) headers.Authorization = `Bearer ${token}`;

  let resp;
  try {
    resp = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar à API. Verifique se o servidor está rodando.');
  }

  if (resp.status === 204) return null;
  const dados = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    if (resp.status === 401 && !semAuth) aoExpirarSessao();
    throw new ErroApi(resp.status, dados.erro || 'Erro inesperado', dados.detalhes);
  }
  return dados;
}

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const api = {
  login: (email, senha) => requisicao('/auth/login', { metodo: 'POST', corpo: { email, senha }, semAuth: true }),
  me: () => requisicao('/auth/me'),

  clientes: {
    listar: (params) => requisicao(`/clientes${qs(params)}`),
    buscar: (id) => requisicao(`/clientes/${id}`),
    criar: (dados) => requisicao('/clientes', { metodo: 'POST', corpo: dados }),
    atualizar: (id, dados) => requisicao(`/clientes/${id}`, { metodo: 'PUT', corpo: dados }),
    excluir: (id) => requisicao(`/clientes/${id}`, { metodo: 'DELETE' }),
  },
  veiculos: {
    listar: (params) => requisicao(`/veiculos${qs(params)}`),
    buscar: (id) => requisicao(`/veiculos/${id}`),
    criar: (dados) => requisicao('/veiculos', { metodo: 'POST', corpo: dados }),
    atualizar: (id, dados) => requisicao(`/veiculos/${id}`, { metodo: 'PUT', corpo: dados }),
    excluir: (id) => requisicao(`/veiculos/${id}`, { metodo: 'DELETE' }),
  },
};

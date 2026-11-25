/* Endereço da API - vem do .env ou usa o padrão local */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

/* Chave onde o token de login fica salvo no navegador */
const CHAVE_TOKEN = 'sisgom_token';

/* Leitura, gravação e remoção do token de login */
export const tokenStorage = {
  obter: () => localStorage.getItem(CHAVE_TOKEN),
  salvar: (t) => localStorage.setItem(CHAVE_TOKEN, t),
  limpar: () => localStorage.removeItem(CHAVE_TOKEN)
};

/* Erro das chamadas à API - guarda o status e os detalhes por campo */
export class ErroApi extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);

    this.status = status;
    this.detalhes = detalhes || [];
  };
};

/* Ação executada quando a API recusa o token - definida pelo AuthContext */
let aoExpirarSessao = () => { };

/* Registra a ação executada quando a sessão expira */
export const definirAoExpirarSessao = (fn) => { aoExpirarSessao = fn; };

/* Faz a requisição à API enviando o token e padroniza os erros */
async function requisicao(caminho, { metodo = 'GET', corpo, semAuth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStorage.obter();

  if (token && !semAuth) headers.Authorization = `Bearer ${token}`;

  let resp;

  try {
    resp = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined
    });
  } catch {
    throw new ErroApi(
      0,
      'Não foi possível conectar à API. Verifique se o servidor está rodando!'
    );
  }

  if (resp.status === 204) return null;

  const dados = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    if (resp.status === 401 && !semAuth) aoExpirarSessao();

    throw new ErroApi(resp.status, dados.erro || 'Erro inesperado', dados.detalhes);
  }

  return dados;
};

/* Monta a query string ignorando parâmetros vazios */
const qs = (params) => {
  const p = new URLSearchParams();

  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v);
  });

  const s = p.toString();

  return s ? `?${s}` : '';
};

/* Chamadas da API agrupadas por recurso */
export const api = {
  login: (email, senha) => requisicao(
    '/auth/login',
    {
      metodo: 'POST',
      corpo: {
        email,
        senha
      },
      semAuth: true
    }
  ),
  me: () => requisicao('/auth/me'),
  clientes: {
    listar: (params) => requisicao(`/clientes${qs(params)}`),
    buscar: (id) => requisicao(`/clientes/${id}`),
    criar: (dados) => requisicao('/clientes', { metodo: 'POST', corpo: dados }),
    atualizar: (id, dados) => requisicao(
      `/clientes/${id}`,
      {
        metodo: 'PUT',
        corpo: dados
      }
    ),
    excluir: (id) => requisicao(`/clientes/${id}`, { metodo: 'DELETE' }),
  },
  veiculos: {
    listar: (params) => requisicao(`/veiculos${qs(params)}`),
    buscar: (id) => requisicao(`/veiculos/${id}`),
    criar: (dados) => requisicao('/veiculos', { metodo: 'POST', corpo: dados }),
    atualizar: (id, dados) => requisicao(
      `/veiculos/${id}`,
      {
        metodo: 'PUT',
        corpo: dados
      }
    ),
    excluir: (id) => requisicao(`/veiculos/${id}`, { metodo: 'DELETE' }),
  },
  servicos: {
    listar: (params) => requisicao(`/servicos${qs(params)}`),
    buscar: (id) => requisicao(`/servicos/${id}`),
    criar: (dados) => requisicao('/servicos', { metodo: 'POST', corpo: dados }),
    atualizar: (id, dados) => requisicao(
      `/servicos/${id}`,
      {
        metodo: 'PUT',
        corpo: dados
      }
    ),
    excluir: (id) => requisicao(`/servicos/${id}`, { metodo: 'DELETE' }),
  },
  pecas: {
    listar: (params) => requisicao(`/pecas${qs(params)}`),
    buscar: (id) => requisicao(`/pecas/${id}`),
    criar: (dados) => requisicao('/pecas', { metodo: 'POST', corpo: dados }),
    atualizar: (id, dados) => requisicao(`/pecas/${id}`, { metodo: 'PUT', corpo: dados }),
    excluir: (id) => requisicao(`/pecas/${id}`, { metodo: 'DELETE' }),
  },
  os: {
    listar: (params) => requisicao(`/os${qs(params)}`),
    buscar: (id) => requisicao(`/os/${id}`),
    criar: (dados) => requisicao('/os', { metodo: 'POST', corpo: dados }),
    atualizar: (id, dados) => requisicao(`/os/${id}`, { metodo: 'PUT', corpo: dados }),
    excluir: (id) => requisicao(`/os/${id}`, { metodo: 'DELETE' }),
    adicionarServico: (id, dados) => requisicao(
      `/os/${id}/servicos`,
      {
        metodo: 'POST',
        corpo: dados
      }
    ),
    removerServico: (id, itemId) => requisicao(
      `/os/${id}/servicos/${itemId}`,
      { metodo: 'DELETE' }
    ),
    adicionarPeca: (id, dados) => requisicao(
      `/os/${id}/pecas`,
      {
        metodo: 'POST',
        corpo: dados
      }
    ),
    removerPeca: (id, itemId) => requisicao(
      `/os/${id}/pecas/${itemId}`,
      { metodo: 'DELETE' }
    ),
    mudarStatus: (id, status) => requisicao(
      `/os/${id}/status`,
      {
        metodo: 'PATCH',
        corpo: { status }
      }
    ),
    adicionarPagamento: (id, dados) => requisicao(
      `/os/${id}/pagamentos`,
      {
        metodo: 'POST',
        corpo: dados
      }
    ),
    removerPagamento: (id, pagamentoId) => requisicao(
      `/os/${id}/pagamentos/${pagamentoId}`,
      { metodo: 'DELETE' }
    ),
  },
  usuarios: {
    mecanicos: () => requisicao('/usuarios/mecanicos'),
  }
};
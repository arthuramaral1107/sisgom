import { api } from '../services/api.js';
import Campo from '../components/Campo.jsx';
import { useEffect, useState } from 'react';
import { detalhesParaObjeto } from '../hooks.js';
import { useNavigate, useParams } from 'react-router-dom';

/* Valores iniciais do formulário */
const VAZIO = {
  nome: '',
  cpf_cnpj: '',
  telefone: '',
  email: '',
  endereco: ''
};

/* Formulário de cadastro e edição de cliente */
export default function ClienteForm() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [dados, setDados] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!id) return;

    api.clientes.buscar(id).then((c) => setDados({
      ...VAZIO,
      ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v ?? '']))
    })).catch((e) => setErroGeral(e.message));
  }, [id]);

  const aoMudar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const aoEnviar = async (e) => {
    e.preventDefault();

    setErros({}); setErroGeral(''); setEnviando(true);

    const corpo = {
      nome: dados.nome, cpf_cnpj: dados.cpf_cnpj, telefone: dados.telefone,
      email: dados.email, endereco: dados.endereco
    };

    try {
      if (id) await api.clientes.atualizar(id, corpo);
      else await api.clientes.criar(corpo);

      navegar('/clientes');
    } catch (error) {
      setErros(detalhesParaObjeto(error.detalhes));
      setErroGeral(error.detalhes.length ? '' : error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <h2>
        {id ? 'Editar cliente' : 'Novo cliente'}
      </h2>

      <form
        className="cartao formulario"
        onSubmit={aoEnviar}
        noValidate
      >
        <div className="grade">
          <Campo
            rotulo="Nome"
            nome="nome"
            valor={dados.nome}
            aoMudar={aoMudar}
            erro={erros.nome}
            obrigatorio placeholder="Nome completo ou razão social"
          />

          <Campo
            rotulo="CPF/CNPJ"
            nome="cpf_cnpj"
            valor={dados.cpf_cnpj}
            aoMudar={aoMudar}
            erro={erros.cpf_cnpj}
            obrigatorio placeholder="000.000.000-00"
          />

          <Campo
            rotulo="Telefone"
            nome="telefone"
            valor={dados.telefone}
            aoMudar={aoMudar}
            erro={erros.telefone}
            placeholder="(00) 00000-0000"
          />

          <Campo
            rotulo="E-mail"
            nome="email"
            valor={dados.email}
            aoMudar={aoMudar}
            erro={erros.email}
            placeholder="email@exemplo.com"
          />

          <div className="larga">
            <Campo
              rotulo="Endereço"
              nome="endereco"
              valor={dados.endereco}
              aoMudar={aoMudar}
              erro={erros.endereco}
              placeholder="Rua, número, bairro"
            />
          </div>
        </div>

        {erroGeral && <div className="alerta erro">
          {erroGeral}
        </div>}

        <div className="botoes">
          <button
            className="btn primario"
            disabled={enviando}
          >
            {enviando ? 'Salvando...' : 'Salvar'}
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => navegar('/clientes')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </>
  );
};
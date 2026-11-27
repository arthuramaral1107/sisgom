import { api } from '../services/api.js';
import { useEffect, useState } from 'react';
import { detalhesParaObjeto } from '../hooks.js';
import { useNavigate, useParams } from 'react-router-dom';
import { Campo, ModalAlerta } from '../components/index.js';

/* Valores iniciais do formulário */
const VAZIO = {
  descricao: '',
  valor_padrao: ''
};

/* Formulário de cadastro e edição de serviço */
export default function ServicoForm() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [dados, setDados] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!id) return;

    api.servicos.buscar(id).then((servico) => setDados({
      descricao: servico.descricao,
      valor_padrao: String(servico.valor_padrao).replace('.', ',')
    })).catch((error) => setErroGeral(error.message));
  }, [id]);

  const aoMudar = (campo, valor) => {
    setDados((atual) => ({
      ...atual,
      [campo]: valor
    }));

    setErros((atual) => ({
      ...atual,
      [campo]: undefined
    }));
  };

  const aoEnviar = async (event) => {
    event.preventDefault();

    setErros({});
    setErroGeral('');
    setEnviando(true);

    try {
      if (id) await api.servicos.atualizar(id, dados);
      else await api.servicos.criar(dados);

      navegar('/servicos');
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
        {id ? 'Editar serviço' : 'Novo serviço'}
      </h2>

      <form
        className="cartao formulario"
        onSubmit={aoEnviar}
        noValidate
      >
        <div className="grade">
          <Campo
            rotulo="Descrição"
            nome="descricao"
            valor={dados.descricao}
            aoMudar={aoMudar}
            erro={erros.descricao}
            obrigatorio
            placeholder="Ex.: Troca de óleo e filtro"
          />

          <Campo
            rotulo="Valor padrão (R$)"
            nome="valor_padrao"
            valor={dados.valor_padrao}
            aoMudar={aoMudar}
            erro={erros.valor_padrao}
            obrigatorio
            placeholder="0,00"
          />
        </div>

        {erroGeral && <ModalAlerta
          mensagem={erroGeral}
          aoFechar={() => setErroGeral('')}
        />}

        <div className="botoes">
          <button
            type="button"
            className="btn"
            onClick={() => navegar('/servicos')}
          >
            Cancelar
          </button>

          <button
            className="btn primario"
            disabled={enviando}
          >
            {enviando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </>
  );
};
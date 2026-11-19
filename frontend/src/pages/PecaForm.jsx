import { api } from '../services/api.js';
import { useEffect, useState } from 'react';
import Campo from '../components/Campo.jsx';
import { detalhesParaObjeto } from '../hooks.js';
import { useNavigate, useParams } from 'react-router-dom';

/* Valores iniciais do formulário */
const VAZIO = {
  codigo: '',
  descricao: '',
  preco_venda: '',
  quantidade_estoque: '0',
  estoque_minimo: '0'
};

/* Formulário de cadastro e edição de peça - também serve para ajustar o estoque */
export default function PecaForm() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [dados, setDados] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!id) return;

    api.pecas.buscar(id).then((peca) => setDados({
      codigo: peca.codigo,
      descricao: peca.descricao,
      preco_venda: String(peca.preco_venda).replace('.', ','),
      quantidade_estoque: String(peca.quantidade_estoque),
      estoque_minimo: String(peca.estoque_minimo)
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
      if (id) await api.pecas.atualizar(id, dados);
      else await api.pecas.criar(dados);

      navegar('/pecas');
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
        {id ? 'Editar peça' : 'Nova peça'}
      </h2>

      <form
        className="cartao formulario"
        onSubmit={aoEnviar}
        noValidate
      >
        <div className="grade">
          <Campo
            rotulo="Código"
            nome="codigo"
            valor={dados.codigo}
            aoMudar={aoMudar}
            erro={erros.codigo}
            obrigatorio
            placeholder="Ex.: FLT-001"
          />

          <Campo
            rotulo="Descrição"
            nome="descricao"
            valor={dados.descricao}
            aoMudar={aoMudar}
            erro={erros.descricao}
            obrigatorio
            placeholder="Ex.: Filtro de óleo"
          />

          <Campo
            rotulo="Preço de venda (R$)"
            nome="preco_venda"
            valor={dados.preco_venda}
            aoMudar={aoMudar}
            erro={erros.preco_venda}
            obrigatorio
            placeholder="0,00"
          />

          <Campo
            rotulo="Quantidade em estoque"
            nome="quantidade_estoque"
            valor={dados.quantidade_estoque}
            aoMudar={aoMudar}
            erro={erros.quantidade_estoque}
            placeholder="0"
          />

          <Campo
            rotulo="Estoque mínimo"
            nome="estoque_minimo"
            valor={dados.estoque_minimo}
            aoMudar={aoMudar}
            erro={erros.estoque_minimo}
            placeholder="0"
          />
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
            onClick={() => navegar('/pecas')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </>
  );
};
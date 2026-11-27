import {
  BuildOutlined,
  DeleteForeverOutlined,
  EditOutlined
} from '../icones.js';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatarMoeda, useDebounce } from '../hooks.js';
import { useCallback, useEffect, useState } from 'react';
import { useAuth, useConfirmar } from '../contexts/index.js';
import { BotaoIcone, Carregando, ModalAlerta, Paginacao } from '../components/index.js';

/* Quantidade de registros por página */
const LIMITE = 10;

/* Lista de serviços do catálogo - com busca e paginação */
export default function ServicosLista() {
  const { pode } = useAuth();
  const confirmar = useConfirmar();
  const [busca, setBusca] = useState('');
  const termo = useDebounce(busca);
  const [pagina, setPagina] = useState(1);

  const [resp, setResp] = useState({
    dados: [],
    total: 0
  });

  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);

    try {
      setResp(await api.servicos.listar({
        busca: termo,
        pagina,
        limite: LIMITE
      }));

      setErro('');
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, [
    termo,
    pagina
  ]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [termo]);

  const excluir = async (servico) => {
    const confirmado = await confirmar(
      `Excluir o serviço "${servico.descricao}"?`,
      { perigo: true }
    );

    if (!confirmado) return;

    try {
      await api.servicos.excluir(servico.id);

      carregar();
    } catch (error) {
      setErro(error.message);
    }
  };

  const podeEditar = pode(
    'ADMIN',
    'ATENDENTE'
  );

  return (
    <>
      <div className="titulo-linha">
        <h2>
          Serviços
        </h2>

        {podeEditar && <Link
          className="btn primario"
          to="/servicos/novo"
        >
          <BuildOutlined
            fontSize="small"
          />

          Novo serviço
        </Link>}
      </div>

      <input
        className="busca"
        placeholder="Buscar por descrição"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
      />

      {erro && <ModalAlerta
        mensagem={erro}
        aoFechar={() => setErro('')}
      />}

      <table className="tabela">
        <thead>
          <tr>
            <th>
              Descrição
            </th>

            <th>
              Valor padrão
            </th>

            <th className="acoes">
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {resp.dados.map((servico) => (
            <tr key={servico.id}>
              <td>
                {servico.descricao}
              </td>

              <td>
                {formatarMoeda(servico.valor_padrao)}
              </td>

              <td className="acoes">
                {podeEditar && <BotaoIcone
                  to={`/servicos/${servico.id}`}
                  icone={EditOutlined}
                  rotulo="Editar"
                />}

                {pode('ADMIN') && <BotaoIcone
                  icone={DeleteForeverOutlined}
                  rotulo="Excluir"
                  perigo
                  onClick={() => excluir(servico)}
                />}
              </td>
            </tr>
          ))}

          {carregando && resp.dados.length === 0 && (
            <tr>
              <td
                colSpan="5"
                className="vazio"
              >
                <Carregando />
              </td>
            </tr>
          )}

          {!carregando && resp.dados.length === 0 && (
            <tr>
              <td
                colSpan="3"
                className="vazio"
              >
                Nenhum serviço encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Paginacao
        pagina={pagina}
        limite={LIMITE}
        total={resp.total}
        aoMudar={setPagina}
      />
    </>
  );
};
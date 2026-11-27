import {
  DeleteForeverOutlined,
  EditOutlined,
  Settings
} from '../icones.js';
import {
  BotaoIcone,
  Carregando,
  ModalAlerta,
  Paginacao,
  SituacaoPonto
} from '../components/index.js';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatarMoeda, useDebounce } from '../hooks.js';
import { useCallback, useEffect, useState } from 'react';
import { useAuth, useConfirmar } from '../contexts/index.js';

/* Quantidade de registros por página */
const LIMITE = 10;

/* Lista de peças em estoque - com busca, filtro de estoque baixo e paginação */
export default function PecasLista() {
  const { pode } = useAuth();
  const confirmar = useConfirmar();
  const [busca, setBusca] = useState('');
  const termo = useDebounce(busca);
  const [apenasBaixo, setApenasBaixo] = useState(false);
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
      setResp(await api.pecas.listar({
        busca: termo,
        baixo: apenasBaixo ? 1 : undefined,
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
    apenasBaixo,
    pagina
  ]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => { setPagina(1); }, [
    termo,
    apenasBaixo
  ]);

  const excluir = async (peca) => {
    const confirmado = await confirmar(
      `Excluir a peça "${peca.descricao}"?`,
      { perigo: true }
    );

    if (!confirmado) return;

    try {
      await api.pecas.excluir(peca.id);

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
          Peças
        </h2>

        {podeEditar && <Link
          className="btn primario"
          to="/pecas/nova"
        >
          <Settings
            fontSize="small"
          />

          Nova peça
        </Link>}
      </div>

      <div className="filtros">
        <input
          className="busca"
          placeholder="Buscar por código ou descrição"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={apenasBaixo}
            onChange={(event) => setApenasBaixo(event.target.checked)}
          />

          Somente estoque baixo
        </label>
      </div>

      {erro && <ModalAlerta
        mensagem={erro}
        aoFechar={() => setErro('')}
      />}

      <table className="tabela">
        <thead>
          <tr>
            <th>
              Código
            </th>

            <th>
              Descrição
            </th>

            <th>
              Preço de venda
            </th>

            <th>
              Estoque
            </th>

            <th>
              Mínimo
            </th>

            <th>
              Situação
            </th>

            <th className="acoes">
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {resp.dados.map((peca) => (
            <tr key={peca.id}>
              <td>
                {peca.codigo}
              </td>

              <td>
                {peca.descricao}
              </td>

              <td>
                {formatarMoeda(peca.preco_venda)}
              </td>

              <td>
                {peca.quantidade_estoque}
              </td>

              <td>
                {peca.estoque_minimo}
              </td>

              <td>
                <SituacaoPonto
                  texto={peca.estoque_baixo ? 'Baixo' : 'OK'}
                  cor={peca.estoque_baixo ? 'vermelho' : 'azul'}
                />
              </td>

              <td className="acoes">
                {podeEditar && <BotaoIcone
                  to={`/pecas/${peca.id}`}
                  icone={EditOutlined}
                  rotulo="Editar"
                />}

                {pode('ADMIN') && <BotaoIcone
                  icone={DeleteForeverOutlined}
                  rotulo="Excluir"
                  perigo
                  onClick={() => excluir(peca)}
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
                colSpan="7"
                className="vazio"
              >
                Nenhuma peça encontrada.
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
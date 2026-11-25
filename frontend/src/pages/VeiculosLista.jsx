import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useDebounce } from '../hooks.js';
import Paginacao from '../components/Paginacao.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import ModalAlerta from '../components/ModalAlerta.jsx';
import { useCallback, useEffect, useState } from 'react';

/* Quantidade de registros por página */
const LIMITE = 10;

/* Lista de veículos - com busca e paginação */
export default function VeiculosLista() {
  const { pode } = useAuth();
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
      setResp(await api.veiculos.listar({
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

  const excluir = async (v) => {
    const confirmado = await confirmar(
      `Excluir o veículo ${v.placa}?`,
      { perigo: true }
    );

    if (!confirmado) return;

    try {
      await api.veiculos.excluir(v.id);

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
          Veículos
        </h2>

        {podeEditar && <Link
          className="btn primario"
          to="/veiculos/novo"
        >
          + Novo veículo
        </Link>}
      </div>

      <input
        className="busca"
        placeholder="Buscar por placa, marca ou modelo"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {erro && <ModalAlerta
        mensagem={erro}
        aoFechar={() => setErro('')}
      />}

      <table className="tabela">
        <thead>
          <tr>
            <th>
              Placa
            </th>

            <th>
              Marca / Modelo
            </th>

            <th>
              Ano
            </th>

            <th>
              Cor
            </th>

            <th>
              Proprietário
            </th>

            <th />
          </tr>
        </thead>

        <tbody>
          {resp.dados.map((v) => (
            <tr key={v.id}>
              <td>
                {v.placa}
              </td>

              <td>
                {v.marca} {v.modelo}
              </td>

              <td>
                {v.ano}
              </td>

              <td>
                {v.cor}
              </td>

              <td>
                {v.cliente_nome}
              </td>

              <td className="acoes">
                <Link to={`/os?veiculo=${v.id}`}>
                  Histórico
                </Link>

                {podeEditar && <Link to={`/veiculos/${v.id}`}>
                  Editar
                </Link>}

                {pode('ADMIN') && <button
                  className="link perigo"
                  onClick={() => excluir(v)}
                >
                  Excluir
                </button>}
              </td>
            </tr>
          ))}

          {!carregando && resp.dados.length === 0 && (
            <tr>
              <td
                colSpan="6"
                className="vazio"
              >
                Nenhum veículo encontrado.
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
import {
  DeleteForeverOutlined,
  EditOutlined,
  PersonAddAltOutlined
} from '../icones.js';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useDebounce } from '../hooks.js';
import { useCallback, useEffect, useState } from 'react';
import { useAuth, useConfirmar } from '../contexts/index.js';
import { BotaoIcone, Carregando, Paginacao, ModalAlerta } from '../components/index.js';

/* Quantidade de registros por página */
const LIMITE = 10;

/* Lista de clientes - com busca e paginação */
export default function ClientesLista() {
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
      setResp(await api.clientes.listar({
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

  const excluir = async (c) => {
    const confirmado = await confirmar(
      `Excluir o cliente "${c.nome}"?`,
      { perigo: true }
    );

    if (!confirmado) return;

    try {
      await api.clientes.excluir(c.id);

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
          Clientes
        </h2>

        {podeEditar && <Link
          className="btn primario"
          to="/clientes/novo"
        >
          <PersonAddAltOutlined
            fontSize="small"
          />

          Novo cliente
        </Link>}
      </div>

      <input
        className="busca"
        placeholder="Buscar por nome ou CPF/CNPJ"
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
              Nome
            </th>

            <th>
              CPF/CNPJ
            </th>

            <th>
              Telefone
            </th>

            <th>
              E-mail
            </th>

            {podeEditar && <th className="acoes">
              Ações
            </th>}
          </tr>
        </thead>

        <tbody>
          {resp.dados.map((c) => (
            <tr key={c.id}>
              <td>
                {c.nome}
              </td>

              <td>
                {c.cpf_cnpj}
              </td>

              <td>
                {c.telefone}
              </td>

              <td>
                {c.email}
              </td>

              {podeEditar && <td className="acoes">
                <BotaoIcone
                  to={`/clientes/${c.id}`}
                  icone={EditOutlined}
                  rotulo="Editar"
                />

                {pode('ADMIN') && <BotaoIcone
                  icone={DeleteForeverOutlined}
                  rotulo="Excluir"
                  perigo
                  onClick={() => excluir(c)}
                />}
              </td>}
            </tr>
          ))}

          {carregando && resp.dados.length === 0 && (
            <tr>
              <td
                colSpan={podeEditar ? 5 : 4}
                className="vazio"
              >
                <Carregando />
              </td>
            </tr>
          )}

          {!carregando && resp.dados.length === 0 && (
            <tr>
              <td
                colSpan={podeEditar ? 5 : 4}
                className="vazio"
              >
                Nenhum cliente encontrado.
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
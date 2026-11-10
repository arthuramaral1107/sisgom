import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useDebounce } from '../hooks.js';
import Paginacao from '../components/Paginacao.jsx';

const LIMITE = 10;

export default function ClientesLista() {
  const { pode } = useAuth();
  const [busca, setBusca] = useState('');
  const termo = useDebounce(busca);
  const [pagina, setPagina] = useState(1);
  const [resp, setResp] = useState({ dados: [], total: 0 });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setResp(await api.clientes.listar({ busca: termo, pagina, limite: LIMITE }));
      setErro('');
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [termo, pagina]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [termo]);

  const excluir = async (c) => {
    if (!window.confirm(`Excluir o cliente "${c.nome}"?`)) return;
    try {
      await api.clientes.excluir(c.id);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  const podeEditar = pode('ADMIN', 'ATENDENTE');

  return (
    <>
      <div className="titulo-linha">
        <h2>Clientes</h2>
        {podeEditar && <Link className="btn primario" to="/clientes/novo">+ Novo cliente</Link>}
      </div>
      <input className="busca" placeholder="Buscar por nome ou CPF/CNPJ" value={busca}
             onChange={(e) => setBusca(e.target.value)} />
      {erro && <div className="alerta erro">{erro}</div>}
      <table className="tabela">
        <thead>
          <tr><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th>E-mail</th><th /></tr>
        </thead>
        <tbody>
          {resp.dados.map((c) => (
            <tr key={c.id}>
              <td>{c.nome}</td><td>{c.cpf_cnpj}</td><td>{c.telefone}</td><td>{c.email}</td>
              <td className="acoes">
                {podeEditar && <Link to={`/clientes/${c.id}`}>Editar</Link>}
                {pode('ADMIN') && <button className="link perigo" onClick={() => excluir(c)}>Excluir</button>}
              </td>
            </tr>
          ))}
          {!carregando && resp.dados.length === 0 && (
            <tr><td colSpan="5" className="vazio">Nenhum cliente encontrado.</td></tr>
          )}
        </tbody>
      </table>
      <Paginacao pagina={pagina} limite={LIMITE} total={resp.total} aoMudar={setPagina} />
    </>
  );
}

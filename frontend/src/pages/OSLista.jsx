import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import StatusOS from '../components/StatusOS.jsx';
import Paginacao from '../components/Paginacao.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCallback, useEffect, useState } from 'react';
import { formatarDataHora, formatarMoeda, useDebounce } from '../hooks.js';

const LIMITE = 10;

/* Lista de ordens de serviço - com busca, filtro por status e paginação */
export default function OSLista() {
    const { pode } = useAuth();
    const [busca, setBusca] = useState('');
    const termo = useDebounce(busca);
    const [status, setStatus] = useState('');
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
            setResp(await api.os.listar({
                busca: termo,
                status,
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
        status,
        pagina
    ]);

    useEffect(() => { carregar(); }, [carregar]);

    useEffect(() => { setPagina(1); }, [
        termo,
        status
    ]);

    return (
        <>
            <div className="titulo-linha">
                <h2>
                    Ordens de Serviço
                </h2>

                {pode('ADMIN', 'ATENDENTE') && <Link
                    className="btn primario"
                    to="/os/nova"
                >
                    + Nova OS
                </Link>}
            </div>

            <div className="filtros">
                <input
                    className="busca"
                    placeholder="Buscar por nº, placa ou cliente"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                />

                <select
                    className="busca"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                >
                    <option value="">
                        Todos os status
                    </option>

                    <option value="aberta">
                        Aberta
                    </option>

                    <option value="em_andamento">
                        Em andamento
                    </option>

                    <option value="finalizada">
                        Finalizada
                    </option>

                    <option value="cancelada">
                        Cancelada
                    </option>
                </select>
            </div>

            {erro && <div className="alerta erro">
                {erro}
            </div>}

            <table className="tabela">
                <thead>
                    <tr>
                        <th>
                            Nº
                        </th>

                        <th>
                            Abertura
                        </th>

                        <th>
                            Cliente
                        </th>

                        <th>
                            Veículo
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Total
                        </th>

                        <th />
                    </tr>
                </thead>

                <tbody>
                    {resp.dados.map((os) => (
                        <tr key={os.id}>
                            <td>
                                #{os.id}
                            </td>

                            <td>
                                {formatarDataHora(os.data_abertura)}
                            </td>

                            <td>
                                {os.cliente_nome}
                            </td>

                            <td>
                                {os.placa} - {os.marca} {os.modelo}
                            </td>

                            <td>
                                <StatusOS
                                    status={os.status}
                                />
                            </td>

                            <td>
                                {formatarMoeda(os.valor_total)}
                            </td>

                            <td className="acoes">
                                <Link to={`/os/${os.id}`}>
                                    Abrir
                                </Link>
                            </td>
                        </tr>
                    ))}

                    {!carregando && resp.dados.length === 0 && (
                        <tr>
                            <td
                                colSpan="7"
                                className="vazio"
                            >
                                Nenhuma ordem de serviço encontrada.
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
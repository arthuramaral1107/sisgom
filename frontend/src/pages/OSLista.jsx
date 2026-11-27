import {
    AssignmentAdd,
    LaunchRounded,
    VisibilityOutlined
} from '../icones.js';
import {
    BotaoIcone,
    Carregando,
    ModalAlerta,
    PagamentoOS,
    Paginacao,
    StatusOS
} from '../components/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/index.js';
import { Link, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { formatarDataHora, formatarMoeda, useDebounce } from '../hooks.js';

/* Quantidade de registros por página */
const LIMITE = 10;

/* Lista de ordens de serviço - com busca, filtro por status e paginação */
export default function OSLista() {
    const { pode } = useAuth();
    const [parametros, setParametros] = useSearchParams();
    const veiculoId = parametros.get('veiculo') || '';
    const [veiculo, setVeiculo] = useState(null);
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
                veiculo_id: veiculoId,
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
        veiculoId,
        pagina
    ]);

    useEffect(() => { carregar(); }, [carregar]);

    useEffect(() => { setPagina(1); }, [
        termo,
        status,
        veiculoId
    ]);

    useEffect(() => {
        if (!veiculoId) {
            setVeiculo(null);

            return;
        }

        api.veiculos.buscar(veiculoId)
            .then(setVeiculo)
            .catch(() => setVeiculo(null));
    }, [veiculoId]);

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
                    <AssignmentAdd
                        fontSize="small"
                    />

                    Nova OS
                </Link>}
            </div>

            {veiculoId && <div className="alerta info">
                <span>
                    Histórico do veículo {veiculo
                        ? `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`
                        : `#${veiculoId}`}
                </span>

                <button
                    className="btn contorno"
                    onClick={() => setParametros({})}
                >
                    <VisibilityOutlined
                        fontSize="small"
                    />

                    Ver todas as OSs
                </button>
            </div>}

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

            {erro && <ModalAlerta
                mensagem={erro}
                aoFechar={() => setErro('')}
            />}

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
                            Status
                        </th>

                        <th>
                            Cliente
                        </th>

                        <th>
                            Veículo
                        </th>

                        <th>
                            Total
                        </th>

                        <th>
                            Pagamento
                        </th>

                        <th className="acoes">
                            Ações
                        </th>
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
                                <StatusOS
                                    status={os.status}
                                />
                            </td>

                            <td>
                                {os.cliente_nome}
                            </td>

                            <td>
                                {os.placa} - {os.marca} {os.modelo}
                            </td>

                            <td>
                                {formatarMoeda(os.valor_total)}
                            </td>

                            <td>
                                <PagamentoOS
                                    situacao={os.situacao_pagamento}
                                />
                            </td>

                            <td className="acoes">
                                <BotaoIcone
                                    to={`/os/${os.id}`}
                                    icone={LaunchRounded}
                                    rotulo="Abrir"
                                />
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
                                colSpan="8"
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
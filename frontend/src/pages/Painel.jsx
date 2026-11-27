import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useEffect, useState } from 'react';
import { LaunchRounded } from '../icones.js';
import { formatarDataHora, formatarMoeda } from '../hooks.js';
import { BotaoIcone, Carregando, ModalAlerta, StatusOS } from '../components/index.js';

/* Status exibidos nas barras, na ordem do fluxo da OS */
const STATUS = [
    {
        chave: 'aberta',
        rotulo: 'Abertas'
    },
    {
        chave: 'em_andamento',
        rotulo: 'Em andamento'
    },
    {
        chave: 'finalizada',
        rotulo: 'Finalizadas'
    },
    {
        chave: 'cancelada',
        rotulo: 'Canceladas'
    }
];

/* Cartão com um número em destaque */
function Indicador({
    rotulo,
    valor
}) {
    return (
        <div className="indicador">
            <span>
                {rotulo}
            </span>

            <strong>
                {valor}
            </strong>
        </div>
    );
};

/* Painel inicial - OS por status, financeiro, estoque baixo e últimas OS */
export default function Painel() {
    const [painel, setPainel] = useState(null);
    const [erro, setErro] = useState('');

    useEffect(() => {
        api.painel()
            .then(setPainel)
            .catch((error) => setErro(error.message));
    }, []);

    if (erro) {
        return (
            <ModalAlerta
                mensagem={erro}
                aoFechar={() => setErro('')}
            />
        );
    }

    if (!painel) {
        return <Carregando />;
    }

    const {
        financeiro,
        ultimas_os: ultimas,
        os_por_status: contagem,
        pecas_estoque_baixo: pecas
    } = painel;

    const maior = Math.max(1, ...Object.values(contagem));
    const totalOS = Object.values(contagem).reduce((soma, n) => soma + n, 0);

    return (
        <>
            <h2>
                Painel
            </h2>

            {financeiro && (
                <div className="indicadores">
                    <Indicador
                        rotulo="A receber"
                        valor={formatarMoeda(financeiro.a_receber)}
                    />

                    <Indicador
                        rotulo="Faturado no mês"
                        valor={formatarMoeda(financeiro.faturado_mes)}
                    />

                    <Indicador
                        rotulo="Recebido no mês"
                        valor={formatarMoeda(financeiro.recebido_mes)}
                    />
                </div>
            )}

            <div className="painel-colunas">
                <section className="cartao">
                    <h3>
                        Ordens de serviço ({totalOS})
                    </h3>

                    <ul className="barras">
                        {STATUS.map(({ chave, rotulo }) => (
                            <li key={chave}>
                                <span>
                                    {rotulo}
                                </span>

                                <div className="barra-trilho">
                                    <div
                                        className="barra-preench"
                                        style={{ width: `${(contagem[chave] / maior) * 100}%` }}
                                    />
                                </div>

                                <strong>
                                    {contagem[chave]}
                                </strong>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="cartao">
                    <h3>
                        Estoque baixo ({pecas.total})
                    </h3>

                    {pecas.total === 0 ? (
                        <p className="texto-fraco">
                            Nenhuma peça com estoque baixo.
                        </p>
                    ) : (
                        <ul className="lista-simples">
                            {pecas.itens.map((peca) => (
                                <li key={peca.id}>
                                    <span>
                                        {peca.codigo} - {peca.descricao}
                                    </span>

                                    <span className="texto-fraco">
                                        {peca.quantidade_estoque} un. (mín. {peca.estoque_minimo})
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Link
                        className="link-card"
                        to="/pecas"
                    >
                        Ver todas as peças
                    </Link>
                </section>
            </div>

            <div className="titulo-linha">
                <h3 className="titulo-secao">
                    Últimas OS
                </h3>

                <Link
                    className="link-card"
                    to="/os"
                >
                    Ver todas as OSs
                </Link>
            </div>

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

                        <th className="acoes">
                            Ações
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {ultimas.map((os) => (
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
                                {os.placa} - {os.modelo}
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
                                <BotaoIcone
                                    to={`/os/${os.id}`}
                                    icone={LaunchRounded}
                                    rotulo="Abrir"
                                />
                            </td>
                        </tr>
                    ))}

                    {ultimas.length === 0 && (
                        <tr>
                            <td
                                colSpan="7"
                                className="vazio"
                            >
                                Nenhuma ordem de serviço cadastrada.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );
};
import { api } from '../services/api.js';
import Campo from '../components/Campo.jsx';
import { useEffect, useState } from 'react';
import StatusOS from '../components/StatusOS.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import ModalAlerta from '../components/ModalAlerta.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { formatarDataHora, formatarMoeda } from '../hooks.js';

/* Valores iniciais do formulário de serviço da OS */
const NOVO_SERVICO = {
    servico_id: '',
    quantidade: '1',
    valor_unitario: ''
};

/* Valores iniciais do formulário de peça da OS */
const NOVA_PECA = {
    peca_id: '',
    quantidade: '1'
};

/* Valores iniciais do formulário de pagamento da OS */
const NOVO_PAGAMENTO = {
    forma_pagamento: '',
    valor: ''
};

/* Texto exibido para cada forma de pagamento */
const FORMAS_PAGAMENTO = {
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    cartao_debito: 'Cartão de débito',
    cartao_credito: 'Cartão de crédito'
};

/* Texto exibido para a situação do pagamento da OS */
const SITUACOES_PAGAMENTO = {
    pendente: 'Pendente',
    parcial: 'Parcial',
    pago: 'Pago'
};

/* Converte texto de campo em número - vazio vira null */
const numero = (valor) => (valor === '' ? null : Number(valor));

/* Detalhe da ordem de serviço - itens, total e andamento */
export default function OSDetalhe() {
    const { id } = useParams();
    const navegar = useNavigate();

    const voltar = () => {
        // sem histórico (acesso direto pela URL), cai na lista
        if (window.history.state?.idx > 0) navegar(-1);
        else navegar('/os');
    };

    const { pode } = useAuth();
    const [os, setOs] = useState(null);
    const [servicos, setServicos] = useState([]);
    const [pecas, setPecas] = useState([]);
    const [mecanicos, setMecanicos] = useState([]);

    const [edicao, setEdicao] = useState({
        defeito_relatado: '',
        mecanico_id: ''
    });

    const [novoServico, setNovoServico] = useState(NOVO_SERVICO);
    const [novaPeca, setNovaPeca] = useState(NOVA_PECA);
    const [novoPagamento, setNovoPagamento] = useState(NOVO_PAGAMENTO);
    const [erro, setErro] = useState('');
    const [detalhes, setDetalhes] = useState([]);
    const [ocupado, setOcupado] = useState(false);

    /* Atualiza a tela com a OS devolvida pela API */
    const aplicar = (resposta) => {
        setOs(resposta);

        setEdicao({
            defeito_relatado: resposta.defeito_relatado,
            mecanico_id: resposta.mecanico_id ?? ''
        });
    };

    useEffect(() => {
        Promise.all([
            api.os.buscar(id),
            api.servicos.listar({ limite: 200 }),
            api.pecas.listar({ limite: 200 }),
            api.usuarios.mecanicos()
        ]).then(([
            osResp,
            servicosResp,
            pecasResp,
            mecanicosResp
        ]) => {
            aplicar(osResp);
            setServicos(servicosResp.dados);
            setPecas(pecasResp.dados);
            setMecanicos(mecanicosResp);
        }).catch((error) => setErro(error.message));
    }, [id]);

    /* Executa uma ação na API - trata erros num só lugar e devolve true se deu certo */
    const executar = async (acao) => {
        setErro('');
        setDetalhes([]);
        setOcupado(true);

        try {
            const resposta = await acao();

            if (resposta) aplicar(resposta);

            return true;
        } catch (error) {
            setErro(error.message);
            setDetalhes(error.detalhes ?? []);

            return false;
        } finally {
            setOcupado(false);
        }
    };

    const salvarCabecalho = (event) => {
        event.preventDefault();

        executar(() => api.os.atualizar(id, {
            defeito_relatado: edicao.defeito_relatado,
            mecanico_id: numero(edicao.mecanico_id)
        }));
    };

    const adicionarServico = async (event) => {
        event.preventDefault();

        const ok = await executar(() => api.os.adicionarServico(id, {
            servico_id: numero(novoServico.servico_id),
            quantidade: numero(novoServico.quantidade),
            valor_unitario: novoServico.valor_unitario
        }));

        if (ok) setNovoServico(NOVO_SERVICO);
    };

    const removerServico = (item) => executar(() => api.os.removerServico(id, item.id));

    const adicionarPeca = async (event) => {
        event.preventDefault();

        const ok = await executar(() => api.os.adicionarPeca(id, {
            peca_id: numero(novaPeca.peca_id),
            quantidade: numero(novaPeca.quantidade)
        }));

        if (ok) setNovaPeca(NOVA_PECA);
    };

    const removerPeca = (item) => executar(() => api.os.removerPeca(id, item.id));

    const registrarPagamento = async (event) => {
        event.preventDefault();

        const ok = await executar(() => api.os.adicionarPagamento(id, {
            forma_pagamento: novoPagamento.forma_pagamento,
            valor: novoPagamento.valor
        }));

        if (ok) setNovoPagamento(NOVO_PAGAMENTO);
    };

    const estornarPagamento = async (pagamento) => {
        const confirmado = await confirmar(
            `Estornar o pagamento de ${formatarMoeda(pagamento.valor)} (${FORMAS_PAGAMENTO[pagamento.forma_pagamento]})?`,
            { perigo: true }
        );

        if (!confirmado) return;

        executar(() => api.os.removerPagamento(id, pagamento.id));
    };

    const mudarStatus = async (status, pergunta, opcoes) => {
        if (pergunta && !(await confirmar(pergunta, opcoes))) return;

        executar(() => api.os.mudarStatus(id, status));
    };

    const excluir = async () => {
        const confirmado = await confirmar(
            `Excluir a OS #${os.id}?`,
            { perigo: true }
        );

        if (!confirmado) return;

        const ok = await executar(async () => {
            await api.os.excluir(id);

            return null;
        });

        if (ok) navegar('/os');
    };

    /* Fecha o aviso de erro */
    const fecharErro = () => {
        setErro('');
        setDetalhes([]);
    };

    if (!os) {
        return erro ? <div className="alerta erro">
            {erro}
        </div> : <div className="carregando">
            Carregando...
        </div>;
    }

    const editavel = [
        'aberta',
        'em_andamento'
    ].includes(os.status);

    const podeEditarCabecalho = editavel && pode(
        'ADMIN',
        'ATENDENTE'
    );

    const podeCancelar = editavel && pode(
        'ADMIN',
        'ATENDENTE'
    );

    const podeExcluir = pode('ADMIN') && [
        'aberta',
        'cancelada'
    ].includes(os.status);

    const finalizada = os.status === 'finalizada';

    const podeReceber = finalizada && os.saldo > 0 && pode(
        'ADMIN',
        'ATENDENTE'
    );

    const podeEstornar = finalizada && pode('ADMIN');

    return (
        <>
            <div className="titulo-linha">
                <h2>
                    OS #{os.id} <StatusOS status={os.status} />
                </h2>

                <button
                    className="btn"
                    onClick={voltar}
                >
                    Voltar
                </button>
            </div>

            {erro && (
                <ModalAlerta
                    mensagem={erro}
                    detalhes={detalhes}
                    aoFechar={fecharErro}
                />
            )}

            <section className="cartao">
                <dl className="resumo">
                    <div>
                        <dt>
                            Cliente
                        </dt>

                        <dd>
                            {os.cliente_nome}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Veículo
                        </dt>

                        <dd>
                            {os.placa} - {os.marca} {os.modelo}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Atendente
                        </dt>

                        <dd>
                            {os.atendente_nome}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Mecânico
                        </dt>

                        <dd>
                            {os.mecanico_nome ?? 'Não definido'}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Abertura
                        </dt>

                        <dd>
                            {formatarDataHora(os.data_abertura)}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            Fechamento
                        </dt>

                        <dd>
                            {formatarDataHora(os.data_fechamento) || '-'}
                        </dd>
                    </div>
                </dl>

                {podeEditarCabecalho ? (
                    <form
                        onSubmit={salvarCabecalho}
                        noValidate
                    >
                        <div className="grade">
                            <Campo rotulo="Mecânico responsável">
                                <select
                                    value={edicao.mecanico_id}
                                    onChange={(event) => setEdicao({
                                        ...edicao,
                                        mecanico_id: event.target.value
                                    })}
                                >
                                    <option value="">
                                        Não definido
                                    </option>

                                    {mecanicos.map((mecanico) => (
                                        <option key={mecanico.id} value={mecanico.id}>
                                            {mecanico.nome}
                                        </option>
                                    ))}
                                </select>
                            </Campo>

                            <div className="larga">
                                <Campo rotulo="Defeito relatado">
                                    <textarea
                                        value={edicao.defeito_relatado}
                                        onChange={(event) => setEdicao({
                                            ...edicao,
                                            defeito_relatado: event.target.value
                                        })}
                                        maxLength={500}
                                    />
                                </Campo>
                            </div>
                        </div>

                        <div className="botoes">
                            <button
                                className="btn"
                                disabled={ocupado}
                            >
                                Salvar alterações
                            </button>
                        </div>
                    </form>
                ) : (
                    <p>
                        <strong>Defeito relatado:</strong> {os.defeito_relatado}
                    </p>
                )}
            </section>

            <section className="cartao">
                <h3>
                    Serviços
                </h3>

                <table className="tabela">
                    <thead>
                        <tr>
                            <th>
                                Descrição
                            </th>

                            <th>
                                Qtd
                            </th>

                            <th>
                                Valor unit.
                            </th>

                            <th>
                                Subtotal
                            </th>

                            {editavel && <th />}
                        </tr>
                    </thead>

                    <tbody>
                        {os.servicos.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    {item.descricao}
                                </td>

                                <td>
                                    {item.quantidade}
                                </td>

                                <td>
                                    {formatarMoeda(item.valor_unitario)}
                                </td>

                                <td>
                                    {formatarMoeda(item.subtotal)}
                                </td>

                                {editavel && (
                                    <td className="acoes">
                                        <button
                                            className="link perigo"
                                            disabled={ocupado}
                                            onClick={() => removerServico(item)}
                                        >
                                            Remover
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}

                        {os.servicos.length === 0 && (
                            <tr>
                                <td colSpan={editavel ? 5 : 4} className="vazio">
                                    Nenhum serviço adicionado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {editavel && (
                    <form
                        className="item-add"
                        onSubmit={adicionarServico}
                        noValidate
                    >
                        <Campo rotulo="Serviço">
                            <select
                                value={novoServico.servico_id}
                                onChange={(event) => setNovoServico({
                                    ...novoServico,
                                    servico_id: event.target.value
                                })}
                            >
                                <option value="">
                                    Selecione
                                </option>

                                {servicos.map((servico) => (
                                    <option
                                        key={servico.id}
                                        value={servico.id}
                                    >
                                        {servico.descricao} - {formatarMoeda(servico.valor_padrao)}
                                    </option>
                                ))}
                            </select>
                        </Campo>

                        <Campo
                            rotulo="Quantidade"
                            nome="quantidade"
                            type="number"
                            valor={novoServico.quantidade}
                            aoMudar={(campo, valor) => setNovoServico({
                                ...novoServico,
                                quantidade: valor
                            })}
                        />

                        <Campo
                            rotulo="Valor (opcional)"
                            nome="valor_unitario"
                            valor={novoServico.valor_unitario}
                            aoMudar={(campo, valor) => setNovoServico({
                                ...novoServico,
                                valor_unitario: valor
                            })}
                            placeholder="Padrão do serviço"
                        />

                        <button
                            className="btn"
                            disabled={ocupado}
                        >
                            + Adicionar
                        </button>
                    </form>
                )}
            </section>

            <section className="cartao">
                <h3>
                    Peças
                </h3>

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
                                Qtd
                            </th>

                            <th>
                                Valor unit.
                            </th>

                            <th>
                                Subtotal
                            </th>

                            <th>
                                Em estoque
                            </th>

                            {editavel && <th />}
                        </tr>
                    </thead>

                    <tbody>
                        {os.pecas.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    {item.codigo}
                                </td>

                                <td>
                                    {item.descricao}
                                </td>

                                <td>
                                    {item.quantidade}
                                </td>

                                <td>
                                    {formatarMoeda(item.valor_unitario)}
                                </td>

                                <td>
                                    {formatarMoeda(item.subtotal)}
                                </td>

                                <td>
                                    {item.quantidade_estoque}
                                </td>

                                {editavel && (
                                    <td className="acoes">
                                        <button
                                            className="link perigo"
                                            disabled={ocupado}
                                            onClick={() => removerPeca(item)}
                                        >
                                            Remover
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}

                        {os.pecas.length === 0 && (
                            <tr>
                                <td
                                    colSpan={editavel ? 7 : 6}
                                    className="vazio"
                                >Nenhuma peça adicionada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {editavel && (
                    <form
                        className="item-add"
                        onSubmit={adicionarPeca}
                        noValidate
                    >
                        <Campo rotulo="Peça">
                            <select
                                value={novaPeca.peca_id}
                                onChange={(event) => setNovaPeca({
                                    ...novaPeca,
                                    peca_id: event.target.value
                                })}
                            >
                                <option value="">
                                    Selecione
                                </option>

                                {pecas.map((peca) => (
                                    <option
                                        key={peca.id}
                                        value={peca.id}
                                    >
                                        {peca.codigo} - {peca.descricao} (estoque {peca.quantidade_estoque})
                                    </option>
                                ))}
                            </select>
                        </Campo>

                        <Campo
                            rotulo="Quantidade"
                            nome="quantidade"
                            type="number"
                            valor={novaPeca.quantidade}
                            aoMudar={(campo, valor) => setNovaPeca({
                                ...novaPeca,
                                quantidade: valor
                            })}
                        />

                        <div />

                        <button
                            className="btn"
                            disabled={ocupado}
                        >
                            + Adicionar
                        </button>
                    </form>
                )}

                <div className="total-os">
                    Total: {formatarMoeda(os.valor_total)}
                </div>
            </section>

            {finalizada && (
                <section className="cartao">
                    <h3>
                        Pagamentos <span className={`etiqueta pagamento-${os.situacao_pagamento}`}>
                            {SITUACOES_PAGAMENTO[os.situacao_pagamento]}
                        </span>
                    </h3>

                    <dl className="resumo">
                        <div>
                            <dt>
                                Total da OS
                            </dt>

                            <dd>
                                {formatarMoeda(os.valor_total)}
                            </dd>
                        </div>

                        <div>
                            <dt>
                                Total pago
                            </dt>

                            <dd>
                                {formatarMoeda(os.total_pago)}
                            </dd>
                        </div>

                        <div>
                            <dt>
                                Saldo a pagar
                            </dt>

                            <dd>
                                {formatarMoeda(os.saldo)}
                            </dd>
                        </div>
                    </dl>

                    <table className="tabela">
                        <thead>
                            <tr>
                                <th>
                                    Data
                                </th>

                                <th>
                                    Forma
                                </th>

                                <th>
                                    Valor
                                </th>

                                {podeEstornar && <th />}
                            </tr>
                        </thead>

                        <tbody>
                            {os.pagamentos.map((pagamento) => (
                                <tr key={pagamento.id}>
                                    <td>
                                        {formatarDataHora(pagamento.data_pagamento)}
                                    </td>

                                    <td>
                                        {FORMAS_PAGAMENTO[pagamento.forma_pagamento]}
                                    </td>

                                    <td>
                                        {formatarMoeda(pagamento.valor)}
                                    </td>

                                    {podeEstornar && (
                                        <td className="acoes">
                                            <button
                                                className="link perigo"
                                                disabled={ocupado}
                                                onClick={() => estornarPagamento(pagamento)}
                                            >
                                                Estornar
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}

                            {os.pagamentos.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={podeEstornar ? 4 : 3}
                                        className="vazio"
                                    >
                                        Nenhum pagamento registrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {podeReceber && (
                        <form
                            className="item-add"
                            onSubmit={registrarPagamento}
                            noValidate
                        >
                            <Campo rotulo="Forma de pagamento">
                                <select
                                    value={novoPagamento.forma_pagamento}
                                    onChange={(event) => setNovoPagamento({
                                        ...novoPagamento,
                                        forma_pagamento: event.target.value
                                    })}
                                >
                                    <option value="">
                                        Selecione
                                    </option>

                                    {Object.entries(FORMAS_PAGAMENTO).map(([valor, rotulo]) => (
                                        <option
                                            key={valor}
                                            value={valor}
                                        >
                                            {rotulo}
                                        </option>
                                    ))}
                                </select>
                            </Campo>

                            <Campo
                                rotulo="Valor"
                                nome="valor"
                                valor={novoPagamento.valor}
                                aoMudar={(campo, valor) => setNovoPagamento({
                                    ...novoPagamento,
                                    valor
                                })}
                                placeholder={String(os.saldo).replace('.', ',')}
                            />

                            <div />

                            <button
                                className="btn primario"
                                disabled={ocupado}
                            >
                                Registrar
                            </button>
                        </form>
                    )}
                </section>
            )}

            <section className="cartao">
                <h3>
                    Andamento
                </h3>

                <div className="barra-acoes">
                    {os.status === 'aberta' && (
                        <button
                            className="btn primario"
                            disabled={ocupado}
                            onClick={() => mudarStatus('em_andamento')}
                        >
                            Iniciar atendimento
                        </button>
                    )}

                    {os.status === 'em_andamento' && (
                        <button
                            className="btn primario"
                            disabled={ocupado}
                            onClick={() => mudarStatus(
                                'finalizada',
                                'Finalizar a OS? As peças serão baixadas do estoque.'
                            )}
                        >
                            Finalizar OS
                        </button>
                    )}

                    {podeCancelar && (
                        <button
                            className="btn perigo"
                            disabled={ocupado}
                            onClick={() => mudarStatus(
                                'cancelada',
                                'Cancelar esta OS?',
                                { perigo: true }
                            )}
                        >
                            Cancelar OS
                        </button>
                    )}

                    {podeExcluir && (
                        <button
                            className="btn perigo"
                            disabled={ocupado}
                            onClick={excluir}
                        >
                            Excluir OS
                        </button>
                    )}

                    {!editavel && <span>
                        Esta OS está encerrada e não pode mais ser alterada.
                    </span>}
                </div>
            </section>
        </>
    );
};
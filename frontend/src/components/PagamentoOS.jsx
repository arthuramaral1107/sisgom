import SituacaoPonto from './SituacaoPonto.jsx';

/* Texto e cor exibidos para cada situação de pagamento */
const SITUACOES = {
    pendente: {
        texto: 'Pendente',
        cor: 'vermelho'
    },
    parcial: {
        texto: 'Parcial',
        cor: 'amarelo'
    },
    pago: {
        texto: 'Pago',
        cor: 'verde'
    }
};

/* Situação do pagamento da OS - só existe em OS finalizada */
export default function PagamentoOS({ situacao }) {
    if (!situacao) return <span className="texto-fraco">—</span>;

    return (
        <SituacaoPonto
            texto={SITUACOES[situacao].texto}
            cor={SITUACOES[situacao].cor}
        />
    );
};
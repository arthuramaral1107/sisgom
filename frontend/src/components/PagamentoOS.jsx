/* Texto exibido para cada situação de pagamento */
const ROTULOS = {
    pendente: 'Pendente',
    parcial: 'Parcial',
    pago: 'Pago'
};

/* Etiqueta colorida com a situação do pagamento - só existe em OS finalizada */
export default function PagamentoOS({ situacao }) {
    if (!situacao) return <span className="texto-fraco">—</span>;

    return (
        <span className={`etiqueta pagamento-${situacao}`}>
            {ROTULOS[situacao] ?? situacao}
        </span>
    );
};
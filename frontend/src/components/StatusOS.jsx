/* Texto exibido para cada status da OS */
const ROTULOS = {
    aberta: 'Aberta',
    em_andamento: 'Em andamento',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada'
};

/* Etiqueta colorida com o status da ordem de serviço */
export default function StatusOS({ status }) {
    return (
        <span className={`etiqueta status-${status}`}>
            {ROTULOS[status] ?? status}
        </span>
    );
};
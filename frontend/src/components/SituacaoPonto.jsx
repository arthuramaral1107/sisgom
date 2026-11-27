/* Situação em texto simples com uma bolinha colorida (azul, verde, amarelo ou vermelho) */
export default function SituacaoPonto({
    texto,
    cor
}) {
    return (
        <span className={`situacao-ponto ${cor}`}>
            {texto}
        </span>
    );
};
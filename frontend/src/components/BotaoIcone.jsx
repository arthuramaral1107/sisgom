import { Link } from 'react-router-dom';

/* Botão só com ícone - vira link quando recebe "to" */
export default function BotaoIcone({
    to,
    rotulo,
    perigo,
    icone: Icone,
    ...resto
}) {
    const classe = `botao-icone ${perigo ? 'perigo' : ''}`;

    if (to) {
        return (
            <Link
                to={to}
                className={classe}
                title={rotulo}
                aria-label={rotulo}
            >
                <Icone
                    fontSize="small"
                />
            </Link>
        );
    }

    return (
        <button
            type="button"
            className={classe}
            title={rotulo}
            aria-label={rotulo}
            {...resto}
        >
            <Icone
                fontSize="small"
            />
        </button>
    );
};
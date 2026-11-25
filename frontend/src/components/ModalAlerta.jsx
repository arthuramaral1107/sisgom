import { useEffect } from 'react';

/* Janela central de aviso - mostra a mensagem de erro e os detalhes por campo */
export default function ModalAlerta({
    mensagem,
    detalhes = [],
    aoFechar
}) {
    useEffect(() => {
        const aoTeclar = (event) => {
            if (event.key === 'Escape') aoFechar();
        };

        window.addEventListener('keydown', aoTeclar);

        return () => window.removeEventListener('keydown', aoTeclar);
    }, [aoFechar]);

    return (
        <div
            className="modal-fundo"
            onClick={aoFechar}
        >
            <div
                className="modal"
                role="alertdialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
            >
                <h3>
                    Atenção
                </h3>

                <p>
                    {mensagem}
                </p>

                {detalhes.length > 0 && (
                    <ul>
                        {detalhes.map((detalhe, indice) => <li key={indice}>
                            {detalhe.mensagem}
                        </li>)}
                    </ul>
                )}

                <div className="botoes">
                    <button
                        className="btn primario"
                        onClick={aoFechar}
                        autoFocus
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
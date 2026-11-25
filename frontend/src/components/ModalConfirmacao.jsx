import { useEffect } from 'react';

/* Janela central de confirmação - no lugar do confirm padrão do navegador */
export default function ModalConfirmacao({
    mensagem,
    perigo = false,
    aoResponder
}) {
    useEffect(() => {
        const aoTeclar = (event) => {
            if (event.key === 'Escape') aoResponder(false);
        };

        window.addEventListener('keydown', aoTeclar);

        return () => window.removeEventListener('keydown', aoTeclar);
    }, [aoResponder]);

    return (
        <div
            className="modal-fundo"
            onClick={() => aoResponder(false)}
        >
            <div
                className={`modal confirmacao ${perigo ? 'perigo' : ''}`}
                role="alertdialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
            >
                <h3>
                    Confirmação
                </h3>

                <p>
                    {mensagem}
                </p>

                <div className="botoes">
                    <button
                        className="btn"
                        onClick={() => aoResponder(false)}
                        autoFocus={perigo}
                    >
                        Cancelar
                    </button>

                    <button
                        className={`btn ${perigo ? 'perigo' : 'primario'}`}
                        onClick={() => aoResponder(true)}
                        autoFocus={!perigo}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};
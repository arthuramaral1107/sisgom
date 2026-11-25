import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState
} from 'react';
import ModalConfirmacao from '../components/ModalConfirmacao.jsx';

/* Contexto com a função que abre a janela de confirmação */
const ConfirmacaoContext = createContext(null);

/* Provedor de confirmação - guarda a pergunta aberta e devolve a resposta por Promise */
export function ConfirmacaoProvider({ children }) {
    const [pergunta, setPergunta] = useState(null);
    const resolver = useRef(null);

    const confirmar = useCallback((
        mensagem,
        { perigo = false } = {}
    ) => new Promise((resolve) => {
        resolver.current = resolve;

        setPergunta({
            mensagem,
            perigo
        });
    }), []);

    const responder = useCallback((resposta) => {
        resolver.current?.(resposta);
        resolver.current = null;

        setPergunta(null);
    }, []);

    return <ConfirmacaoContext.Provider value={confirmar}>
        {children}

        {pergunta && <ModalConfirmacao
            mensagem={pergunta.mensagem}
            perigo={pergunta.perigo}
            aoResponder={responder}
        />}
    </ConfirmacaoContext.Provider>;
};

/* Hook que devolve confirmar(mensagem, { perigo }) - resolve true ou false */
export const useConfirmar = () => useContext(ConfirmacaoContext);
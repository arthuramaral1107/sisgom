import { ROTULOS_PERFIL } from '../hooks.js';
import { useAuth } from '../contexts/index.js';
import { Link, useLocation } from 'react-router-dom';

/* Tela exibida quando o perfil do usuário não tem acesso à rota */
export default function SemPermissao() {
    const { usuario } = useAuth();
    const { pathname } = useLocation();

    return (
        <section className="cartao sem-permissao">
            <h2>
                Acesso negado
            </h2>

            <p>
                O perfil <strong>{ROTULOS_PERFIL[usuario.perfil]}</strong> não tem permissão para acessar esta tela.
            </p>

            <p>
                <code>{pathname}</code>
            </p>

            <Link
                className="btn primario"
                to="/painel"
            >
                Voltar ao início
            </Link>
        </section>
    );
};
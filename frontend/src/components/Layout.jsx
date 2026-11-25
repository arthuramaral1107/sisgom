import { useAuth } from '../contexts/AuthContext.jsx';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

/* Estrutura das telas - menu lateral, cabeçalho com o usuário e área de conteúdo */
export default function Layout() {
  const { usuario, sair, pode } = useAuth();
  const navegar = useNavigate();

  const aoSair = () => {
    sair();
    navegar('/login');
  };

  return (
    <div className="app">
      <aside className="menu">
        <div className="marca">
          <strong>
            SISGOM
          </strong>

          <small>
            Gestão de Oficinas
          </small>
        </div>

        <nav>
          <NavLink to="/clientes">
            Clientes
          </NavLink>

          <NavLink to="/veiculos">
            Veículos
          </NavLink>

          <NavLink to="/os">
            Ordens de Serviço
          </NavLink>

          <NavLink to="/servicos">
            Serviços
          </NavLink>

          <NavLink to="/pecas">
            Peças
          </NavLink>

          {pode('ADMIN') && <NavLink to="/usuarios">
            Usuários
          </NavLink>}
        </nav>

        <button
          className="link-sair"
          onClick={aoSair}
        >
          Sair
        </button>
      </aside>

      <div className="conteudo">
        <header className="topo">
          <span>
            {usuario.nome} <em>({usuario.perfil})</em>
          </span>
        </header>

        <main className="pagina">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
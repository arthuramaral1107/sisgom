import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Layout() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();

  const aoSair = () => {
    sair();
    navegar('/login');
  };

  return (
    <div className="app">
      <aside className="menu">
        <div className="marca">
          <strong>SISGOM</strong>
          <small>Gestão de Oficinas</small>
        </div>
        <nav>
          <NavLink to="/clientes">Clientes</NavLink>
          <NavLink to="/veiculos">Veículos</NavLink>
          <span className="em-breve">Ordens de Serviço</span>
          <span className="em-breve">Peças e Serviços</span>
        </nav>
        <button className="link-sair" onClick={aoSair}>Sair</button>
      </aside>
      <div className="conteudo">
        <header className="topo">
          <span>{usuario.nome} <em>({usuario.perfil})</em></span>
        </header>
        <main className="pagina">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

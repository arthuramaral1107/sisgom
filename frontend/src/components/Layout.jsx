import logo from '../assets/logo-sisgom.svg';
import { useAuth } from '../contexts/AuthContext.jsx';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';

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
          <img
            className="marca-logo"
            src={logo}
            alt=""
          />

          <div>
            <strong>
              SISGOM
            </strong>

            <small>
              Gestão de Oficinas
            </small>
          </div>
        </div>

        <nav>
          <NavLink to="/clientes">
            <PeopleAltOutlined fontSize="small" />

            Clientes
          </NavLink>

          <NavLink to="/veiculos">
            <DirectionsCarOutlined fontSize="small" />

            Veículos
          </NavLink>

          <NavLink to="/os">
            <AssignmentOutlined fontSize="small" />

            Ordens de Serviço
          </NavLink>

          <NavLink to="/servicos">
            <BuildOutlined fontSize="small" />

            Serviços
          </NavLink>

          <NavLink to="/pecas">
            <Inventory2Outlined fontSize="small" />

            Peças
          </NavLink>

          {pode('ADMIN') && <NavLink to="/usuarios">
            <ManageAccountsOutlined fontSize="small" />

            Usuários
          </NavLink>}
        </nav>

        <button
          className="link-sair"
          onClick={aoSair}
        >
          <LogoutOutlined fontSize="small" />

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
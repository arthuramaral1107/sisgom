import {
  AssignmentOutlined,
  CommuteRounded,
  ConstructionRounded,
  DashboardOutlined,
  Inventory2Outlined,
  LogoutOutlined,
  ManageAccountsOutlined,
  PeopleAltOutlined
} from '../icones.js';
import { logo } from '../assets/index.js';
import { useAuth, useConfirmar } from '../contexts/index.js';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

/* Estrutura das telas - menu lateral, cabeçalho com o usuário e área de conteúdo */
export default function Layout() {
  const { usuario, sair, pode } = useAuth();
  const navegar = useNavigate();
  const confirmar = useConfirmar();

  const aoSair = async () => {
    const confirmado = await confirmar('Deseja realmente sair do sistema?');

    if (!confirmado) return;

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
          <NavLink to="/painel">
            <DashboardOutlined fontSize="small" />

            Dashboard
          </NavLink>

          <NavLink to="/os">
            <AssignmentOutlined
              fontSize="small"
            />

            Ordens de Serviço
          </NavLink>

          <NavLink to="/clientes">
            <PeopleAltOutlined
              fontSize="small"
            />

            Clientes
          </NavLink>

          <NavLink to="/veiculos">
            <CommuteRounded
              fontSize="small"
            />

            Veículos
          </NavLink>

          <NavLink to="/servicos">
            <ConstructionRounded
              fontSize="small"
            />

            Serviços
          </NavLink>

          <NavLink to="/pecas">
            <Inventory2Outlined
              fontSize="small"
            />

            Peças
          </NavLink>

          {pode('ADMIN') && <NavLink to="/usuarios">
            <ManageAccountsOutlined
              fontSize="small"
            />

            Usuários
          </NavLink>}
        </nav>
      </aside>

      <div className="conteudo">
        <header className="topo">
          <span>
            {usuario.nome} <em>({usuario.perfil})</em>
          </span>

          <button
            className="botao-sair"
            onClick={aoSair}
          >
            <LogoutOutlined fontSize="small" />

            Sair
          </button>
        </header>

        <main className="pagina">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
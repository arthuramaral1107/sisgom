import SemPermissao from './SemPemissao.jsx';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/* Libera as rotas filhas só para usuário logado */
export default function RotaProtegida({ perfis }) {
  const { usuario, carregando } = useAuth();

  if (carregando) return <p className="carregando">
    Carregando...
  </p>;

  if (!usuario) return <Navigate
    to="/login"
    replace
  />;

  if (perfis && !perfis.includes(usuario.perfil)) return <SemPermissao />;

  return <Outlet />;
};
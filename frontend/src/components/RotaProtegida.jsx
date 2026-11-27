import SemPermissao from './SemPemissao.jsx';
import { useAuth } from '../contexts/index.js';
import { Navigate, Outlet } from 'react-router-dom';

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
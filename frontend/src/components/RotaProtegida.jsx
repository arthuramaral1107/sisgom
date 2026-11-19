import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/* Libera as rotas filhas só para usuário logado - senão redireciona para o login */
export default function RotaProtegida() {
  const { usuario, carregando } = useAuth();

  if (carregando) return <p className="carregando">
    Carregando...
  </p>;

  return usuario ? <Outlet /> : <Navigate
    to="/login"
    replace
  />;
};
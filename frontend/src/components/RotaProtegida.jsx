import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

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
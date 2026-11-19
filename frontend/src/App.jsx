import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import Login from './pages/Login.jsx';
import ClientesLista from './pages/ClientesLista.jsx';
import ClienteForm from './pages/ClienteForm.jsx';
import VeiculosLista from './pages/VeiculosLista.jsx';
import VeiculoForm from './pages/VeiculoForm.jsx';
import ServicosLista from './pages/ServicosLista.jsx';
import ServicoForm from './pages/ServicoForm.jsx';
import PecasLista from './pages/PecasLista.jsx';
import PecaForm from './pages/PecaForm.jsx';
import OSLista from './pages/OSLista.jsx';
import OSForm from './pages/OSForm.jsx';
import OSDetalhe from './pages/OSDetalhe.jsx';

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route
            path="/clientes"
            element={<ClientesLista />}
          />

          <Route
            path="/clientes/novo"
            element={<ClienteForm />}
          />

          <Route
            path="/clientes/:id"
            element={<ClienteForm />}
          />

          <Route
            path="/veiculos"
            element={<VeiculosLista />}
          />

          <Route
            path="/veiculos/novo"
            element={<VeiculoForm />}
          />

          <Route
            path="/veiculos/:id"
            element={<VeiculoForm />}
          />

          <Route
            path="/servicos"
            element={<ServicosLista />}
          />

          <Route
            path="/servicos/novo"
            element={<ServicoForm />}
          />

          <Route
            path="/servicos/:id"
            element={<ServicoForm />}
          />

          <Route
            path="/pecas"
            element={<PecasLista />}
          />

          <Route
            path="/pecas/nova"
            element={<PecaForm />}
          />

          <Route
            path="/pecas/:id"
            element={<PecaForm />}
          />

          <Route
            path="/os"
            element={<OSLista />}
          />

          <Route
            path="/os/nova"
            element={<OSForm />}
          />

          <Route
            path="/os/:id"
            element={<OSDetalhe />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/clientes"
            replace
          />
        }
      />
    </Routes>
  );
};
import {
  Login,
  OSForm,
  OSLista,
  PecaForm,
  OSDetalhe,
  PecasLista,
  ClienteForm,
  VeiculoForm,
  ServicoForm,
  ClientesLista,
  VeiculosLista,
  ServicosLista
} from './pages/index.js';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout, RotaProtegida } from './components/index.js';

/* Rotas da aplicação - login público e demais telas protegidas pelo layout */
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
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PrivateRoute from "./components/PrivateRoute";
import ClientesPage from "./pages/ClientesPage";
import CrearClientePage from "./pages/CrearClientePage";
import EditarClientePage from "./pages/EditarClientePage";
import ConstruccionesPage from "./pages/ConstruccionesPage";
import CrearConstruccionPage from "./pages/CrearConstruccionPage";
import EditarConstruccionPage from "./pages/EditarConstruccionPage";
import PedidosPage from "./pages/PedidosPage";
import CrearPedidoPage from "./pages/CrearPedidoPage";
import EditarEstadoPedidoPage from "./pages/EditarEstadoPedidoPage";
import ProductosPage from "./pages/ProductosPage";
import CrearProductoPage from "./pages/CrearProductoPage";
import EditarProductoPage from "./pages/EditarProductoPage";
import MiPerfilPage from "./pages/MiPerfilPage";
import DashboardLayout from "./layouts/DashboardLayout";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={
          <PrivateRoute>
            <DashboardLayout>
              <HomePage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/clientes" element={
          <PrivateRoute>
            <DashboardLayout>
              <ClientesPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/clientes/crear" element={
          <PrivateRoute>
            <DashboardLayout>
              <CrearClientePage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/clientes/:id" element={
          <PrivateRoute>
            <DashboardLayout>
              <EditarClientePage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/construcciones" element={
          <PrivateRoute>
            <DashboardLayout>
              <ConstruccionesPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/construcciones/crear" element={
          <PrivateRoute>
            <DashboardLayout>
              <CrearConstruccionPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/construcciones/editar/:id" element={
          <PrivateRoute>
            <DashboardLayout>
              <EditarConstruccionPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/pedidos" element={
          <PrivateRoute>
            <DashboardLayout>
              <PedidosPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/pedidos/crear" element={
          <PrivateRoute>
            <DashboardLayout>
              <CrearPedidoPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/pedidos/:id/estado" element={
          <PrivateRoute>
            <DashboardLayout>
              <EditarEstadoPedidoPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/productos" element={
          <PrivateRoute>
            <DashboardLayout>
              <ProductosPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/productos/crear" element={
          <PrivateRoute>
            <DashboardLayout>
              <CrearProductoPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/productos/:id/editar" element={
          <PrivateRoute>
            <DashboardLayout>
              <EditarProductoPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
        <Route path="/perfil" element={
          <PrivateRoute>
            <DashboardLayout>
              <MiPerfilPage />
            </DashboardLayout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

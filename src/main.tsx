import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AccesoDenegadoPage from "./pages/AccesoDenegadoPage";
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
import ProduccionPage from "./pages/ProduccionPage";
import CrearOrdenPage from "./pages/CrearOrdenPage";
import ActualizarOrdenPage from "./pages/EditarOrdenPage";
import MiPerfilPage from "./pages/MiPerfilPage";
import AdministracionPage from "./pages/AdministracionPage";
import EditarUsuarioPage from "./pages/EditarUsuarioPage";
import DashboardLayout from "./layouts/DashboardLayout";
import MetricasPage from "./pages/MetricasPage";

import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <HomePage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <PrivateRoute rolesPermitidos={["Administrador", "Vendedor"]}>
                <DashboardLayout>
                  <ClientesPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/clientes/crear"
            element={
              <PrivateRoute rolesPermitidos={["Administrador", "Vendedor"]}>
                <DashboardLayout>
                  <CrearClientePage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/clientes/:id"
            element={
              <PrivateRoute rolesPermitidos={["Administrador", "Vendedor"]}>
                <DashboardLayout>
                  <EditarClientePage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/construcciones"
            element={
              <PrivateRoute rolesPermitidos={["Administrador", "Vendedor"]}>
                <DashboardLayout>
                  <ConstruccionesPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/construcciones/crear"
            element={
              <PrivateRoute rolesPermitidos={["Administrador", "Vendedor"]}>
                <DashboardLayout>
                  <CrearConstruccionPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/construcciones/editar/:id"
            element={
              <PrivateRoute rolesPermitidos={["Administrador", "Vendedor"]}>
                <DashboardLayout>
                  <EditarConstruccionPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <PrivateRoute rolesPermitidos={["Administrador", "Vendedor"]}>
                <DashboardLayout>
                  <PedidosPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos/crear"
            element={
              <PrivateRoute rolesPermitidos={["Administrador", "Vendedor"]}>
                <DashboardLayout>
                  <CrearPedidoPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos/:id/estado"
            element={
              <PrivateRoute rolesPermitidos={["Administrador", "Vendedor"]}>
                <DashboardLayout>
                  <EditarEstadoPedidoPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/productos"
            element={
              <PrivateRoute
                rolesPermitidos={["Administrador", "Encargado de Producción"]}
              >
                <DashboardLayout>
                  <ProductosPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/productos/crear"
            element={
              <PrivateRoute
                rolesPermitidos={["Administrador", "Encargado de Producción"]}
              >
                <DashboardLayout>
                  <CrearProductoPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/productos/:id/editar"
            element={
              <PrivateRoute
                rolesPermitidos={["Administrador", "Encargado de Producción"]}
              >
                <DashboardLayout>
                  <EditarProductoPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/produccion"
            element={
              <PrivateRoute
                rolesPermitidos={["Administrador", "Encargado de Producción"]}
              >
                <DashboardLayout>
                  <ProduccionPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/produccion/crear"
            element={
              <PrivateRoute
                rolesPermitidos={["Administrador", "Encargado de Producción"]}
              >
                <DashboardLayout>
                  <CrearOrdenPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/produccion/:id/editar"
            element={
              <PrivateRoute
                rolesPermitidos={["Administrador", "Encargado de Producción"]}
              >
                <DashboardLayout>
                  <ActualizarOrdenPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <MiPerfilPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/metricas"
            element={
              <PrivateRoute rolesPermitidos={["Administrador"]}>
                <DashboardLayout>
                  <MetricasPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/administracion"
            element={
              <PrivateRoute rolesPermitidos={["Administrador"]}>
                <DashboardLayout>
                  <AdministracionPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/administracion/usuarios/editar/:id"
            element={
              <PrivateRoute rolesPermitidos={["Administrador"]}>
                <DashboardLayout>
                  <EditarUsuarioPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

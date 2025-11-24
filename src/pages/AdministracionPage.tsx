// src/pages/AdministracionPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getToken } from "../services/auth";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import ActionGroup from "../components/ActionGroup";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  id_rol: string;
  bloqueado?: number | boolean; // 0/1 o boolean
}

const AdministracionPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tipoReporte, setTipoReporte] = useState<"pedidos" | "produccion" | "kardex">("pedidos");
  const [formato, setFormato] = useState<"pdf" | "xlsx">("pdf");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 15;
  const navigate = useNavigate();

  // Kardex (se dejan los controles; no usados en la UI principal excepto en reportes)
  const [kardexProductoId, setKardexProductoId] = useState("");
  const [kardexTipoMov, setKardexTipoMov] = useState<"" | "ENTRADA" | "SALIDA">("");
  const [kardexTodos, setKardexTodos] = useState(false);

  // Crear usuario (modal)
  const [crearOpen, setCrearOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoPass, setNuevoPass] = useState("");
  const [nuevoRol, setNuevoRol] = useState<"1" | "2" | "3">("2");
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  const rolesMap: { [key: string]: string } = {
    "1": "Administrador",
    "2": "Vendedor",
    "3": "Encargado de Producción",
  };

  const headers = useMemo(() => ({ Authorization: `Bearer ${getToken()}` }), []);

  // Modals de confirmación y mensajes
  const [pendingDelete, setPendingDelete] = useState<null | { id: number; nombre: string }>(null);
  const [pendingBloqueo, setPendingBloqueo] = useState<null | { id: number; nombre: string; bloquear: boolean }>(null);
  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);
  const [successModal, setSuccessModal] = useState<null | { title: string; message?: string }>(null);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);

  const cargarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const response = await axios.get("http://localhost:3000/api/usuarios", { headers });
      setUsuarios(response.data || []);
    } catch (error: any) {
      console.error("Error al obtener los usuarios:", error);
      setModalError({
        title: "Error al obtener usuarios",
        message: error?.response?.data?.message || "No se pudieron cargar los usuarios. Intenta nuevamente.",
      });
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditar = (id: number) => {
    navigate(`/administracion/usuarios/editar/${id}`);
  };

  const handleCrearUsuario = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoEmail.trim() || !nuevoPass.trim()) {
      setModalError({ title: "Campos incompletos", message: "Completa nombre, email y contraseña." });
      return;
    }
    setGuardandoUsuario(true);
    try {
      await axios.post(
        "http://localhost:3000/api/usuarios",
        {
          nombre: nuevoNombre.trim(),
          email: nuevoEmail.trim(),
          contrasena: nuevoPass,
          id_rol: Number(nuevoRol),
        },
        { headers }
      );

      setCrearOpen(false);
      setNuevoNombre("");
      setNuevoEmail("");
      setNuevoPass("");
      setNuevoRol("2");
      setSuccessModal({ title: "Usuario creado", message: "Se creó el usuario correctamente." });
      await cargarUsuarios();
    } catch (err: any) {
      console.error(err);
      setModalError({ title: "Error", message: err?.response?.data?.message || "Error al crear usuario" });
    } finally {
      setGuardandoUsuario(false);
    }
  };

  // Abrir confirmación eliminar
  const abrirEliminar = (u: Usuario) => {
    setPendingDelete({ id: u.id, nombre: u.nombre });
  };

  // Confirmar eliminar
  const confirmarEliminar = async () => {
    if (!pendingDelete) return;
    setProcessingAction(true);
    try {
      await axios.delete(`http://localhost:3000/api/usuarios/${pendingDelete.id}`, { headers });
      setUsuarios((us) => us.filter((x) => x.id !== pendingDelete.id));
      setSuccessModal({ title: "Usuario eliminado", message: `Se eliminó ${pendingDelete.nombre}` });
      setPendingDelete(null);
    } catch (err: any) {
      console.error(err);
      setModalError({ title: "Error al eliminar", message: err?.response?.data?.message || "No se pudo eliminar el usuario" });
    } finally {
      setProcessingAction(false);
    }
  };

  // Abrir confirmación bloqueo/desbloqueo
  const abrirBloqueo = (u: Usuario) => {
    const bloqueado = !!u.bloqueado;
    setPendingBloqueo({ id: u.id, nombre: u.nombre, bloquear: !bloqueado });
  };

  // Confirmar bloqueo/desbloqueo
  const confirmarBloqueo = async () => {
    if (!pendingBloqueo) return;
    setProcessingAction(true);
    try {
      await axios.patch(
        `http://localhost:3000/api/usuarios/${pendingBloqueo.id}/bloqueo`,
        { bloqueado: pendingBloqueo.bloquear ? 1 : 0 },
        { headers }
      );

      setUsuarios((us) =>
        us.map((x) =>
          x.id === pendingBloqueo.id ? { ...x, bloqueado: pendingBloqueo.bloquear ? 1 : 0 } : x
        )
      );

      setSuccessModal({
        title: pendingBloqueo.bloquear ? "Usuario bloqueado" : "Usuario desbloqueado",
        message: `${pendingBloqueo.bloquear ? "Se bloqueó" : "Se desbloqueó"} a ${pendingBloqueo.nombre}`,
      });
      setPendingBloqueo(null);
    } catch (err: any) {
      console.error(err);
      setModalError({ title: "Error", message: err?.response?.data?.message || "Error al cambiar el bloqueo del usuario" });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleGenerarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      if (tipoReporte === "kardex") {
        const params: any = { formato };
        if (fechaInicio) params.desde = fechaInicio;
        if (fechaFin) params.hasta = fechaFin;
        if (kardexTipoMov) params.tipo = kardexTipoMov;

        let url = "";
        if (kardexTodos) {
          url = `http://localhost:3000/api/productos/movimientos/export`;
        } else {
          if (!kardexProductoId.trim()) {
            setModalError({ title: "Falta código", message: 'Ingresa el código de producto o marca "Todos los productos".' });
            setCargando(false);
            return;
          }
          url = `http://localhost:3000/api/productos/${encodeURIComponent(kardexProductoId)}/movimientos/export`;
        }

        const res = await axios.get(url, {
          params,
          responseType: "blob",
          headers,
        });

        const blob = new Blob([res.data], {
          type: formato === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        const dlName = kardexTodos
          ? `kardex_todos_${new Date().toISOString().split("T")[0]}.${formato}`
          : `kardex_${kardexProductoId}_${new Date().toISOString().split("T")[0]}.${formato}`;
        link.href = URL.createObjectURL(blob);
        link.download = dlName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
      } else {
        const response = await axios.post(
          "http://localhost:3000/api/reportes",
          {
            tipo: tipoReporte,
            formato: formato,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          },
          {
            responseType: "blob",
            headers,
          }
        );

        const blob = new Blob([response.data], {
          type: formato === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `reporte_${tipoReporte}_${new Date().toISOString().split("T")[0]}.${formato}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      setModalError({ title: "Error", message: "Hubo un error al generar el reporte." });
    } finally {
      setCargando(false);
    }
  };

  // Filtrado & paginación
  const usuariosFiltrados = usuarios.filter((usuario) =>
    usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    rolesMap[usuario.id_rol]?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / usuariosPorPagina));
  const inicio = (paginaActual - 1) * usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(inicio, inicio + usuariosPorPagina);

  if (loadingUsuarios) return <p className="p-4">Cargando...</p>;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Listado de Usuarios</h2>
          <p className="text-sm text-gray-600 mt-1">Administración de usuarios y generación de reportes.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCrearOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Nuevo usuario
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <SearchInput
          id="search-usuarios"
          value={busqueda}
          onChange={(v) => { setBusqueda(v); setPaginaActual(1); }}
          placeholder="Buscar por nombre, correo o rol..."
          className="md:max-w-md"
          aria-label="Buscar usuarios"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setBusqueda(""); setPaginaActual(1); }}
            className="px-3 py-1 border"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla desktop + cards mobile */}
      <div className="bg-white rounded shadow overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Nombre</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Correo</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Rol</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosPaginados.map((u) => {
                const isBlocked = !!u.bloqueado;
                return (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">{u.nombre}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">{rolesMap[u.id_rol]}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {isBlocked ? "Bloqueado" : "Activo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ActionGroup
                        primary={{
                          label: "Editar",
                          onClick: () => handleEditar(u.id),
                          ariaLabel: `Editar usuario ${u.id}`,
                          variant: "link",
                        }}
                        secondary={{
                          label: isBlocked ? "Desbloquear" : "Bloquear",
                          onClick: () => abrirBloqueo(u),
                          ariaLabel: `${isBlocked ? "Desbloquear" : "Bloquear"} usuario ${u.id}`,
                          variant: isBlocked ? "primary" : "danger",
                        }}
                        tertiary={{
                          label: "Eliminar",
                          onClick: () => abrirEliminar(u),
                          ariaLabel: `Eliminar usuario ${u.id}`,
                          variant: "danger",
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
              {usuariosPaginados.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">No se encontraron usuarios</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3 p-3">
          {usuariosPaginados.length === 0 ? (
            <div className="text-center text-gray-500 py-6">No se encontraron usuarios</div>
          ) : (
            usuariosPaginados.map((u) => {
              const isBlocked = !!u.bloqueado;
              return (
                <article key={u.id} className="border rounded p-3 bg-white shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{u.nombre}</div>
                      <div className="text-xs text-gray-600">{u.email}</div>
                      <div className="text-xs text-gray-600 mt-1">{rolesMap[u.id_rol]}</div>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded text-xs ${isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {isBlocked ? "Bloqueado" : "Activo"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <ActionGroup
                        primary={{
                          label: "Editar",
                          onClick: () => handleEditar(u.id),
                          ariaLabel: `Editar usuario ${u.id}`,
                          variant: "link",
                        }}
                        secondary={{
                          label: isBlocked ? "Desbloquear" : "Bloquear",
                          onClick: () => abrirBloqueo(u),
                          ariaLabel: `${isBlocked ? "Desbloquear" : "Bloquear"} usuario ${u.id}`,
                          variant: isBlocked ? "primary" : "danger",
                        }}
                        tertiary={{
                          label: "Eliminar",
                          onClick: () => abrirEliminar(u),
                          ariaLabel: `Eliminar usuario ${u.id}`,
                          variant: "danger",
                        }}
                      />
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`px-3 py-1 border rounded ${paginaActual === n ? "bg-blue-600 text-white" : "bg-white text-blue-600"}`}
              onClick={() => setPaginaActual(n)}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* Crear Usuario modal (usa Modal component) */}
      <Modal
        open={crearOpen}
        title="Crear nuevo usuario"
        onClose={() => setCrearOpen(false)}
        secondaryLabel="Cancelar"
        onSecondary={() => setCrearOpen(false)}
        primaryLabel={guardandoUsuario ? "Guardando..." : "Crear"}
        onPrimary={handleCrearUsuario}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleCrearUsuario} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Correo</label>
            <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input type="password" value={nuevoPass} onChange={(e) => setNuevoPass(e.target.value)} className="w-full border rounded px-3 py-2" minLength={6} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Rol</label>
            <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as any)} className="w-full border rounded px-3 py-2">
              <option value="2">Vendedor</option>
              <option value="3">Encargado de Producción</option>
              <option value="1">Administrador</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Confirmación Eliminar */}
      <Modal
        open={!!pendingDelete}
        title="Confirmar eliminación"
        onClose={() => setPendingDelete(null)}
        secondaryLabel="Cancelar"
        onSecondary={() => setPendingDelete(null)}
        primaryLabel={processingAction ? "Eliminando..." : "Eliminar"}
        onPrimary={confirmarEliminar}
        maxWidthClass="max-w-md"
      >
        <p className="text-sm text-gray-700">
          ¿Estás segura/o de que deseas eliminar al usuario <span className="font-medium">{pendingDelete?.nombre}</span>? Esta acción es permanente.
        </p>
      </Modal>

      {/* Confirmación Bloquear/Desbloquear */}
      <Modal
        open={!!pendingBloqueo}
        title={pendingBloqueo?.bloquear ? "Confirmar bloqueo" : "Confirmar desbloqueo"}
        onClose={() => setPendingBloqueo(null)}
        secondaryLabel="Cancelar"
        onSecondary={() => setPendingBloqueo(null)}
        primaryLabel={processingAction ? (pendingBloqueo?.bloquear ? "Bloqueando..." : "Desbloqueando...") : (pendingBloqueo?.bloquear ? "Bloquear" : "Desbloquear")}
        onPrimary={confirmarBloqueo}
        maxWidthClass="max-w-md"
      >
        <p className="text-sm text-gray-700">
          {pendingBloqueo?.bloquear
            ? `¿Bloquear al usuario ${pendingBloqueo?.nombre}? No podrá acceder hasta ser desbloqueado.`
            : `¿Desbloquear al usuario ${pendingBloqueo?.nombre}?`}
        </p>
      </Modal>

      {/* Error modal */}
      <Modal
        open={!!modalError}
        title={modalError?.title}
        onClose={() => setModalError(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setModalError(null)}
      >
        <p className="text-sm text-gray-700">{modalError?.message}</p>
      </Modal>

      {/* Success modal */}
      <Modal
        open={!!successModal}
        title={successModal?.title}
        onClose={() => setSuccessModal(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setSuccessModal(null)}
      >
        <p className="text-sm text-gray-700">{successModal?.message}</p>
      </Modal>

      {/* ===== Reportes ===== */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Generar Reporte</h2>
        <form onSubmit={handleGenerarReporte} className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg">
          <div>
            <label className="block font-medium mb-1">Tipo de Reporte:</label>
            <select value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value as any)} className="w-full p-2 border">
              <option value="pedidos">Pedidos</option>
              <option value="produccion">Órdenes de Producción</option>
              <option value="kardex">Kardex de Inventario</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Formato:</label>
            <select value={formato} onChange={(e) => setFormato(e.target.value as any)} className="w-full p-2 border">
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Fecha Inicio:</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required className="w-full p-2 border" />
          </div>
          <div>
            <label className="block font-medium mb-1">Fecha Fin:</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required className="w-full p-2 border" />
          </div>

          {tipoReporte === "kardex" && (
            <>
              <div className="flex items-center gap-2">
                <input id="todos" type="checkbox" checked={kardexTodos} onChange={(e) => setKardexTodos(e.target.checked)} />
                <label htmlFor="todos">Todos los productos</label>
              </div>

              {!kardexTodos && (
                <div>
                  <label className="block font-medium mb-1">Código de Producto:</label>
                  <input type="text" value={kardexProductoId} onChange={(e) => setKardexProductoId(e.target.value)} className="w-full p-2 border rounded" placeholder="Ej: ADO-001" required />
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">Tipo de movimiento (opcional):</label>
                <select value={kardexTipoMov} onChange={(e) => setKardexTipoMov(e.target.value as any)} className="w-full p-2 border rounded">
                  <option value="">Todos</option>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={cargando} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              {cargando ? "Generando..." : "Generar y Descargar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdministracionPage;
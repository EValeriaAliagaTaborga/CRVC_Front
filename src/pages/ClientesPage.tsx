import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import ActionGroup from "../components/ActionGroup";

interface Cliente {
  id_cliente: number;
  nombre_empresa: string;
  nombre_contacto: string;
  telefono_fijo: string;
  celular: string;
  email: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroContacto, setFiltroContacto] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 25;

  // modals / deletion state
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState<null | { title?: string; message?: string }>(null);
  const [successModal, setSuccessModal] = useState<null | { title: string; message?: string }>(null);

  const navigate = useNavigate();

  // obtener usuario y role en runtime (evita evaluar en top-level)
  const usuario = getUsuario();
  const esAdministrador = Boolean(
    usuario?.rol === "1" ||
      usuario?.rol === "Administrador" ||
      String(usuario?.rol).toLowerCase() === "administrador" ||
      String(usuario?.rol).toLowerCase() === "admin"
  );

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/clientes", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        setClientes(res.data || []);
      } catch (error: any) {
        setModalError({
          title: "Error al obtener clientes",
          message: error?.response?.data?.message || "No se pudieron obtener los clientes. Intenta nuevamente.",
        });
      }
    };

    fetchClientes();
  }, []);

  // filtered list (case-insensitive)
  const clientesFiltrados = useMemo(() => {
    const e = filtroEmpresa.trim().toLowerCase();
    const c = filtroContacto.trim().toLowerCase();
    return clientes.filter(
      (cl) =>
        (cl.nombre_empresa || "").toLowerCase().includes(e) &&
        (cl.nombre_contacto || "").toLowerCase().includes(c)
    );
  }, [clientes, filtroEmpresa, filtroContacto]);

  // pagination math
  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / clientesPorPagina));
  const paginaClamped = Math.min(Math.max(1, paginaActual), totalPaginas);
  useEffect(() => {
    if (paginaActual !== paginaClamped) setPaginaActual(paginaClamped);
  }, [paginaClamped, paginaActual]);

  const clientesPagina = clientesFiltrados.slice(
    (paginaClamped - 1) * clientesPorPagina,
    paginaClamped * clientesPorPagina
  );

  // abrir modal de confirmación (no eliminar inmediatamente)
  const handleDelete = (id: number) => {
    if (!esAdministrador) {
      setModalError({ title: "Permiso denegado", message: "Solo un Administrador puede eliminar clientes." });
      return;
    }
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    if (!id) return;
    if (!esAdministrador) {
      setPendingDeleteId(null);
      setModalError({ title: "Permiso denegado", message: "Solo un Administrador puede eliminar clientes." });
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(`http://localhost:3000/api/clientes/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setClientes((prev) => prev.filter((x) => x.id_cliente !== id));
      setPendingDeleteId(null);
      setSuccessModal({ title: "Cliente eliminado", message: `El cliente #${id} fue eliminado correctamente.` });
    } catch (err: any) {
      setModalError({
        title: "Error al eliminar cliente",
        message: err?.response?.data?.message || "Ocurrió un problema eliminando el cliente. Intenta nuevamente.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clientes registrados</h2>
          <p className="text-sm text-gray-600 mt-1">Lista de empresas y contactos registrados.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/clientes/crear"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Registrar cliente
          </Link>
        </div>
      </div>

      {/* Filtros: usar SearchInput componente, reiniciar página al cambiar */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <SearchInput
          id="search-empresa"
          label="Empresa"
          placeholder="Filtrar por Empresa"
          value={filtroEmpresa}
          onChange={(v) => {
            setFiltroEmpresa(v);
            setPaginaActual(1);
          }}
          className="w-full md:max-w-sm"
        />
        <SearchInput
          id="search-contacto"
          label="Contacto"
          placeholder="Filtrar por Contacto"
          value={filtroContacto}
          onChange={(v) => {
            setFiltroContacto(v);
            setPaginaActual(1);
          }}
          className="w-full md:max-w-sm"
        />
      </div>

      {/* Tabla / Desktop */}
      <div className="hidden md:block bg-white shadow rounded">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Celular</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesPagina.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">No se encontraron resultados.</td>
              </tr>
            ) : (
              clientesPagina.map((cl) => (
                <tr key={cl.id_cliente} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{cl.nombre_empresa}</td>
                  <td className="px-4 py-3">{cl.nombre_contacto}</td>
                  <td className="px-4 py-3">{cl.celular}</td>
                  <td className="px-4 py-3">{cl.email}</td>
                  <td className="px-4 py-3">
                    <ActionGroup
                      primary={{
                        label: "Editar",
                        href: `/clientes/${cl.id_cliente}`,
                        ariaLabel: `Editar cliente ${cl.id_cliente}`,
                        variant: "link",
                      }}
                      secondary={
                        esAdministrador
                          ? {
                              label: "Eliminar",
                              onClick: () => handleDelete(cl.id_cliente),
                              ariaLabel: `Eliminar cliente ${cl.id_cliente}`,
                              variant: "danger",
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {clientesPagina.length === 0 ? (
          <div className="p-4 border rounded text-center text-gray-500">No se encontraron resultados.</div>
        ) : (
          clientesPagina.map((cl) => (
            <article key={cl.id_cliente} className="p-3 border rounded bg-white shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{cl.nombre_empresa}</div>
                    <div className="text-xs text-gray-600">{/* optional badge */}</div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{cl.nombre_contacto}</div>
                  <div className="text-xs text-gray-500 mt-1">{cl.celular} · {cl.email}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <ActionGroup
                    primary={{
                      label: "Editar",
                      href: `/clientes/${cl.id_cliente}`,
                      ariaLabel: `Editar cliente ${cl.id_cliente}`,
                      variant: "link",
                    }}
                    secondary={
                      esAdministrador
                        ? {
                            label: "Eliminar",
                            onClick: () => handleDelete(cl.id_cliente),
                            ariaLabel: `Eliminar cliente ${cl.id_cliente}`,
                            variant: "danger",
                          }
                        : undefined
                    }
                  />
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPaginaActual(n)}
              className={`px-3 py-1 rounded ${n === paginaClamped ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
              aria-current={n === paginaClamped ? "page" : undefined}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}

      {/* Confirm delete */}
      <Modal
        open={pendingDeleteId !== null}
        title="Confirmar eliminación"
        onClose={() => setPendingDeleteId(null)}
        secondaryLabel="Cancelar"
        onSecondary={() => setPendingDeleteId(null)}
        primaryLabel={deleting ? "Eliminando..." : "Confirmar eliminación"}
        onPrimary={confirmDelete}
        maxWidthClass="max-w-md"
      >
        <p className="text-sm text-gray-700">¿Estás segura/o de que deseas eliminar el cliente <span className="font-medium">#{pendingDeleteId}</span>? Esta acción no se puede deshacer.</p>
      </Modal>

      {/* Success */}
      <Modal
        open={!!successModal}
        title={successModal?.title}
        onClose={() => setSuccessModal(null)}
        secondaryLabel="Seguir en la página"
        onSecondary={() => setSuccessModal(null)}
        primaryLabel="Volver a lista"
        onPrimary={() => {
          setSuccessModal(null);
          navigate("/clientes");
        }}
      >
        <p className="text-sm text-gray-700">{successModal?.message}</p>
      </Modal>

      {/* Generic error */}
      <Modal
        open={!!modalError}
        title={modalError?.title}
        onClose={() => setModalError(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setModalError(null)}
      >
        <p className="text-sm text-gray-700">{modalError?.message}</p>
      </Modal>
    </div>
  );
}
// src/pages/ConstruccionesPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import ActionGroup from "../components/ActionGroup";

const usuario = getUsuario();
const esAdministrador = usuario?.rol === "1";

interface Construccion {
  id_construccion: number;
  direccion: string;
  estado_obra: string;
  nombre_contacto_obra: string;
  celular_contacto_obra: string;
  nombre_empresa: string;
}

const ConstruccionesPage: React.FC = () => {
  const [construcciones, setConstrucciones] = useState<Construccion[]>([]);
  const navigate = useNavigate();

  const [filtroDireccion, setFiltroDireccion] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroContacto, setFiltroContacto] = useState("");

  // modals / deletion state
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);
  const [successModal, setSuccessModal] = useState<null | { title: string; message?: string }>(null);

  useEffect(() => {
    const fetchConstrucciones = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/construcciones", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setConstrucciones(res.data);
      } catch (err: any) {
        setModalError({
          title: "Error al cargar construcciones",
          message: err?.response?.data?.message || "No se pudieron obtener las construcciones. Intenta nuevamente.",
        });
      }
    };

    fetchConstrucciones();
  }, []);

  const handleDelete = (id: number) => {
    // abrir modal de confirmación
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    if (!id) return;
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:3000/api/construcciones/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setConstrucciones((prev) => prev.filter((c) => c.id_construccion !== id));
      setPendingDeleteId(null);
      setSuccessModal({
        title: "Construcción eliminada",
        message: `La construcción #${id} se eliminó correctamente.`,
      });
    } catch (err: any) {
      setModalError({
        title: "No se pudo eliminar",
        message: err?.response?.data?.message || "Ocurrió un error al eliminar la construcción. Intenta nuevamente.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const construccionesFiltradas = construcciones.filter(
    (c) =>
      c.direccion.toLowerCase().includes(filtroDireccion.toLowerCase()) &&
      c.estado_obra.toLowerCase().includes(filtroEstado.toLowerCase()) &&
      c.nombre_contacto_obra.toLowerCase().includes(filtroContacto.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Construcciones registradas</h2>
          <p className="text-sm text-gray-600 mt-1">Listado y administración de construcciones por cliente.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/construcciones/crear"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Registrar construcción
          </Link>
        </div>
      </div>

      {/* filtros con SearchInput */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchInput
          id="filtro-direccion"
          value={filtroDireccion}
          onChange={(v) => setFiltroDireccion(v)}
          placeholder="Filtrar por dirección"
          label="Dirección"
        />
        <SearchInput
          id="filtro-estado"
          value={filtroEstado}
          onChange={(v) => setFiltroEstado(v)}
          placeholder="Filtrar por estado de obra"
          label="Estado de obra"
        />
        <SearchInput
          id="filtro-contacto"
          value={filtroContacto}
          onChange={(v) => setFiltroContacto(v)}
          placeholder="Filtrar por contacto"
          label="Contacto"
        />
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Dirección</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Contacto obra</th>
              <th className="px-4 py-2 text-left">Celular</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {construccionesFiltradas.map((c) => (
              <tr key={c.id_construccion} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{c.nombre_empresa}</td>
                <td className="px-4 py-3">{c.direccion}</td>
                <td className="px-4 py-3">{c.estado_obra}</td>
                <td className="px-4 py-3">{c.nombre_contacto_obra}</td>
                <td className="px-4 py-3">{c.celular_contacto_obra}</td>
                <td className="px-4 py-3">
                  <ActionGroup
                    primary={{
                      label: "Editar",
                      href: `/construcciones/editar/${c.id_construccion}`,
                      ariaLabel: `Editar construcción ${c.id_construccion}`,
                      variant: "link",
                    }}
                    secondary={
                      esAdministrador
                        ? {
                            label: "Eliminar",
                            onClick: () => handleDelete(c.id_construccion),
                            ariaLabel: `Eliminar construcción ${c.id_construccion}`,
                            variant: "danger",
                          }
                        : undefined
                    }
                  />
                </td>
              </tr>
            ))}
            {construccionesFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">No se encontraron resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {construccionesFiltradas.length === 0 ? (
          <div className="p-4 border rounded text-center text-gray-500">No se encontraron resultados.</div>
        ) : (
          construccionesFiltradas.map((c) => (
            <article key={c.id_construccion} className="p-3 border rounded bg-white shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{c.nombre_empresa}</div>
                    <div className="text-xs text-gray-600">{c.estado_obra}</div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{c.direccion}</div>
                  <div className="text-xs text-gray-500 mt-1">{c.nombre_contacto_obra} · {c.celular_contacto_obra}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <ActionGroup
                    primary={{
                      label: "Editar",
                      href: `/construcciones/editar/${c.id_construccion}`,
                      ariaLabel: `Editar construcción ${c.id_construccion}`,
                      variant: "link",
                    }}
                    secondary={
                      esAdministrador
                        ? {
                            label: "Eliminar",
                            onClick: () => handleDelete(c.id_construccion),
                            ariaLabel: `Eliminar construcción ${c.id_construccion}`,
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

      {/* Modal: Confirmación eliminación */}
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
        <p className="text-sm text-gray-700">
          ¿Estás seguro/a de eliminar la construcción <span className="font-medium">#{pendingDeleteId}</span>? Esta acción no se puede deshacer.
        </p>
      </Modal>

      {/* Modal: Error */}
      <Modal
        open={!!modalError}
        title={modalError?.title}
        onClose={() => setModalError(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setModalError(null)}
      >
        <p className="text-sm text-gray-700">{modalError?.message}</p>
      </Modal>

      {/* Modal: Éxito */}
      <Modal
        open={!!successModal}
        title={successModal?.title}
        onClose={() => setSuccessModal(null)}
        secondaryLabel="Seguir en la página"
        onSecondary={() => setSuccessModal(null)}
        primaryLabel="Volver a construcciones"
        onPrimary={() => {
          setSuccessModal(null);
          navigate("/construcciones");
        }}
      >
        <p className="text-sm text-gray-700">{successModal?.message}</p>
      </Modal>
    </div>
  );
};

export default ConstruccionesPage;
// src/pages/EditarConstruccionPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";

const EditarConstruccionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id_cliente: "",
    direccion: "",
    estado_obra: "",
    nombre_contacto_obra: "",
    celular_contacto_obra: "",
  });

  const [errors, setErrors] = useState({
    id_cliente: "",
    direccion: "",
    estado_obra: "",
    nombre_contacto_obra: "",
    celular_contacto_obra: "",
  });

  const [clientes, setClientes] = useState<{ id_cliente: number; nombre_empresa: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);
  const [successModal, setSuccessModal] = useState<null | { title: string; message?: string }>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resConstruccion, resClientes] = await Promise.all([
          axios.get(`http://localhost:3000/api/construcciones/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          axios.get("http://localhost:3000/api/clientes", {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ]);

        const construccion = resConstruccion.data;

        setForm({
          id_cliente: construccion.id_cliente?.toString() ?? "",
          direccion: construccion.direccion ?? "",
          estado_obra: construccion.estado_obra ?? "",
          nombre_contacto_obra: construccion.nombre_contacto_obra ?? "",
          celular_contacto_obra: construccion.celular_contacto_obra ?? "",
        });

        setClientes(resClientes.data);
      } catch (err: any) {
        setModalError({
          title: "Error al cargar la información",
          message: err?.response?.data?.message || "No se pudo cargar la información. Intenta nuevamente.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: any = {};

    if (!form.direccion.trim()) nuevosErrores.direccion = "La dirección es obligatoria";
    if (!form.estado_obra.trim()) nuevosErrores.estado_obra = "El estado de la obra es obligatorio";
    if (!form.nombre_contacto_obra.trim()) nuevosErrores.nombre_contacto_obra = "El nombre del contacto es obligatorio";
    if (!form.celular_contacto_obra.trim()) nuevosErrores.celular_contacto_obra = "El celular del contacto es obligatorio";
    if (!form.id_cliente) nuevosErrores.id_cliente = "Debe seleccionar un cliente";

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setSubmitting(true);
    try {
      await axios.put(
        `http://localhost:3000/api/construcciones/${id}`,
        {
          ...form,
          id_cliente: parseInt(String(form.id_cliente), 10),
        },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      setSuccessModal({
        title: "Construcción actualizada",
        message: "Los cambios se guardaron correctamente.",
      });
    } catch (err: any) {
      setModalError({
        title: "Error al actualizar construcción",
        message: err?.response?.data?.message || "No se pudo actualizar la construcción. Intenta nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="p-4">Cargando…</p>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Editar construcción</h2>
          <p className="text-sm text-gray-600 mt-1">Modifica los datos de la construcción.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/construcciones")}
            className="px-3 py-2 rounded border hover:bg-gray-50"
          >
            ← Volver a construcciones
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 shadow-md rounded space-y-4 max-w-lg mx-auto">
        <div>
          <label className="block font-medium mb-1">Cliente</label>
          <select
            name="id_cliente"
            value={form.id_cliente}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre_empresa}
              </option>
            ))}
          </select>
          {errors.id_cliente && <p className="text-red-600 text-sm mt-1">{errors.id_cliente}</p>}
        </div>

        <div>
          <label className="block font-medium mb-1">Dirección</label>
          <input
            type="text"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.direccion && <p className="text-red-600 text-sm mt-1">{errors.direccion}</p>}
        </div>

        <div>
          <label className="block font-medium mb-1">Estado de la obra</label>
          <input
            type="text"
            name="estado_obra"
            value={form.estado_obra}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.estado_obra && <p className="text-red-600 text-sm mt-1">{errors.estado_obra}</p>}
        </div>

        <div>
          <label className="block font-medium mb-1">Nombre contacto de obra</label>
          <input
            type="text"
            name="nombre_contacto_obra"
            value={form.nombre_contacto_obra}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nombre_contacto_obra && <p className="text-red-600 text-sm mt-1">{errors.nombre_contacto_obra}</p>}
        </div>

        <div>
          <label className="block font-medium mb-1">Celular contacto de obra</label>
          <input
            type="text"
            name="celular_contacto_obra"
            value={form.celular_contacto_obra}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.celular_contacto_obra && <p className="text-red-600 text-sm mt-1">{errors.celular_contacto_obra}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/construcciones")}
            className="px-4 py-2 rounded border hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>

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
        secondaryLabel="Seguir editando"
        onSecondary={() => setSuccessModal(null)}
        primaryLabel="Volver a construcciones"
        onPrimary={() => {
          setSuccessModal(null);
          navigate("/construcciones");
        }}
        maxWidthClass="max-w-md"
      >
        <p className="text-sm text-gray-700">{successModal?.message}</p>
      </Modal>
    </div>
  );
};

export default EditarConstruccionPage;
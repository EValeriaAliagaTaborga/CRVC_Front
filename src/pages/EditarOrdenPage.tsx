import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";

const EditarOrdenPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fecha_descarga: new Date().toISOString().slice(0, 10),
    cantidad_final_calidad_primera: 0,
    cantidad_final_calidad_segunda: 0,
    cantidad_final_calidad_tercera: 0,
    estado_orden: "Finalizado",
  });

  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);
  const [modalSuccess, setModalSuccess] = useState<null | { title: string; message?: string }>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOrden = async () => {
      setLoading(true);
      try {
        // Si la API devolviera la orden individual, la usaríamos. Actualmente sólo validamos existencia.
        await axios.get(`http://localhost:3000/api/produccion/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        // opcional: podrías poblar `form` con datos reales si el endpoint lo devuelve
      } catch (error: any) {
        setModalError({
          title: "Error de carga",
          message: error?.response?.data?.message || "Ocurrió un error al cargar la orden. Intenta nuevamente.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrden();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name.includes("cantidad") ? Number(value) : value,
    }));
  };

  const validateBeforeSubmit = (): null | string => {
    if (
      form.cantidad_final_calidad_primera < 0 ||
      form.cantidad_final_calidad_segunda < 0 ||
      form.cantidad_final_calidad_tercera < 0
    ) {
      return "Las cantidades deben ser valores positivos o cero.";
    }
    // más validaciones si se requieren...
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateBeforeSubmit();
    if (err) {
      setModalError({ title: "Validación", message: err });
      return;
    }

    setSaving(true);
    try {
      await axios.put(`http://localhost:3000/api/produccion/${id}`, form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setModalSuccess({
        title: "Orden finalizada",
        message: "Orden finalizada y stock actualizado correctamente.",
      });
    } catch (error: any) {
      setModalError({
        title: "Error al guardar",
        message: error?.response?.data?.message || "Ocurrió un error al guardar. Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando…</p>;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Finalizar Orden de Producción</h2>
          <p className="text-sm text-gray-600 mt-1">Registra cantidades finales y fecha de descarga.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/produccion")}
            className="text-sm text-gray-600 hover:underline"
          >
            ← Volver a Producción
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 md:p-6 rounded shadow space-y-4 max-w-3xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Fecha de descarga</label>
            <input
              type="date"
              name="fecha_descarga"
              value={form.fecha_descarga}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Estado</label>
            <select
              name="estado_orden"
              value={form.estado_orden}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Finalizado">Finalizado</option>
              <option value="En progreso">En progreso</option>
              <option value="Pausado">Pausado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Cantidad final (Calidad Primera)</label>
            <input
              type="number"
              name="cantidad_final_calidad_primera"
              value={form.cantidad_final_calidad_primera}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Cantidad final (Calidad Segunda)</label>
            <input
              type="number"
              name="cantidad_final_calidad_segunda"
              value={form.cantidad_final_calidad_segunda}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Cantidad final (Calidad Tercera)</label>
            <input
              type="number"
              name="cantidad_final_calidad_tercera"
              value={form.cantidad_final_calidad_tercera}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate("/produccion")}
            className="px-4 py-2 rounded border hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

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

      {/* Modal: Success */}
      <Modal
        open={!!modalSuccess}
        title={modalSuccess?.title}
        onClose={() => setModalSuccess(null)}
        secondaryLabel="Seguir en la página"
        onSecondary={() => setModalSuccess(null)}
        primaryLabel="Volver a Producción"
        onPrimary={() => {
          setModalSuccess(null);
          navigate("/produccion");
        }}
      >
        <p className="text-sm text-gray-700">{modalSuccess?.message}</p>
      </Modal>
    </div>
  );
};

export default EditarOrdenPage;
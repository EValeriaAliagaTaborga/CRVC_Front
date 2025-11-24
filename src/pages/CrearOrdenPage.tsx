import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";

interface Producto {
  id_producto: string;
  nombre_producto: string;
  tipo: string;
}

export default function CrearOrdenPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre_producto: "",
    id_vagon: 0,
    fecha_carga: new Date().toISOString().slice(0, 10),
    cantidad_inicial_por_producir: 0,
    estado_orden: "En progreso",
  });

  const [tiposUnicos, setTiposUnicos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);
  const [modalSuccess, setModalSuccess] = useState<null | { title: string; message?: string }>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:3000/api/productos", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const nombres = [
          ...new Set(res.data.map((p: Producto) => p.nombre_producto as string)),
        ] as string[];
        setTiposUnicos(nombres);
      } catch (error: any) {
        setModalError({
          title: "Error al cargar productos",
          message: error?.response?.data?.message || "No se pudieron cargar los productos. Intenta nuevamente.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "id_vagon" || name === "cantidad_inicial_por_producir"
          ? Number(value)
          : value,
    }));
  };

  const validate = (): null | string => {
    if (!form.nombre_producto) return "Selecciona un producto.";
    if (!form.id_vagon || form.id_vagon <= 0) return "Ingresa un número de vagón válido (> 0).";
    if (!form.cantidad_inicial_por_producir || form.cantidad_inicial_por_producir <= 0)
      return "La cantidad inicial a producir debe ser mayor que 0.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setModalError({ title: "Validación", message: v });
      return;
    }

    setSaving(true);
    try {
      await axios.post("http://localhost:3000/api/produccion", form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setModalSuccess({ title: "Orden registrada", message: "Orden creada correctamente ✅" });
    } catch (error: any) {
      setModalError({
        title: "Error al registrar orden",
        message: error?.response?.data?.message || "Ocurrió un error al registrar la orden. Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Registrar Nueva Orden de Producción</h2>
          <p className="text-sm text-gray-600 mt-1">Rellena los datos para crear una orden.</p>
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
            <label className="block font-medium mb-1">Producto</label>
            <select
              name="nombre_producto"
              value={form.nombre_producto}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">{loading ? "Cargando..." : "Seleccionar tipo de ladrillo"}</option>
              {tiposUnicos.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Número de Vagón</label>
            <input
              type="number"
              name="id_vagon"
              value={form.id_vagon}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Fecha de carga</label>
            <input
              type="date"
              name="fecha_carga"
              value={form.fecha_carga}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Cantidad inicial a producir</label>
            <input
              type="number"
              name="cantidad_inicial_por_producir"
              value={form.cantidad_inicial_por_producir}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
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
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Orden"}
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
        primaryLabel="Ir a Producción"
        onPrimary={() => {
          setModalSuccess(null);
          navigate("/produccion");
        }}
      >
        <p className="text-sm text-gray-700">{modalSuccess?.message}</p>
      </Modal>
    </div>
  );
}
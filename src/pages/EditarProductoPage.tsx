import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";

export default function EditarProductoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre_producto: "",
    tipo: "",
    cantidad_stock: 0,
    precio_unitario: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);
  const [modalSuccess, setModalSuccess] = useState<null | { title: string; message?: string }>(null);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/productos/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setForm(res.data);
      } catch (error: any) {
        setModalError({
          title: "Error al cargar el producto",
          message: error?.response?.data?.message || "Intenta nuevamente.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "cantidad_stock" || name === "precio_unitario"
          ? Number(value)
          : value,
    }));
  };

  const validarFormulario = (): string | null => {
    if (!form.nombre_producto.trim()) return "El nombre del producto es obligatorio.";
    if (!form.tipo.trim()) return "El tipo o calidad es obligatorio.";
    if (form.cantidad_stock < 0) return "La cantidad en stock no puede ser negativa.";
    if (form.precio_unitario <= 0) return "El precio unitario debe ser mayor a 0.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validarFormulario();
    if (error) {
      setModalError({ title: "Validación", message: error });
      return;
    }

    setSaving(true);
    try {
      await axios.put(`http://localhost:3000/api/productos/${id}`, form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setModalSuccess({
        title: "Producto actualizado",
        message: "Los cambios fueron guardados correctamente.",
      });
    } catch (error: any) {
      setModalError({
        title: "Error al actualizar",
        message: error?.response?.data?.message || "No se pudieron guardar los cambios.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-4">Cargando…</p>;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">

      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Editar producto</h2>
          <p className="text-sm text-gray-600 mt-1">
            Actualiza la información del producto registrado.
          </p>
        </div>

        <button
          onClick={() => navigate("/productos")}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Volver a Productos
        </button>
      </div>

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 md:p-6 rounded shadow-md space-y-4 max-w-3xl"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="block font-medium mb-1">Nombre del producto</label>
            <input
              type="text"
              name="nombre_producto"
              value={form.nombre_producto}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Tipo / Calidad</label>
            <input
              type="text"
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Cantidad en stock</label>
            <input
              type="number"
              name="cantidad_stock"
              value={form.cantidad_stock}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Precio unitario (Bs)</label>
            <input
              type="number"
              name="precio_unitario"
              value={form.precio_unitario}
              onChange={handleChange}
              min={0}
              step={0.01}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate("/productos")}
            className="px-4 py-2 rounded border hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>

      {/* MODAL ERROR */}
      <Modal
        open={!!modalError}
        title={modalError?.title}
        onClose={() => setModalError(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setModalError(null)}
      >
        <p className="text-sm text-gray-700">{modalError?.message}</p>
      </Modal>

      {/* MODAL SUCCESS */}
      <Modal
        open={!!modalSuccess}
        title={modalSuccess?.title}
        onClose={() => setModalSuccess(null)}
        primaryLabel="Volver a Productos"
        onPrimary={() => {
          setModalSuccess(null);
          navigate("/productos");
        }}
        secondaryLabel="Seguir editando"
        onSecondary={() => setModalSuccess(null)}
      >
        <p className="text-sm text-gray-700">{modalSuccess?.message}</p>
      </Modal>
    </div>
  );
}
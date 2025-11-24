import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";

export default function CrearProductoPage() {
  const [form, setForm] = useState({
    id_producto: "",
    nombre_producto: "",
    tipo: "",
    cantidad_stock: 0,
    precio_unitario: 0,
  });

  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);

  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);
  const [modalSuccess, setModalSuccess] = useState<null | { title: string; message?: string }>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "cantidad_stock" || name === "precio_unitario" ? Number(value) : value,
    }));
  };

  const validarFormulario = (): string | null => {
    if (!form.id_producto.trim()) return "El código del producto es obligatorio.";
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
      await axios.post("http://localhost:3000/api/productos", form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setModalSuccess({
        title: "Producto registrado",
        message: "El producto fue registrado correctamente.",
      });
    } catch (error: any) {
      setModalError({
        title: "Error al registrar el producto",
        message: error?.response?.data?.message || "Hubo un problema registrando el producto.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Registrar nuevo producto</h2>
          <p className="text-sm text-gray-600 mt-1">Completa los campos para registrar un producto.</p>
        </div>

        <button
          onClick={() => navigate("/productos")}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Volver a Productos
        </button>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 md:p-6 rounded shadow-md space-y-4 max-w-3xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="block font-medium mb-1">Código del producto</label>
            <input
              type="text"
              name="id_producto"
              value={form.id_producto}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              placeholder="Ej. Primera, Segunda, Tercera…"
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
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              min={0}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Precio unitario (Bs)</label>
            <input
              type="number"
              name="precio_unitario"
              value={form.precio_unitario}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              min={0}
              step={0.01}
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
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </form>

      {/* Modal Error */}
      <Modal
        open={!!modalError}
        title={modalError?.title}
        onClose={() => setModalError(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setModalError(null)}
      >
        <p className="text-sm text-gray-700">{modalError?.message}</p>
      </Modal>

      {/* Modal Success */}
      <Modal
        open={!!modalSuccess}
        title={modalSuccess?.title}
        onClose={() => setModalSuccess(null)}
        primaryLabel="Ir a Productos"
        onPrimary={() => {
          setModalSuccess(null);
          navigate("/productos");
        }}
        secondaryLabel="Seguir aquí"
        onSecondary={() => setModalSuccess(null)}
      >
        <p className="text-sm text-gray-700">{modalSuccess?.message}</p>
      </Modal>
    </div>
  );
}
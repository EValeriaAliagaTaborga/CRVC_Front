import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

const CrearProductoPage = () => {
  const [form, setForm] = useState({
    id_producto: "",
    nombre_producto: "",
    tipo: "",
    cantidad_stock: 0,
    precio_unitario: 0
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === "cantidad_stock" || name === "precio_unitario"
        ? Number(value)
        : value
    });
  };

  const validarFormulario = () => {
    return (
      form.id_producto.trim() !== "" &&
      form.nombre_producto.trim() !== "" &&
      form.tipo.trim() !== "" &&
      form.cantidad_stock > 0 &&
      form.precio_unitario > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) {
      alert("Por favor completa todos los campos correctamente.");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/productos", form, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      navigate("/productos");
    } catch (error) {
      alert("Error al registrar producto");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Registrar nuevo producto</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4 max-w-xl">
        <div>
          <label className="block font-medium mb-1">Código del producto</label>
          <input
            type="text"
            name="id_producto"
            value={form.id_producto}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Nombre del producto</label>
          <input
            type="text"
            name="nombre_producto"
            value={form.nombre_producto}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Tipo / Calidad</label>
          <input
            type="text"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            placeholder="Ej. Primera, Segunda..."
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Cantidad en stock</label>
          <input
            type="number"
            name="cantidad_stock"
            value={form.cantidad_stock}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
            step={0.01}
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Guardar producto
        </button>
      </form>
    </div>
  );
};

export default CrearProductoPage;

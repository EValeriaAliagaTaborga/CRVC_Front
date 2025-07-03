import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

const EditarProductoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre_producto: "",
    tipo: "",
    cantidad_stock: 0,
    precio_unitario: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/productos/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setForm(res.data);
      } catch (error) {
        alert("Error al cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === "cantidad_stock" || name === "precio_unitario"
        ? Number(value)
        : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/productos/${id}`, form, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      navigate("/productos");
    } catch (error) {
      alert("Error al actualizar producto");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Editar producto</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4 max-w-xl">
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default EditarProductoPage;

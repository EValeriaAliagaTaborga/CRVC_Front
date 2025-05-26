import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

interface Producto {
  id_producto: string;
  nombre_producto: string;
  tipo: string;
  cantidad_stock: number;
  precio_unitario: number;
}

const ProductosPage = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 20;

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/productos", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        setProductos(res.data);
      } catch (error) {
        alert("Error al cargar productos");
      }
    };

    fetchProductos();
  }, []);

  const productosFiltrados = productos.filter((p) =>
    p.nombre_producto.toLowerCase().includes(filtroNombre.toLowerCase()) &&
    (filtroTipo ? p.tipo === filtroTipo : true)
  );

  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
  const productosPagina = productosFiltrados.slice(
    (paginaActual - 1) * productosPorPagina,
    paginaActual * productosPorPagina
  );

  const handleEliminar = async (id_producto: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/productos/${id_producto}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      setProductos(productos.filter((p) => p.id_producto !== id_producto));
    } catch (error) {
      alert("Error al eliminar el producto");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Productos registrados</h2>
        <Link
          to="/productos/crear"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Registrar producto
        </Link>
      </div>

      <div className="mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-sm">Buscar por nombre</label>
          <input
            type="text"
            value={filtroNombre}
            onChange={(e) => setFiltroNombre(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm">Filtrar por tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border rounded p-2"
          >
            <option value="">Todos</option>
            <option value="Primera">Primera</option>
            <option value="Segunda">Segunda</option>
            <option value="Tercera">Tercera</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-md rounded overflow-x-auto">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Precio unitario</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosPagina.map((p) => (
              <tr key={p.id_producto} className="border-t">
                <td className="px-4 py-2">{p.id_producto}</td>
                <td className="px-4 py-2">{p.nombre_producto}</td>
                <td className="px-4 py-2">{p.tipo}</td>
                <td className="px-4 py-2">{p.cantidad_stock}</td>
                <td className="px-4 py-2">Bs {p.precio_unitario.toFixed(2)}</td>
                <td className="px-4 py-2 space-x-2">
                  <Link
                    to={`/productos/${p.id_producto}/editar`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleEliminar(p.id_producto)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {productosPagina.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPaginaActual(n)}
              className={`px-3 py-1 rounded ${n === paginaActual ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductosPage;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

interface DetallePedido {
  id_detalle_pedido: number;
  id_producto: string;
  cantidad_pedida: number;
  precio_total: number;
  fecha_estimada_entrega: string;
  nombre_producto: string;
  tipo: string;
}

interface Pedido {
  id_pedido: number;
  fecha_creacion_pedido: string;
  precio_pedido: string;
  descuento_pedido: string;
  estado_pedido: string;
  direccion: string;
  cliente: string;
  detalles: DetallePedido[];
}

const PedidosPage = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtros, setFiltros] = useState({
    cliente: "",
    direccion: "",
    estado: "",
    fechaInicio: "",
    fechaFin: ""
  });

  const [pagina, setPagina] = useState(1);
  const porPagina = 15;

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/pedidos", {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setPedidos(res.data);
      } catch (error) {
        console.error("Error al obtener pedidos", error);
      }
    };

    fetchPedidos();
  }, []);

  const handleEliminar = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este pedido?")) {
      try {
        await axios.delete(`http://localhost:3000/api/pedidos/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setPedidos(pedidos.filter(p => p.id_pedido !== id));
      } catch (error) {
        alert("Error al eliminar pedido");
      }
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const fecha = new Date(p.fecha_creacion_pedido);
    const inicio = filtros.fechaInicio ? new Date(filtros.fechaInicio) : null;
    const fin = filtros.fechaFin ? new Date(filtros.fechaFin) : null;

    return (
      p.cliente.toLowerCase().includes(filtros.cliente.toLowerCase()) &&
      p.direccion.toLowerCase().includes(filtros.direccion.toLowerCase()) &&
      p.estado_pedido.toLowerCase().includes(filtros.estado.toLowerCase()) &&
      (!inicio || fecha >= inicio) &&
      (!fin || fecha <= fin)
    );
  });

  const totalPaginas = Math.ceil(pedidosFiltrados.length / porPagina);
  const pedidosPagina = pedidosFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
    setPagina(1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pedidos registrados</h2>
        <Link
          to="/pedidos/crear"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Registrar pedido
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          name="cliente"
          placeholder="Filtrar por cliente"
          value={filtros.cliente}
          onChange={handleFiltroChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="direccion"
          placeholder="Filtrar por construcción"
          value={filtros.direccion}
          onChange={handleFiltroChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="estado"
          placeholder="Filtrar por estado"
          value={filtros.estado}
          onChange={handleFiltroChange}
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="fechaInicio"
          value={filtros.fechaInicio}
          onChange={handleFiltroChange}
          className="p-2 border rounded"
        />
        <input
          type="date"
          name="fechaFin"
          value={filtros.fechaFin}
          onChange={handleFiltroChange}
          className="p-2 border rounded"
        />
      </div>

      <div className="bg-white shadow-md rounded overflow-x-auto">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Construcción</th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Descuento</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Productos</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidosPagina.map((p) => (
              <tr key={p.id_pedido} className="border-t align-top">
                <td className="px-4 py-2">{p.cliente}</td>
                <td className="px-4 py-2">{p.direccion}</td>
                <td className="px-4 py-2">{new Date(p.fecha_creacion_pedido).toLocaleDateString()}</td>
                <td className="px-4 py-2">Bs {parseFloat(p.precio_pedido).toFixed(2)}</td>
                <td className="px-4 py-2">{p.descuento_pedido}%</td>
                <td className="px-4 py-2">{p.estado_pedido}</td>
                <td className="px-4 py-2">
                  {p.detalles.length > 0 ? (
                    <ul className="list-disc pl-4">
                      {p.detalles.map((d) => (
                        <li key={d.id_detalle_pedido}>
                          {d.nombre_producto} ({d.tipo}) - {d.cantidad_pedida} uds.
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">Sin productos</span>
                  )}
                </td>
                <td className="px-4 py-2 space-y-2">
                  <button
                    onClick={() => handleEliminar(p.id_pedido)}
                    className="text-red-600 hover:underline text-sm block"
                  >
                    Eliminar
                  </button>
                  <Link
                    to={`/pedidos/${p.id_pedido}/estado`}
                    className="text-blue-600 hover:underline text-sm block"
                  >
                    Cambiar estado
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-center items-center mt-4 gap-4">
        <button
          onClick={() => setPagina(p => Math.max(p - 1, 1))}
          disabled={pagina === 1}
          className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200"
        >
          Anterior
        </button>
        <span className="font-medium">Página {pagina} de {totalPaginas}</span>
        <button
          onClick={() => setPagina(p => Math.min(p + 1, totalPaginas))}
          disabled={pagina === totalPaginas}
          className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default PedidosPage;

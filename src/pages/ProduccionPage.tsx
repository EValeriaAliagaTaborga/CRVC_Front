import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

interface OrdenProduccion {
  id_orden: number;
  nombre_producto: string;
  id_vagon: number;
  fecha_carga: string;
  fecha_descarga: string;
  cantidad_final_calidad_primera: number;
  cantidad_final_calidad_segunda: number;
  cantidad_final_calidad_tercera: number;
  estado_orden: string;
}

const ProduccionPage = () => {
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
  const [filtros, setFiltros] = useState({
    id_vagon: "",
    nombre_producto: "",
    fecha_carga: "",
    fecha_descarga: "",
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 15;

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/produccion", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setOrdenes(res.data);
      } catch (error) {
        alert("Error al cargar órdenes de producción");
      }
    };

    fetchOrdenes();
  }, []);

  // Filtrado
  const ordenesFiltradas = ordenes.filter((orden) => {
    const matchVagon =
      filtros.id_vagon === "" || orden.id_vagon.toString().includes(filtros.id_vagon);
    const matchProducto =
      filtros.nombre_producto === "" || orden.nombre_producto.toLowerCase().includes(filtros.nombre_producto.toLowerCase());
    const matchFechaCarga =
      filtros.fecha_carga === "" || orden.fecha_carga.startsWith(filtros.fecha_carga);
    const matchFechaDescarga =
      filtros.fecha_descarga === "" || orden.fecha_descarga.startsWith(filtros.fecha_descarga);
    return matchVagon && matchProducto && matchFechaCarga && matchFechaDescarga;
  });

  const totalPaginas = Math.ceil(ordenesFiltradas.length / elementosPorPagina);
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const ordenesPaginadas = ordenesFiltradas.slice(inicio, inicio + elementosPorPagina);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Órdenes de Producción</h2>
        <Link
          to="/produccion/crear"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nueva Orden
        </Link>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por vagón"
          value={filtros.id_vagon}
          onChange={(e) => setFiltros({ ...filtros, id_vagon: e.target.value })}
          className="border px-3 py-2 rounded"
        />
        <input
          type="text"
          placeholder="Buscar por producto"
          value={filtros.nombre_producto}
          onChange={(e) => setFiltros({ ...filtros, nombre_producto: e.target.value })}
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={filtros.fecha_carga}
          onChange={(e) => setFiltros({ ...filtros, fecha_carga: e.target.value })}
          className="border px-3 py-2 rounded"
        />
        <input
          type="date"
          value={filtros.fecha_descarga}
          onChange={(e) => setFiltros({ ...filtros, fecha_descarga: e.target.value })}
          className="border px-3 py-2 rounded"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-md rounded overflow-x-auto">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Vagón</th>
              <th className="px-4 py-2">Fecha de carga</th>
              <th className="px-4 py-2">Fecha de descarga</th>
              <th className="px-4 py-2">Calidad Primera</th>
              <th className="px-4 py-2">Calidad Segunda</th>
              <th className="px-4 py-2">Calidad Tercera</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenesPaginadas.map((orden) => (
              <tr key={orden.id_orden} className="border-t">
                <td className="px-4 py-2">{orden.id_orden}</td>
                <td className="px-4 py-2">{orden.nombre_producto}</td>
                <td className="px-4 py-2">{orden.id_vagon}</td>
                <td className="px-4 py-2">{new Date(orden.fecha_carga).toLocaleDateString()}</td>
                <td className="px-4 py-2">{new Date(orden.fecha_descarga).toLocaleDateString()}</td>
                <td className="px-4 py-2">{orden.cantidad_final_calidad_primera}</td>
                <td className="px-4 py-2">{orden.cantidad_final_calidad_segunda}</td>
                <td className="px-4 py-2">{orden.cantidad_final_calidad_tercera}</td>
                <td className="px-4 py-2">{orden.estado_orden}</td>
                <td className="px-4 py-2">
                  {orden.estado_orden === "En progreso" && (
                    <Link
                      to={`/produccion/${orden.id_orden}/editar`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Finalizar
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {ordenesPaginadas.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-4 text-gray-500">
                  No hay órdenes que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPaginas }, (_, i) => (
          <button
            key={i}
            onClick={() => setPaginaActual(i + 1)}
            className={`px-3 py-1 rounded ${paginaActual === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProduccionPage;

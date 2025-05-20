import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

interface OrdenProduccion {
  id_orden: number;
  id_producto: string;
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

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/produccion", {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setOrdenes(res.data);
      } catch (error) {
        alert("Error al cargar órdenes de producción");
      }
    };

    fetchOrdenes();
  }, []);

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

      <div className="bg-white shadow-md rounded overflow-x-auto">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Vagón</th>
              <th className="px-4 py-2">Fecha de carga</th>
              <th className="px-4 py-2">Fecha de descarga</th>
              <th className="px-4 py-2">Cantidad Producida - Calidad Primera</th>
              <th className="px-4 py-2">Cantidad Producida - Calidad Segunda</th>
              <th className="px-4 py-2">Cantidad Producida - Calidad Tercera</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr key={orden.id_orden} className="border-t">
                <td className="px-4 py-2">{orden.id_orden}</td>
                <td className="px-4 py-2">{orden.id_producto}</td>
                <td className="px-4 py-2">{orden.id_vagon}</td>
                <td className="px-4 py-2">{new Date(orden.fecha_carga).toLocaleDateString()}</td>
                <td className="px-4 py-2">{new Date(orden.fecha_descarga).toLocaleDateString()}</td>
                <td className="px-4 py-2">{orden.cantidad_final_calidad_primera}</td>
                <td className="px-4 py-2">{orden.cantidad_final_calidad_segunda}</td>
                <td className="px-4 py-2">{orden.cantidad_final_calidad_tercera}</td>
                <td className="px-4 py-2">{orden.estado_orden}</td>
                <td className="px-4 py-2 space-x-2">
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
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No hay órdenes de producción registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProduccionPage;

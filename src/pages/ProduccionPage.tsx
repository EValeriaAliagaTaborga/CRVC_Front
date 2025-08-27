import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

interface Demanda {
  id_demanda: number;
  id_producto: string;
  nombre_producto: string;
  tipo: string;
  cantidad_pendiente: number;
  fecha_objetivo?: string | null;
  actualizado_en: string;
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

  // Demandas de producción
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [filtroDemanda, setFiltroDemanda] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    const fetchAll = async () => {
      try {
        const [o, d] = await Promise.all([
          axios.get("http://localhost:3000/api/produccion", { headers }),
          axios.get("http://localhost:3000/api/produccion/demandas", { headers }),
        ]);
        setOrdenes(o.data || []);
        setDemandas(d.data || []);
      } catch (error) {
        alert("Error al cargar datos de producción");
      }
    };
    fetchAll();
  }, []);

  // Filtrado de órdenes
  const ordenesFiltradas = ordenes.filter((orden) => {
    const matchVagon =
      filtros.id_vagon === "" || orden.id_vagon.toString().includes(filtros.id_vagon);
    const matchProducto =
      filtros.nombre_producto === "" || orden.nombre_producto.toLowerCase().includes(filtros.nombre_producto.toLowerCase());
    const matchFechaCarga =
      filtros.fecha_carga === "" || orden.fecha_carga?.startsWith(filtros.fecha_carga);
    const matchFechaDescarga =
      filtros.fecha_descarga === "" || orden.fecha_descarga?.startsWith(filtros.fecha_descarga);
    return matchVagon && matchProducto && matchFechaCarga && matchFechaDescarga;
  });

  const totalPaginas = Math.ceil(ordenesFiltradas.length / elementosPorPagina);
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const ordenesPaginadas = ordenesFiltradas.slice(inicio, inicio + elementosPorPagina);

  // Filtrado y totales de demandas
  const demandasFiltradas = useMemo(() => {
    const q = filtroDemanda.trim().toLowerCase();
    if (!q) return demandas;
    return demandas.filter(
      d =>
        d.id_producto.toLowerCase().includes(q) ||
        d.nombre_producto.toLowerCase().includes(q) ||
        d.tipo.toLowerCase().includes(q)
    );
  }, [demandas, filtroDemanda]);

  const totalesDemandas = useMemo(() => {
    const total = demandasFiltradas.reduce((acc, d) => acc + Number(d.cantidad_pendiente || 0), 0);
    return { total };
  }, [demandasFiltradas]);

  const crearOrdenDesdeDemanda = (d: Demanda) => {
    // Redirige al form de creación con query pre-rellena
    const qp = new URLSearchParams({
      nombre_producto: d.nombre_producto,
      tipo: d.tipo,
      // id_vagon lo decide el encargado
      cantidad_inicial_por_producir: String(d.cantidad_pendiente || 0),
      sugerido_por: "demanda",
      id_producto: d.id_producto,
    }).toString();
    navigate(`/produccion/crear?${qp}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Órdenes de Producción</h2>
        <Link
          to="/produccion/crear"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nueva Orden
        </Link>
      </div>

      {/* Demandas de producción */}
      <section className="bg-white rounded shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Demandas pendientes</h3>
            <p className="text-gray-500 text-sm">
              Recomendación automática basada en pedidos registrados. Usa estas cantidades para planificar hornos.
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-600">Buscar</label>
            <input
              value={filtroDemanda}
              onChange={(e) => setFiltroDemanda(e.target.value)}
              placeholder="Producto, código o tipo…"
              className="border rounded px-3 py-1"
            />
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Total unidades:</span> {totalesDemandas.total}
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-left">Fecha objetivo</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {demandasFiltradas.map((d) => (
                <tr key={d.id_demanda} className="border-t">
                  <td className="px-3 py-2">{d.id_producto}</td>
                  <td className="px-3 py-2">{d.nombre_producto}</td>
                  <td className="px-3 py-2">{d.tipo}</td>
                  <td className="px-3 py-2 text-right">{d.cantidad_pendiente}</td>
                  <td className="px-3 py-2">{d.fecha_objetivo ? new Date(d.fecha_objetivo).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => crearOrdenDesdeDemanda(d)}
                      className="text-blue-600 hover:underline"
                    >
                      Crear orden sugerida
                    </button>
                  </td>
                </tr>
              ))}
              {demandasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No hay demandas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Filtros Órdenes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Tabla Órdenes */}
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
                <td className="px-4 py-2">{orden.fecha_carga ? new Date(orden.fecha_carga).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2">{orden.fecha_descarga ? new Date(orden.fecha_descarga).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2">{orden.cantidad_final_calidad_primera ?? 0}</td>
                <td className="px-4 py-2">{orden.cantidad_final_calidad_segunda ?? 0}</td>
                <td className="px-4 py-2">{orden.cantidad_final_calidad_tercera ?? 0}</td>
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

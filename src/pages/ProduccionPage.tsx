// src/pages/ProduccionPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import ActionGroup from "../components/ActionGroup";

interface OrdenProduccion {
  id_orden: number;
  nombre_producto: string;
  id_vagon: number;
  fecha_carga: string | null;
  fecha_descarga: string | null;
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

  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [filtroDemanda, setFiltroDemanda] = useState("");

  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [o, d] = await Promise.all([
          axios.get("http://localhost:3000/api/produccion", { headers }),
          axios.get("http://localhost:3000/api/produccion/demandas", { headers }),
        ]);
        setOrdenes(o.data || []);
        setDemandas(d.data || []);
      } catch (err: any) {
        setModalError({
          title: "Error al cargar datos de producción",
          message: err?.response?.data?.message || "No se pudieron cargar los datos. Intenta nuevamente.",
        });
      } finally {
        setLoading(false);
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
      filtros.fecha_carga === "" || (orden.fecha_carga ? orden.fecha_carga.startsWith(filtros.fecha_carga) : false);
    const matchFechaDescarga =
      filtros.fecha_descarga === "" || (orden.fecha_descarga ? orden.fecha_descarga.startsWith(filtros.fecha_descarga) : false);
    return matchVagon && matchProducto && matchFechaCarga && matchFechaDescarga;
  });

  const totalPaginas = Math.max(1, Math.ceil(ordenesFiltradas.length / elementosPorPagina));
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const ordenesPaginadas = ordenesFiltradas.slice(inicio, inicio + elementosPorPagina);

  // Filtrado demandas
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
    const qp = new URLSearchParams({
      nombre_producto: d.nombre_producto,
      tipo: d.tipo,
      cantidad_inicial_por_producir: String(d.cantidad_pendiente || 0),
      sugerido_por: "demanda",
      id_producto: d.id_producto,
    }).toString();
    navigate(`/produccion/crear?${qp}`);
  };

  if (loading) return <p className="p-4">Cargando…</p>;

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Demandas pendientes</h3>
            <p className="text-gray-500 text-sm">
              Recomendación automática basada en pedidos registrados.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <SearchInput
              id="search-demandas"
              value={filtroDemanda}
              onChange={setFiltroDemanda}
              placeholder="Producto, código o tipo…"
              className="md:w-72"
            />
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total unidades:</span> {totalesDemandas.total}
            </div>
          </div>
        </div>

        {/* Desktop table for demandas */}
        <div className="hidden md:block overflow-x-auto mt-3">
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
                    <ActionGroup
                      primary={{
                        label: "Crear orden sugerida",
                        onClick: () => crearOrdenDesdeDemanda(d),
                        ariaLabel: `Crear orden sugerida para ${d.id_producto}`,
                        variant: "link",
                      }}
                    />
                  </td>
                </tr>
              ))}
              {demandasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">No hay demandas para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards for demandas */}
        <div className="md:hidden mt-3 space-y-3">
          {demandasFiltradas.length === 0 ? (
            <div className="p-4 border rounded text-center text-gray-500">No hay demandas para mostrar.</div>
          ) : (
            demandasFiltradas.map((d) => (
              <article key={d.id_demanda} className="p-3 border rounded bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{d.nombre_producto} <span className="text-xs text-gray-500">({d.id_producto})</span></div>
                    <div className="text-xs text-gray-600 mt-1">{d.tipo}</div>
                    <div className="text-xs text-gray-700 mt-2"><span className="font-medium">Cantidad:</span> {d.cantidad_pendiente}</div>
                    <div className="text-xs text-gray-500 mt-1">{d.fecha_objetivo ? new Date(d.fecha_objetivo).toLocaleDateString() : "Fecha objetivo: —"}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <ActionGroup
                      primary={{
                        label: "Crear orden",
                        onClick: () => crearOrdenDesdeDemanda(d),
                        ariaLabel: `Crear orden sugerida para ${d.id_producto}`,
                        variant: "link",
                      }}
                    />
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Filtros Órdenes (usa SearchInput para producto) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SearchInput
          id="filter-vagon"
          value={filtros.id_vagon}
          onChange={(v) => { setPaginaActual(1); setFiltros({ ...filtros, id_vagon: v }); }}
          placeholder="Buscar por vagón"
          className=""
          label="Vagón"
        />
        <SearchInput
          id="filter-producto"
          value={filtros.nombre_producto}
          onChange={(v) => { setPaginaActual(1); setFiltros({ ...filtros, nombre_producto: v }); }}
          placeholder="Buscar por producto"
          className=""
          label="Producto"
        />
        <div>
          <label className="block text-xs text-gray-600">Fecha carga</label>
          <input
            type="date"
            value={filtros.fecha_carga}
            onChange={(e) => { setPaginaActual(1); setFiltros({ ...filtros, fecha_carga: e.target.value }); }}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Fecha descarga</label>
          <input
            type="date"
            value={filtros.fecha_descarga}
            onChange={(e) => { setPaginaActual(1); setFiltros({ ...filtros, fecha_descarga: e.target.value }); }}
            className="border px-3 py-2 rounded w-full"
          />
        </div>
      </div>

      {/* Tabla Órdenes (desktop) */}
      <div className="bg-white shadow-md rounded overflow-x-auto">
        <div className="hidden md:block">
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
                    {orden.estado_orden === "En progreso" ? (
                      <ActionGroup
                        primary={{
                          label: "Finalizar",
                          href: `/produccion/${orden.id_orden}/editar`,
                          ariaLabel: `Finalizar orden ${orden.id_orden}`,
                          variant: "link",
                        }}
                      />
                    ) : (
                      <span className="text-sm text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {ordenesPaginadas.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-gray-500">No hay órdenes que coincidan con los filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards for órdenes */}
        <div className="md:hidden p-3 space-y-3">
          {ordenesPaginadas.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No hay órdenes que coincidan con los filtros.</div>
          ) : (
            ordenesPaginadas.map((orden) => (
              <article key={orden.id_orden} className="p-3 border rounded bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">Orden #{orden.id_orden}</div>
                    <div className="text-xs text-gray-700 mt-1">{orden.nombre_producto}</div>
                    <div className="text-xs text-gray-500 mt-1">Vagón: {orden.id_vagon}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Carga: {orden.fecha_carga ? new Date(orden.fecha_carga).toLocaleDateString() : "—"}
                    </div>
                    <div className="text-xs text-gray-500">Estado: <span className="font-medium">{orden.estado_orden}</span></div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {orden.estado_orden === "En progreso" ? (
                      <ActionGroup
                        primary={{
                          label: "Finalizar",
                          href: `/produccion/${orden.id_orden}/editar`,
                          ariaLabel: `Finalizar orden ${orden.id_orden}`,
                          variant: "link",
                        }}
                      />
                    ) : (
                      <span className="text-sm text-gray-600">—</span>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Paginación */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPaginas }, (_, i) => (
          <button
            key={i}
            onClick={() => setPaginaActual(i + 1)}
            className={`px-3 py-1 rounded ${paginaActual === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Error modal */}
      <Modal
        open={!!modalError}
        title={modalError?.title}
        onClose={() => setModalError(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setModalError(null)}
      >
        <p className="text-sm text-gray-700">{modalError?.message}</p>
      </Modal>
    </div>
  );
};

export default ProduccionPage;
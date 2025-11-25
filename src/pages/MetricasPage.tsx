import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getToken } from "../services/auth";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

const MetricasPage = () => {
  const [productosMasVendidos, setProductosMasVendidos] = useState<any[]>([]);
  const [ingresosPorMes, setIngresosPorMes] = useState<any[]>([]);
  const [promedioDescuento, setPromedioDescuento] = useState<number>(0);
  const [perdidaPorOrden, setPerdidaPorOrden] = useState<any[]>([]);
  const [produccionPorCalidadMensual, setProduccionPorCalidadMensual] =
    useState<any[]>([]);
  const [promedioPerdidaMensual, setPromedioPerdidaMensual] =
    useState<number>(0);
  const [kpis, setKpis] = useState<{
    total_vendidos: number;
    total_ingresos: number;
    total_pedidos: number;
    tasa_perdida: number;
  } | null>(null);
  const [distribucionEstados, setDistribucionEstados] = useState<any[]>([]);
  const [tasaFinalizacion, setTasaFinalizacion] = useState<{
    ordenes_finalizadas: number;
    total_ordenes: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          prodRes,
          ingresosRes,
          descuentoRes,
          perdidaRes,
          calidadRes,
          promedioPerdidaRes,
          kpiRes,
          estadosRes,
          finalizacionRes,
        ] = await Promise.all([
          axios.get("http://localhost:3000/api/metricas/productos-mas-vendidos", { headers: { Authorization: `Bearer ${getToken()}` } }),
          axios.get("http://localhost:3000/api/metricas/ingresos-mensuales", { headers: { Authorization: `Bearer ${getToken()}` } }),
          axios.get("http://localhost:3000/api/metricas/promedio-descuento", { headers: { Authorization: `Bearer ${getToken()}` } }),
          axios.get("http://localhost:3000/api/metricas/produccion-perdida-por-orden", { headers: { Authorization: `Bearer ${getToken()}` } }),
          axios.get("http://localhost:3000/api/metricas/produccion-por-calidad-mensual", { headers: { Authorization: `Bearer ${getToken()}` } }),
          axios.get("http://localhost:3000/api/metricas/produccion-promedio-perdida-mes", { headers: { Authorization: `Bearer ${getToken()}` } }),
          axios.get("http://localhost:3000/api/metricas/kpis", { headers: { Authorization: `Bearer ${getToken()}` } }),
          axios.get("http://localhost:3000/api/metricas/distribucion-pedidos", { headers: { Authorization: `Bearer ${getToken()}` } }),
          axios.get("http://localhost:3000/api/metricas/tasa-finalizacion", { headers: { Authorization: `Bearer ${getToken()}` } }),
        ]);

        setProductosMasVendidos(prodRes.data || []);
        setIngresosPorMes(ingresosRes.data || []);
        setPromedioDescuento(Number(descuentoRes.data?.[0]?.promedio_descuento ?? 0));
        setPerdidaPorOrden(perdidaRes.data || []);
        setProduccionPorCalidadMensual(calidadRes.data || []);
        setPromedioPerdidaMensual(Number(promedioPerdidaRes.data?.[0]?.promedio_perdida ?? 0));
        setKpis(kpiRes.data || null);
        setDistribucionEstados(estadosRes.data || []);
        setTasaFinalizacion(finalizacionRes.data || null);
      } catch (error) {
        console.error("Error al cargar métricas", error);
      }
    };

    fetchData();
  }, []);

  const tasaFinalizacionArray = [
    {
      tipo: "Finalizadas",
      cantidad: tasaFinalizacion?.ordenes_finalizadas || 0,
    },
    {
      tipo: "No finalizadas",
      cantidad:
        (tasaFinalizacion?.total_ordenes ?? 0) -
        (tasaFinalizacion?.ordenes_finalizadas ?? 0),
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard de Métricas</h2>

      {/* KPIs: responsive grid with wrapping to avoid overflow */}
      {kpis && (
        <div className="w-full mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded p-4 overflow-hidden">
              <p className="text-gray-500">🧱 Productos Vendidos</p>
              <p className="text-2xl font-bold break-words">{kpis.total_vendidos}</p>
            </div>
            <div className="bg-white shadow rounded p-4 overflow-hidden">
              <p className="text-gray-500">💰 Total Ingresos</p>
              <p className="text-2xl font-bold">Bs {Number(kpis.total_ingresos).toFixed(2)}</p>
            </div>
            <div className="bg-white shadow rounded p-4 overflow-hidden">
              <p className="text-gray-500">🧾 Total Pedidos</p>
              <p className="text-2xl font-bold">{kpis.total_pedidos}</p>
            </div>
            <div className="bg-white shadow rounded p-4 overflow-hidden">
              <p className="text-gray-500">🔥 Tasa Promedio de Pérdida</p>
              <p className="text-2xl font-bold">{Number(kpis.tasa_perdida).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts grid: single column on mobile, two columns on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie: Distribución */}
        <div className="bg-white shadow-md rounded p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-3">Distribución de pedidos por estado</h3>
          <div className="w-full h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribucionEstados}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {distribucionEstados.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar: Tasa finalizacion */}
        <div className="bg-white shadow-md rounded p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-3">Tasa de finalización de órdenes</h3>
          <div className="w-full h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasaFinalizacionArray}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" tick={{ angle: -20, textAnchor: 'end' }} height={50} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white shadow-md rounded p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-3">Productos más vendidos</h3>
          <div className="w-full h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {Array.isArray(productosMasVendidos) && productosMasVendidos.length > 0 ? (
                <BarChart data={productosMasVendidos}>
                  <XAxis dataKey="nombre_producto" tick={{ angle: -25, textAnchor: 'end' }} height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_vendido" fill="#8884d8" />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full">Cargando o sin datos</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ingresos por mes */}
        <div className="bg-white shadow-md rounded p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-3">Ingresos por mes</h3>
          <div className="w-full h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {Array.isArray(ingresosPorMes) && ingresosPorMes.length > 0 ? (
                <LineChart data={ingresosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ angle: -20, textAnchor: 'end' }} height={50} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="#82ca9d" />
                </LineChart>
              ) : (
                <div className="flex items-center justify-center h-full">Cargando o sin datos</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Produccion por calidad */}
        <div className="bg-white shadow-md rounded p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-3">Producción mensual por calidad</h3>
          <div className="w-full h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={produccionPorCalidadMensual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ angle: -20, textAnchor: 'end' }} height={50} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="primera" stackId="a" fill="#8884d8" />
                <Bar dataKey="segunda" stackId="a" fill="#82ca9d" />
                <Bar dataKey="tercera" stackId="a" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Perdida por orden */}
        <div className="bg-white shadow-md rounded p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-3">Pérdida por orden (%)</h3>
          <div className="w-full h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perdidaPorOrden}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id_orden" tick={{ angle: -20, textAnchor: 'end' }} height={50} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="porcentaje_perdida" stroke="#ff7f50" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Small stat blocks: use full width on mobile and limited width on larger screens */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="bg-white shadow-md rounded p-4 w-full sm:max-w-md overflow-hidden">
          <h3 className="text-lg font-semibold mb-2">Promedio de descuento en pedidos</h3>
          <p className="text-4xl text-blue-600 font-bold">{Number(promedioDescuento).toFixed(2)}%</p>
        </div>

        <div className="bg-white shadow-md rounded p-4 w-full sm:max-w-md overflow-hidden">
          <h3 className="text-lg font-semibold mb-2">Promedio de pérdida mensual</h3>
          <p className="text-4xl text-red-600 font-bold">{Number(promedioPerdidaMensual).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
};

export default MetricasPage;
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
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [ingresosPorMes, setIngresosPorMes] = useState([]);
  const [promedioDescuento, setPromedioDescuento] = useState<number>(0);
  const [perdidaPorOrden, setPerdidaPorOrden] = useState([]);
  const [produccionPorCalidadMensual, setProduccionPorCalidadMensual] =
    useState([]);
  const [promedioPerdidaMensual, setPromedioPerdidaMensual] =
    useState<number>(0);
  const [kpis, setKpis] = useState<{
    total_vendidos: number;
    total_ingresos: number;
    total_pedidos: number;
    tasa_perdida: number;
  } | null>(null);
  const [distribucionEstados, setDistribucionEstados] = useState([]);
  const [tasaFinalizacion, setTasaFinalizacion] = useState<{ ordenes_finalizadas: number; total_ordenes: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await axios.get(
          "http://localhost:3000/api/metricas/productos-mas-vendidos",
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        const ingresosRes = await axios.get(
          "http://localhost:3000/api/metricas/ingresos-mensuales",
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        const descuentoRes = await axios.get(
          "http://localhost:3000/api/metricas/promedio-descuento",
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        const perdidaRes = await axios.get(
          "http://localhost:3000/api/metricas/produccion-perdida-por-orden",
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );
        const calidadRes = await axios.get(
          "http://localhost:3000/api/metricas/produccion-por-calidad-mensual",
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );
        const promedioPerdidaRes = await axios.get(
          "http://localhost:3000/api/metricas/produccion-promedio-perdida-mes",
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );

        const kpiRes = await axios.get(
          "http://localhost:3000/api/metricas/kpis",
          {
            headers: { Authorization: `Bearer ${getToken()}` },
          }
        );

        const estadosRes = await axios.get(
          "http://localhost:3000/api/metricas/distribucion-pedidos",
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        const finalizacionRes = await axios.get(
          "http://localhost:3000/api/metricas/tasa-finalizacion",
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        console.log("🧱 Productos más vendidos:", prodRes.data);
        console.log("📈 Ingresos por mes:", ingresosRes.data);
        console.log(
          "💸 Promedio descuento:",
          descuentoRes.data[0]?.promedio_descuento
        );
        console.log("🧱 Perdida por orden:", perdidaRes.data);
        console.log("📈 Produccion por calidad mensual:", calidadRes.data);
        console.log(
          "💸 Promedio perdida mensual:",
          promedioPerdidaRes.data[0]?.promedio_perdida
        );
        console.log("📊 KPIs:", kpiRes.data);
        console.log("📦 Distribución por estado:", estadosRes.data);
        console.log("✅ Tasa de finalización:", finalizacionRes.data);

        setProductosMasVendidos(prodRes.data);
        setIngresosPorMes(ingresosRes.data);
        setPromedioDescuento(Number(descuentoRes.data[0]?.promedio_descuento));
        setPerdidaPorOrden(perdidaRes.data);
        setProduccionPorCalidadMensual(calidadRes.data);
        setPromedioPerdidaMensual(
          Number(promedioPerdidaRes.data[0]?.promedio_perdida)
        );
        setKpis(kpiRes.data);
        setDistribucionEstados(estadosRes.data);
        setTasaFinalizacion(finalizacionRes.data);
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
      cantidad: ((tasaFinalizacion?.total_ordenes ?? 0) - (tasaFinalizacion?.ordenes_finalizadas ?? 0)),
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard de Métricas</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KPIs */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow rounded p-4">
              <p className="text-gray-500">🧱 Productos Vendidos</p>
              <p className="text-2xl font-bold">{kpis.total_vendidos}</p>
            </div>
            <div className="bg-white shadow rounded p-4">
              <p className="text-gray-500">💰 Total Ingresos</p>
              <p className="text-2xl font-bold">
                Bs {Number(kpis.total_ingresos).toFixed(2)}
              </p>
            </div>
            <div className="bg-white shadow rounded p-4">
              <p className="text-gray-500">🧾 Total Pedidos</p>
              <p className="text-2xl font-bold">{kpis.total_pedidos}</p>
            </div>
            <div className="bg-white shadow rounded p-4">
              <p className="text-gray-500">🔥 Tasa Promedio de Pérdida</p>
              <p className="text-2xl font-bold">
                {Number(kpis.tasa_perdida).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        <div className="bg-white shadow-md rounded p-4">
          <h3 className="text-lg font-semibold mb-4">
            Distribución de pedidos por estado
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribucionEstados}
                dataKey="cantidad"
                nameKey="estado"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {distribucionEstados.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow-md rounded p-4">
          <h3 className="text-lg font-semibold mb-4">
            Tasa de finalización de órdenes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tasaFinalizacionArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico: Productos más vendidos */}
        <div className="bg-white shadow-md rounded p-4">
          <h3 className="text-lg font-semibold mb-4">Productos más vendidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            {Array.isArray(productosMasVendidos) &&
            productosMasVendidos.length > 0 ? (
              <BarChart data={productosMasVendidos}>
                <XAxis dataKey="nombre_producto" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_vendido" fill="#8884d8" />
              </BarChart>
            ) : (
              // Optionally render a loading state or a message if data is not available
              <div>Cargando... o Data no disponible.</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Gráfico: Ingresos por mes */}
        <div className="bg-white shadow-md rounded p-4">
          <h3 className="text-lg font-semibold mb-4">Ingresos por mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            {Array.isArray(ingresosPorMes) && ingresosPorMes.length > 0 ? (
              <LineChart data={ingresosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#82ca9d" />
              </LineChart>
            ) : (
              // Optionally render a loading state or a message if data is not available
              <div>Cargando... o Data no disponible.</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Promedio de Descuento */}
      <div className="mt-8 bg-white shadow-md rounded p-4 max-w-md">
        <h3 className="text-lg font-semibold mb-2">
          Promedio de descuento en pedidos
        </h3>
        {promedioDescuento !== null &&
        promedioDescuento !== undefined &&
        typeof promedioDescuento === "number" ? (
          <p className="text-4xl text-blue-600 font-bold">
            {promedioDescuento.toFixed(2)}%
          </p>
        ) : (
          <p className="text-gray-500">Cargando...</p>
        )}
      </div>

      {/* Gráfico: Producción mensual por calidad */}
      <div className="bg-white shadow-md rounded p-4">
        <h3 className="text-lg font-semibold mb-4">
          Producción mensual por calidad
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={produccionPorCalidadMensual}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="primera" stackId="a" fill="#8884d8" />
            <Bar dataKey="segunda" stackId="a" fill="#82ca9d" />
            <Bar dataKey="tercera" stackId="a" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico: Pérdida por orden */}
      <div className="bg-white shadow-md rounded p-4">
        <h3 className="text-lg font-semibold mb-4">Pérdida por orden (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={perdidaPorOrden}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="id_orden" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="porcentaje_perdida"
              stroke="#ff7f50"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Promedio de Pérdida Mensual */}
      <div className="mt-8 bg-white shadow-md rounded p-4 max-w-md">
        <h3 className="text-lg font-semibold mb-2">
          Promedio de pérdida mensual
        </h3>
        {promedioPerdidaMensual !== null &&
        promedioPerdidaMensual !== undefined &&
        typeof promedioPerdidaMensual === "number" ? (
          <p className="text-4xl text-red-600 font-bold">
            {promedioPerdidaMensual.toFixed(2)}%
          </p>
        ) : (
          <p className="text-gray-500">Cargando...</p>
        )}
      </div>
    </div>
  );
};

export default MetricasPage;

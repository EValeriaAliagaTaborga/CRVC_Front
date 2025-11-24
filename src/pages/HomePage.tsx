// src/pages/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { removeToken, getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import { useNavigate, Link } from "react-router-dom";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import ActionGroup from "../components/ActionGroup";

interface Log {
  id_log: number;
  nombre_usuario: string;
  rol: string;
  accion: string;
  detalle: string;
  fecha: string;
}

const HomePage = () => {
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);

  // extra data for quick insights
  const [productos, setProductos] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const registrosPorPagina = 20;
  const navigate = useNavigate();

  useEffect(() => {
    const u = getUsuario();
    setUsuario(u || null);
  }, []);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [logsRes, prodRes, pedidosRes] = await Promise.all([
          axios.get("http://localhost:3000/api/logs", { headers }),
          axios.get("http://localhost:3000/api/productos", { headers }),
          axios.get("http://localhost:3000/api/pedidos", { headers }),
        ]);
        setLogs(logsRes.data || []);
        setProductos(prodRes.data || []);
        setPedidos(pedidosRes.data || []);
      } catch (err: any) {
        console.error("Error en Home fetch:", err);
        setModalError({
          title: "Error al cargar datos",
          message: err?.response?.data?.message || "No se pudieron cargar algunos datos del dashboard.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  // Filtrado simple por usuario, acción o detalle
  const logsFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.nombre_usuario.toLowerCase().includes(q) ||
        l.accion.toLowerCase().includes(q) ||
        l.detalle.toLowerCase().includes(q)
    );
  }, [logs, search]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(logsFiltrados.length / registrosPorPagina));
  const logsPaginados = logsFiltrados.slice(
    (currentPage - 1) * registrosPorPagina,
    currentPage * registrosPorPagina
  );

  // Quick insights
  const ordenesPendientes = useMemo(() => pedidos.filter(p => p.estado_pedido === "En progreso" || p.estado_pedido === "Listo para Entrega"), [pedidos]);
  const lowStockProducts = useMemo(() => productos.filter(p => Number(p.cantidad_stock) <= 10), [productos]); // umbral 10

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Bienvenido{usuario ? `, ${usuario.nombre}` : ""}</h1>
          <p className="text-sm text-gray-600 mt-1">Resumen rápido del sistema y accesos directos.</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="px-3 py-2 border rounded hover:bg-gray-50">Cerrar sesión</button>
        </div>
      </div>

      {/* Top area: quick actions + small KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">Accesos rápidos</h3>
          <p className="text-sm text-gray-500 mb-3">Atajos para las tareas más comunes.</p>

          <div className="space-y-2">
            <ActionGroup
              primary={{ label: "Nuevo Pedido", href: "/pedidos/crear", ariaLabel: "Crear pedido", variant: "primary" }}
              secondary={{ label: "Productos", href: "/productos", ariaLabel: "Ver productos", variant: "link" }}
              tertiary={{ label: "Clientes", href: "/clientes", ariaLabel: "Ver clientes", variant: "default" }}
            />
            <div className="mt-2">
              <ActionGroup
                primary={{ label: "Nueva Orden", href: "/produccion/crear", ariaLabel: "Crear orden", variant: "primary" }}
                secondary={{ label: "Producción", href: "/produccion", ariaLabel: "Ver producción", variant: "link" }}
              />
            </div>
          </div>
        </div>

        {/* Quick KPIs */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">KPIs rápidos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Órdenes en progreso</p>
              <p className="text-xl font-bold">{ordenesPendientes.length}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Productos con stock bajo</p>
              <p className="text-xl font-bold">{lowStockProducts.length}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Total pedidos</p>
              <p className="text-xl font-bold">{pedidos.length}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Total productos</p>
              <p className="text-xl font-bold">{productos.length}</p>
            </div>
          </div>
        </div>

        {/* Low stock list */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">Alertas de Inventario</h3>
          <p className="text-sm text-gray-500 mb-2">Productos con stock igual o menor a 10</p>
          <div className="space-y-2 max-h-40 overflow-auto">
            {lowStockProducts.length === 0 ? (
              <div className="text-sm text-gray-500">No hay alertas</div>
            ) : (
              lowStockProducts.slice(0, 6).map(p => (
                <div key={p.id_producto} className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium">{p.nombre_producto} <span className="text-xs text-gray-500">({p.tipo})</span></div>
                    <div className="text-xs text-gray-500">Código: {p.id_producto}</div>
                  </div>
                  <div className="text-sm font-semibold">#{p.cantidad_stock}</div>
                </div>
              ))
            )}
          </div>
          {lowStockProducts.length > 6 && <div className="text-xs text-gray-500 mt-2">Mostrando 6 de {lowStockProducts.length} → <Link to="/productos" className="text-sky-600">ver todos</Link></div>}
        </div>
      </div>

      {/* Search + Logs */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1">
            <SearchInput
              id="home-logs-search"
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1); }}
              placeholder="Buscar logs por usuario, acción o detalle..."
              aria-label="Buscar logs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSearch(""); setCurrentPage(1); }}
              className="px-3 py-2 border rounded hover:bg-gray-50"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Usuario</th>
                  <th className="px-4 py-2 text-left">Rol</th>
                  <th className="px-4 py-2 text-left">Acción</th>
                  <th className="px-4 py-2 text-left">Detalle</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {logsPaginados.map(log => (
                  <tr key={log.id_log} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{log.nombre_usuario}</td>
                    <td className="px-4 py-3">{log.rol}</td>
                    <td className="px-4 py-3">{log.accion}</td>
                    <td className="px-4 py-3">{log.detalle}</td>
                    <td className="px-4 py-3">{new Date(log.fecha).toLocaleString()}</td>
                  </tr>
                ))}
                {logsPaginados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">No se encontraron registros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden p-3 space-y-3">
            {logsPaginados.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No se encontraron registros.</div>
            ) : (
              logsPaginados.map(log => (
                <article key={log.id_log} className="border rounded p-3 bg-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium">{log.nombre_usuario} <span className="text-xs text-gray-500">· {log.rol}</span></div>
                      <div className="text-xs text-gray-700 mt-1">{log.accion}</div>
                      <div className="text-xs text-gray-500 mt-2">{log.detalle}</div>
                    </div>
                    <div className="text-xs text-gray-400">{new Date(log.fecha).toLocaleString()}</div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Mostrando {logsPaginados.length} de {logsFiltrados.length} registros</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-2">Página {currentPage} / {totalPaginas}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPaginas, prev + 1))}
              disabled={currentPage === totalPaginas}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
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

export default HomePage;
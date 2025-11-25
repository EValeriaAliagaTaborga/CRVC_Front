import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    const u = getUsuario();
    setUsuario(u || null);
  }, []);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };

    const fetchAll = async () => {
      setLoading(true);
      try {
        // Use Promise.allSettled so a 403 on one endpoint doesn't fail everything
        const requests = [
          axios.get("http://localhost:3000/api/logs", { headers }),
          axios.get("http://localhost:3000/api/productos", { headers }),
          axios.get("http://localhost:3000/api/pedidos", { headers }),
        ];

        const results = await Promise.allSettled(requests);

        // logs
        if (results[0].status === "fulfilled") {
          setLogs(results[0].value.data || []);
        } else {
          const err = (results[0] as PromiseRejectedResult).reason;
          if (err?.response?.status === 403) {
            // Rol no tiene permiso para ver logs -> no mostrar modal, solo vacío
            console.warn("No permission to fetch logs:", err?.response?.data?.message);
            setLogs([]);
          } else {
            throw err;
          }
        }

        // productos
        if (results[1].status === "fulfilled") {
          setProductos(results[1].value.data || []);
        } else {
          const err = (results[1] as PromiseRejectedResult).reason;
          if (err?.response?.status === 403) {
            console.warn("No permission to fetch productos:", err?.response?.data?.message);
            setProductos([]);
          } else {
            throw err;
          }
        }

        // pedidos
        if (results[2].status === "fulfilled") {
          setPedidos(results[2].value.data || []);
        } else {
          const err = (results[2] as PromiseRejectedResult).reason;
          if (err?.response?.status === 403) {
            console.warn("No permission to fetch pedidos:", err?.response?.data?.message);
            setPedidos([]);
          } else {
            throw err;
          }
        }
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
  const lowStockProducts = useMemo(() => productos.filter(p => Number(p.cantidad_stock) <= 1000), [productos]); // umbral 10

  // ROLE-based access control for quick actions
  // Roles expected: "Administrador", "Vendedor", "Encargado de Producción" OR numeric ids
  const isAdmin = usuario?.rol === "1" || usuario?.rol === "Administrador";
  const isVendedor = usuario?.rol === "2" || usuario?.rol === "Vendedor";
  const isEncargadoProduccion = usuario?.rol === "3" || usuario?.rol === "Encargado de Producción";

  // Define granular permissions
  const canCreatePedido = Boolean(isAdmin || isVendedor);
  const canViewProductos = Boolean(isAdmin || isVendedor || isEncargadoProduccion);
  const canViewClientes = Boolean(isAdmin || isVendedor);
  const canCreateOrden = Boolean(isAdmin || isEncargadoProduccion);
  const canViewProduccion = Boolean(isAdmin || isEncargadoProduccion);

  // Helper to safely build ActionGroup props (ActionGroup requires `primary` prop)
  const buildActions = (items: { nuevoPedido?: boolean; productos?: boolean; clientes?: boolean }) => {
    // determine primary as first available in priority: Nuevo Pedido, Productos, Clientes
    const { nuevoPedido, productos: hasProductos, clientes: hasClientes } = items;

    type ActionDef = { label: string; href?: string; ariaLabel?: string; variant?: any };

    const one: ActionDef | null = nuevoPedido ? { label: "Nuevo Pedido", href: "/pedidos/crear", ariaLabel: "Crear pedido", variant: "primary" } : null;
    const two: ActionDef | null = hasProductos ? { label: "Productos", href: "/productos", ariaLabel: "Ver productos", variant: "link" } : null;
    const three: ActionDef | null = hasClientes ? { label: "Clientes", href: "/clientes", ariaLabel: "Ver clientes", variant: "default" } : null;

    // pick primary
    const primary = one || two || three;
    if (!primary) return null; // nothing to render

    // secondary/tertiary are the remaining in the order: the next available become secondary, then tertiary
    const rest: ActionDef[] = [one, two, three].filter(Boolean).filter((a) => a !== primary) as ActionDef[];

    return {
      primary,
      secondary: rest[0] || undefined,
      tertiary: rest[1] || undefined,
    };
  };

  if (loading) return <p className="p-4">Cargando...</p>;

  // build props safely
  const pedidosActions = isAdmin
    ? buildActions({ nuevoPedido: true, productos: true, clientes: true })
    : buildActions({ nuevoPedido: canCreatePedido, productos: canViewProductos, clientes: canViewClientes });
  const produccionActions = isAdmin
    ? buildActions({ nuevoPedido: true, productos: true, clientes: true })
    : buildActions({ nuevoPedido: false, productos: canViewProduccion, clientes: false });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Bienvenido{usuario ? `, ${usuario.nombre}` : ""}</h1>
          <p className="text-sm text-gray-600 mt-1">Resumen rápido del sistema y accesos directos.</p>
        </div>
      </div>

      {/* Top area: quick actions + small KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">Accesos rápidos</h3>
          <p className="text-sm text-gray-500 mb-3">Atajos para las tareas más comunes.</p>

          <div className="space-y-2">
            {/* Row 1 - Pedidos / Productos / Clientes */}
            {pedidosActions ? (
              <ActionGroup
                primary={pedidosActions.primary}
                secondary={pedidosActions.secondary}
                tertiary={pedidosActions.tertiary}
              />
            ) : (
              <div className="text-sm text-gray-500">No tienes accesos a Pedidos, Productos o Clientes.</div>
            )}

            {/* Row 2 - Producción */}
            <div className="mt-2">
              {produccionActions ? (
                <ActionGroup
                  primary={produccionActions.primary}
                  secondary={produccionActions.secondary}
                  tertiary={produccionActions.tertiary}
                />
              ) : (
                <div className="text-sm text-gray-500">No tienes accesos a la sección de Producción.</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick KPIs */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-2">Valores rápidos</h3>
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
          <p className="text-sm text-gray-500 mb-2">Productos con stock igual o menor a 1000</p>
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
              className="px-3 py-2 border bg-white"
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
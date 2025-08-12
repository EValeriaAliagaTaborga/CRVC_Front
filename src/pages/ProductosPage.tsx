import { useEffect, useMemo, useState } from "react";
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

interface Movimiento {
  id_movimiento: number;
  id_producto: string;
  tipo_movimiento: "ENTRADA" | "SALIDA";
  cantidad: number;
  motivo?: string;
  referencia?: string;
  id_usuario?: number | null;
  fecha: string; // ISO datetime
}

const ProductosPage = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 20;

  // Kardex modal state
  const [kardexOpen, setKardexOpen] = useState(false);
  const [kardexLoading, setKardexLoading] = useState(false);
  const [kardexError, setKardexError] = useState<string | null>(null);
  const [kardexProducto, setKardexProducto] = useState<{ id: string; nombre: string } | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [kFiltroTipo, setKFiltroTipo] = useState<"" | "ENTRADA" | "SALIDA">("");
  const [kFechaDesde, setKFechaDesde] = useState<string>("");
  const [kFechaHasta, setKFechaHasta] = useState<string>("");
  const [kPage, setKPage] = useState(1);
  const kPerPage = 20;

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

  const productosFiltrados = useMemo(
    () =>
      productos.filter(
        (p) =>
          p.nombre_producto.toLowerCase().includes(filtroNombre.toLowerCase()) &&
          (filtroTipo ? p.tipo === filtroTipo : true)
      ),
    [productos, filtroNombre, filtroTipo]
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

  // --- Kardex ---
  const openKardex = async (p: Producto) => {
    setKardexProducto({ id: p.id_producto, nombre: `${p.nombre_producto} (${p.tipo})` });
    setKardexOpen(true);
    setKardexError(null);
    setKPage(1);
    await loadMovimientos({ id: p.id_producto });
  };

  const loadMovimientos = async ({
    id = kardexProducto?.id,
    tipo = kFiltroTipo,
    desde = kFechaDesde,
    hasta = kFechaHasta,
  }: {
    id?: string | null;
    tipo?: "" | "ENTRADA" | "SALIDA";
    desde?: string;
    hasta?: string;
  }) => {
    if (!id) return;
    setKardexLoading(true);
    setKardexError(null);
    try {
      const params: any = {};
      if (tipo) params.tipo = tipo;
      if (desde) params.desde = desde; // formato YYYY-MM-DD
      if (hasta) params.hasta = hasta; // formato YYYY-MM-DD
      const res = await axios.get(`http://localhost:3000/api/productos/${id}/movimientos`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params,
      });
      setMovimientos(res.data || []);
      setKPage(1);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "No se pudo cargar el kardex";
      setKardexError(msg);
    } finally {
      setKardexLoading(false);
    }
  };

  const movimientosPagina = useMemo(() => {
    const start = (kPage - 1) * kPerPage;
    return movimientos.slice(start, start + kPerPage);
  }, [movimientos, kPage]);

  const kTotalPaginas = Math.ceil(Math.max(1, movimientos.length) / kPerPage);

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
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm">Filtrar por tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <td className="px-4 py-2">Bs {Number(p.precio_unitario).toFixed(2)}</td>
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
                  <button
                    onClick={() => openKardex(p)}
                    className="text-green-700 hover:underline text-sm"
                  >
                    Ver Kardex
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
              className={`px-3 py-1 rounded ${
                n === paginaActual
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* Modal Kardex */}
      {kardexOpen && kardexProducto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold">Kardex — {kardexProducto.nombre}</h3>
              <button
                onClick={() => setKardexOpen(false)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            {/* Filtros */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm mb-1">Tipo de movimiento</label>
                <select
                  value={kFiltroTipo}
                  onChange={(e) => setKFiltroTipo(e.target.value as any)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Todos</option>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Desde</label>
                <input
                  type="date"
                  value={kFechaDesde}
                  onChange={(e) => setKFechaDesde(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Hasta</label>
                <input
                  type="date"
                  value={kFechaHasta}
                  onChange={(e) => setKFechaHasta(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => loadMovimientos({})}
                  className="w-full bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
                  disabled={kardexLoading}
                >
                  {kardexLoading ? "Cargando..." : "Aplicar filtros"}
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="mt-4 overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-left">Tipo</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                    <th className="px-4 py-2 text-left">Motivo</th>
                    <th className="px-4 py-2 text-left">Referencia</th>
                    <th className="px-4 py-2 text-left">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosPagina.map((m) => (
                    <tr key={m.id_movimiento} className="border-t">
                      <td className="px-4 py-2">
                        {new Date(m.fecha).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">{m.tipo_movimiento}</td>
                      <td className="px-4 py-2 text-right">{m.cantidad}</td>
                      <td className="px-4 py-2">{m.motivo || "-"}</td>
                      <td className="px-4 py-2">{m.referencia || "-"}</td>
                      <td className="px-4 py-2">{m.id_usuario ?? "-"}</td>
                    </tr>
                  ))}
                  {movimientosPagina.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                        {kardexLoading ? "Cargando..." : "Sin movimientos para los filtros seleccionados."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación Kardex */}
            {kTotalPaginas > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                <button
                  onClick={() => setKPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                  disabled={kPage === 1}
                >
                  ◀
                </button>
                <span className="px-2 py-1">Página {kPage} de {kTotalPaginas}</span>
                <button
                  onClick={() => setKPage((p) => Math.min(kTotalPaginas, p + 1))}
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                  disabled={kPage === kTotalPaginas}
                >
                  ▶
                </button>
              </div>
            )}

            {kardexError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
                {kardexError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosPage;

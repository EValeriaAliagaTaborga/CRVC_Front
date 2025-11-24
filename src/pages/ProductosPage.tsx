// src/pages/ProductosPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import ActionGroup from "../components/ActionGroup";

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

  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);

  // Deletion confirmation modal state
  const [pendingDelete, setPendingDelete] = useState<null | { id: string; nombre: string }>(null);
  const [deleting, setDeleting] = useState(false);
  const [successModal, setSuccessModal] = useState<null | { title: string; message?: string }>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:3000/api/productos", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        setProductos(res.data || []);
      } catch (error: any) {
        setModalError({
          title: "Error al cargar productos",
          message: error?.response?.data?.message || "No se pudieron cargar los productos. Intenta nuevamente.",
        });
      } finally {
        setLoading(false);
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

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / productosPorPagina));
  const productosPagina = productosFiltrados.slice(
    (paginaActual - 1) * productosPorPagina,
    paginaActual * productosPorPagina
  );

  // schedule actual delete (called from confirm modal)
  const confirmEliminar = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:3000/api/productos/${pendingDelete.id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      setProductos((prev) => prev.filter((p) => p.id_producto !== pendingDelete.id));
      setSuccessModal({ title: "Producto eliminado", message: `El producto "${pendingDelete.nombre}" fue eliminado.` });
      setPendingDelete(null);
    } catch (error: any) {
      setModalError({
        title: "Error al eliminar producto",
        message: error?.response?.data?.message || "No se pudo eliminar el producto.",
      });
    } finally {
      setDeleting(false);
    }
  };

  // when user clicks "Eliminar" we just open the modal
  const onEliminarClick = (p: Producto) => {
    setPendingDelete({ id: p.id_producto, nombre: `${p.nombre_producto} (${p.tipo})` });
  };

  // --- Kardex ---
  const openKardex = async (p: Producto) => {
    setKardexProducto({ id: p.id_producto, nombre: `${p.nombre_producto} (${p.tipo})` });
    setKardexOpen(true);
    setKardexError(null);
    setKPage(1);
    // reset filtros del modal
    setKFiltroTipo("");
    setKFechaDesde("");
    setKFechaHasta("");
    await loadMovimientos({ id: p.id_producto, tipo: "", desde: "", hasta: "" });
  };

  const loadMovimientos = async (paramsInput?: {
    id?: string | null;
    tipo?: "" | "ENTRADA" | "SALIDA";
    desde?: string;
    hasta?: string;
  }) => {
    const id = paramsInput?.id ?? kardexProducto?.id;
    const tipo = paramsInput?.tipo ?? kFiltroTipo;
    const desde = paramsInput?.desde ?? kFechaDesde;
    const hasta = paramsInput?.hasta ?? kFechaHasta;

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

  const kTotalPaginas = Math.max(1, Math.ceil(movimientos.length / kPerPage));

  if (loading) return <p className="p-4">Cargando…</p>;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Productos registrados</h2>
        <Link
          to="/productos/crear"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Registrar producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <SearchInput
          id="filter-nombre-producto"
          value={filtroNombre}
          onChange={(v) => { setPaginaActual(1); setFiltroNombre(v); }}
          placeholder="Buscar por nombre"
          className=""
          label="Nombre"
        />
        <div>
          <label className="block text-sm">Filtrar por tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => { setPaginaActual(1); setFiltroTipo(e.target.value); }}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="Primera">Primera</option>
            <option value="Segunda">Segunda</option>
            <option value="Tercera">Tercera</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setFiltroNombre(""); setFiltroTipo(""); setPaginaActual(1); }}
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla desktop */}
      <div className="bg-white shadow-md rounded overflow-x-auto">
        <div className="hidden md:block">
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
                  <td className="px-4 py-2 align-top">{p.id_producto}</td>
                  <td className="px-4 py-2 align-top">{p.nombre_producto}</td>
                  <td className="px-4 py-2 align-top">{p.tipo}</td>
                  <td className="px-4 py-2 align-top">{p.cantidad_stock}</td>
                  <td className="px-4 py-2 align-top">Bs {Number(p.precio_unitario).toFixed(2)}</td>
                  <td className="px-4 py-2 align-top">
                    <div className="flex items-center gap-2">
                      <ActionGroup
                        primary={{
                          label: "Editar",
                          href: `/productos/${p.id_producto}/editar`,
                          ariaLabel: `Editar producto ${p.id_producto}`,
                          variant: "link",
                        }}
                        secondary={{
                          label: "Eliminar",
                          onClick: () => onEliminarClick(p),
                          ariaLabel: `Eliminar producto ${p.id_producto}`,
                          variant: "danger",
                        }}
                      />
                      <button
                        onClick={() => openKardex(p)}
                        className="px-2 py-1 border rounded text-sm hover:bg-gray-50"
                        aria-label={`Ver kardex ${p.id_producto}`}
                      >
                        Kardex
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {productosPagina.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">No se encontraron productos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden p-3 space-y-3">
          {productosPagina.length === 0 ? (
            <div className="p-4 border rounded text-center text-gray-500">No se encontraron productos.</div>
          ) : (
            productosPagina.map((p) => (
              <article key={p.id_producto} className="p-3 border rounded bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.nombre_producto}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.tipo} · Código: {p.id_producto}</div>
                    <div className="text-xs text-gray-700 mt-2">Stock: <span className="font-medium">{p.cantidad_stock}</span></div>
                    <div className="text-xs text-gray-700">Precio: Bs {Number(p.precio_unitario).toFixed(2)}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <ActionGroup
                      primary={{
                        label: "Editar",
                        href: `/productos/${p.id_producto}/editar`,
                        ariaLabel: `Editar producto ${p.id_producto}`,
                        variant: "link",
                      }}
                      secondary={{
                        label: "Eliminar",
                        onClick: () => onEliminarClick(p),
                        ariaLabel: `Eliminar producto ${p.id_producto}`,
                        variant: "danger",
                      }}
                    />
                    <button
                      onClick={() => openKardex(p)}
                      className="px-2 py-1 border rounded text-sm hover:bg-gray-50 mt-2"
                      aria-label={`Ver kardex ${p.id_producto}`}
                    >
                      Kardex
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPaginaActual(n)}
              className={`px-3 py-1 rounded ${n === paginaActual ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* Kardex en Modal */}
      <Modal
        open={kardexOpen}
        title={kardexProducto ? `Kardex — ${kardexProducto.nombre}` : "Kardex"}
        onClose={() => { setKardexOpen(false); setMovimientos([]); }}
        primaryLabel="Cerrar"
        onPrimary={() => { setKardexOpen(false); setMovimientos([]); }}
        maxWidthClass="max-w-5xl"
      >
        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                onClick={() => loadMovimientos({ id: kardexProducto?.id, tipo: kFiltroTipo, desde: kFechaDesde, hasta: kFechaHasta })}
                className="w-full bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
                disabled={kardexLoading}
              >
                {kardexLoading ? "Cargando..." : "Aplicar filtros"}
              </button>
            </div>
          </div>

          {/* Tabla movimientos (desktop) */}
          <div className="overflow-x-auto border rounded">
            <div className="hidden md:block">
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
                      <td className="px-4 py-2">{new Date(m.fecha).toLocaleString()}</td>
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

            {/* Mobile list for movimientos */}
            <div className="md:hidden space-y-2 p-2">
              {movimientosPagina.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  {kardexLoading ? "Cargando..." : "Sin movimientos para los filtros seleccionados."}
                </div>
              ) : (
                movimientosPagina.map((m) => (
                  <article key={m.id_movimiento} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium">{m.tipo_movimiento} · {m.cantidad}</div>
                        <div className="text-xs text-gray-600">{new Date(m.fecha).toLocaleString()}</div>
                        <div className="text-xs mt-2">Motivo: {m.motivo || "-"}</div>
                        <div className="text-xs">Ref: {m.referencia || "-"}</div>
                      </div>
                      <div className="text-xs text-gray-500">Usr: {m.id_usuario ?? "-"}</div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Paginación Kardex */}
          {kTotalPaginas > 1 && (
            <div className="flex justify-center mt-3 gap-2">
              <button
                onClick={() => setKPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded"
                disabled={kPage === 1}
              >
                ◀
              </button>
              <span className="px-2 py-1">Página {kPage} de {kTotalPaginas}</span>
              <button
                onClick={() => setKPage((p) => Math.min(kTotalPaginas, p + 1))}
                className="px-3 py-1 border rounded"
                disabled={kPage === kTotalPaginas}
              >
                ▶
              </button>
            </div>
          )}

          {kardexError && (
            <div className="mt-3 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {kardexError}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!pendingDelete}
        title="Confirmar eliminación"
        onClose={() => setPendingDelete(null)}
        secondaryLabel="Cancelar"
        onSecondary={() => setPendingDelete(null)}
        primaryLabel={deleting ? "Eliminando..." : "Eliminar"}
        onPrimary={confirmEliminar}
        maxWidthClass="max-w-md"
      >
        <p className="text-sm text-gray-700">
          ¿Estás segura/o de que deseas eliminar el producto <span className="font-medium">{pendingDelete?.nombre}</span>? Esta acción no se puede deshacer.
        </p>
      </Modal>

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

      {/* Success modal */}
      <Modal
        open={!!successModal}
        title={successModal?.title}
        onClose={() => setSuccessModal(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setSuccessModal(null)}
      >
        <p className="text-sm text-gray-700">{successModal?.message}</p>
      </Modal>
    </div>
  );
};

export default ProductosPage;
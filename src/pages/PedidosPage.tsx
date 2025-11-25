import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import {
  differenceInCalendarDays,
  parseISO,
  startOfDay,
  isValid,
} from "date-fns";
import Modal from "../components/Modal";
import SearchInput from "../components/SearchInput";
import ActionGroup from "../components/ActionGroup";

/* ===================== Tipos ===================== */
interface DetallePedido {
  id_detalle_pedido: number;
  id_producto: string;
  cantidad_pedida: number;
  precio_total: number;
  fecha_estimada_entrega: string;
  nombre_producto: string;
  tipo: string;
  entregado: boolean;
}

interface Pedido {
  id_pedido: number;
  fecha_creacion_pedido: string;
  precio_pedido: string;
  descuento_pedido: string;
  estado_pedido: string; // "En progreso" | "Listo para Entrega" | "Entregado" | "Cancelado"
  direccion: string;
  cliente: string;
  detalles: DetallePedido[];
}

// Row plano usado por las tablas
interface Row {
  pedidoId: number;
  detalleId: number;
  cliente: string;
  producto: string;
  cantidad: number;
  fecha: string | null;
  entregado: boolean;
}

type SortDirection = "asc" | "desc";

/* ===================== CategoryTable (modular) ===================== */

interface CategoryTableProps {
  label: string;
  rows: Row[];
  page: number;
  onPageChange: (n: number) => void;
  itemsPerPage?: number;
  onToggleEntrega: (
    pedidoId: number,
    detalleId: number,
    nuevoValor: boolean
  ) => void;
  onEliminar: (pedidoId: number) => void;
  isAdmin: boolean;
}

const CategoryTable = ({
  label,
  rows,
  page,
  onPageChange,
  itemsPerPage = 20,
  onToggleEntrega,
  onEliminar,
  isAdmin,
}: CategoryTableProps) => {
  const [sortKey, setSortKey] = useState<keyof Row>("pedidoId");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [q, setQ] = useState("");

  // filtro case-insensitive por producto / cliente
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        (r.producto || "").toLowerCase().includes(s) ||
        (r.cliente || "").toLowerCase().includes(s) ||
        String(r.pedidoId).includes(s)
    );
  }, [rows, q]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const v1 = a[sortKey];
      const v2 = b[sortKey];
      if (typeof v1 === "number" && typeof v2 === "number") {
        return sortDir === "asc" ? v1 - v2 : v2 - v1;
      }
      if (typeof v1 === "boolean" && typeof v2 === "boolean") {
        return sortDir === "asc"
          ? Number(v1) - Number(v2)
          : Number(v2) - Number(v1);
      }
      const s1 = String(v1 || "");
      const s2 = String(v2 || "");
      return sortDir === "asc" ? s1.localeCompare(s2) : s2.localeCompare(s1);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const pageClamped = Math.min(Math.max(1, page), totalPages);

  // cuando cambie búsqueda u orden, volver a página 1
  useEffect(() => {
    onPageChange(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sortKey, sortDir]);

  useEffect(() => {
    // si page externo es mayor que totalPages, ajusta al máximo
    if (page !== pageClamped) onPageChange(pageClamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const start = (pageClamped - 1) * itemsPerPage;
  const pageRows = sorted.slice(start, start + itemsPerPage);

  const onSort = (key: keyof Row) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="text-lg md:text-xl font-semibold">{label}</h3>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <SearchInput
            id={`search-${label.replace(/\s+/g, "-").toLowerCase()}`}
            value={q}
            onChange={setQ}
            placeholder="Buscar producto, cliente, no # pedido"
            aria-label={`Buscar en ${label}`}
            className="md:max-w-xs"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-gray-50">
            <tr>
              {[
                { label: "#Pedido", key: "pedidoId" as const },
                { label: "Cliente", key: "cliente" as const },
                { label: "Producto", key: "producto" as const },
                { label: "Cant.", key: "cantidad" as const },
                { label: "Entrega", key: "fecha" as const },
                { label: "Entregado", key: "entregado" as const },
              ].map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left cursor-pointer select-none"
                  onClick={() => onSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {sortKey === col.key && (
                      <small className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</small>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  — ningún pedido —
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr key={r.detalleId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{r.pedidoId}</td>
                  <td className="px-4 py-3">{r.cliente}</td>
                  <td className="px-4 py-3">{r.producto}</td>
                  <td className="px-4 py-3">{r.cantidad}</td>
                  <td className="px-4 py-3">
                    <DateChip dateStr={r.fecha ?? undefined} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={r.entregado}
                      disabled={false} /* ahora cualquier rol puede marcar entregado (editar) */
                      onChange={() =>
                        onToggleEntrega(r.pedidoId, r.detalleId, !r.entregado)
                      }
                      aria-label={`Marcar entregado detalle ${r.detalleId}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ActionGroup
                      primary={{
                        label: "Actualizar",
                        href: `/pedidos/${r.pedidoId}/detalles/${r.detalleId}`,
                        ariaLabel: `Actualizar pedido ${r.pedidoId} detalle ${r.detalleId}`,
                        variant: "link",
                      }}
                      secondary={
                        isAdmin
                          ? {
                              label: "Eliminar",
                              onClick: () => onEliminar(r.pedidoId),
                              ariaLabel: `Eliminar pedido ${r.pedidoId}`,
                              variant: "danger",
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t">
          <div className="text-sm text-gray-600">
            Mostrando <strong>{start + (pageRows.length ? 1 : 0)}</strong> - <strong>{start + pageRows.length}</strong> de <strong>{sorted.length}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={pageClamped === 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
              aria-label="Ir a la primera página"
            >
              «
            </button>
            <button
              onClick={() => onPageChange(Math.max(pageClamped - 1, 1))}
              disabled={pageClamped === 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
              aria-label="Página anterior"
            >
              ◀
            </button>
            <span className="px-3 py-1 border rounded text-sm">{pageClamped} / {totalPages}</span>
            <button
              onClick={() => onPageChange(Math.min(pageClamped + 1, totalPages))}
              disabled={pageClamped === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50"
              aria-label="Página siguiente"
            >
              ▶
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={pageClamped === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50"
              aria-label="Ir a la última página"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {pageRows.length === 0 ? (
          <div className="p-4 border rounded text-center text-gray-500">— ningún pedido —</div>
        ) : (
          pageRows.map((r) => (
            <article key={r.detalleId} className="p-3 border rounded bg-white shadow-sm">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Pedido #{r.pedidoId}</div>
                    <div className="text-xs text-gray-600">{r.cantidad} ítem(s)</div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{r.producto}</div>
                  <div className="text-xs text-gray-500 mt-1">{r.cliente}</div>
                  <div className="mt-2">
                    <DateChip dateStr={r.fecha ?? undefined} />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div>
                    <input
                      type="checkbox"
                      checked={r.entregado}
                      disabled={false}
                      onChange={() =>
                        onToggleEntrega(r.pedidoId, r.detalleId, !r.entregado)
                      }
                      aria-label={`Marcar entregado detalle ${r.detalleId}`}
                    />
                  </div>
                  <ActionGroup
                    primary={{
                      label: "Actualizar",
                      href: `/pedidos/${r.pedidoId}/detalles/${r.detalleId}`,
                      ariaLabel: `Actualizar pedido ${r.pedidoId} detalle ${r.detalleId}`,
                      variant: "link",
                    }}
                    secondary={
                      isAdmin
                        ? {
                            label: "Eliminar",
                            onClick: () => onEliminar(r.pedidoId),
                            ariaLabel: `Eliminar pedido ${r.pedidoId}`,
                            variant: "danger",
                          }
                        : undefined
                    }
                  />
                </div>
              </div>
            </article>
          ))
        )}

        {/* Mobile pagination */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={pageClamped === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ◀
          </button>
          <span className="text-sm">{pageClamped} / {totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(pageClamped + 1, totalPages))}
            disabled={pageClamped === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ▶
          </button>
        </div>
      </div>
    </section>
  );
};

/* ===================== DateChip + helpers ===================== */

const DateChip = ({ dateStr }: { dateStr?: string | null }) => {
  if (!dateStr) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">—</span>
    );
  }

  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">—</span>
    );
  }

  const diff = daysFromToday(parsed); // negativo = pasado
  const label = parsed.toLocaleDateString();

  let classes = "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ";
  if (diff < 0) {
    classes += "bg-red-100 text-red-800 border border-red-200";
  } else if (diff > 7) {
    classes += "bg-green-100 text-green-800 border border-green-200";
  } else {
    classes += "bg-yellow-100 text-yellow-800 border border-yellow-200";
  }

  return <span className={classes}>{label}</span>;
};

function toDateSafe(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
}
function daysFromToday(date: Date): number {
  const today = startOfDay(new Date());
  const d = startOfDay(date);
  return differenceInCalendarDays(d, today);
}

/* ===================== Componente principal PedidosPage ===================== */

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  // modal that was used for "pedido completado" — now via Modal component
  const [modalOk, setModalOk] = useState<null | { pedidoId: number }>(null);
  // generic error modal content
  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);

  // deletion flow: pendingDeleteId triggers confirmation modal
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [successModal, setSuccessModal] = useState<null | { title: string; message?: string }>(null);

  const navigate = useNavigate();

  // obtener usuario y roles en tiempo de ejecución
  const usuario = getUsuario();
  const esAdministrador = Boolean(
    usuario?.rol === "1" ||
      usuario?.rol === "Administrador" ||
      String(usuario?.rol).toLowerCase() === "administrador" ||
      String(usuario?.rol).toLowerCase() === "admin"
  );

  const handleEliminar = (id: number) => {
    // open confirmation modal
    setPendingDeleteId(id);
  };

  const confirmEliminar = async () => {
    const id = pendingDeleteId;
    if (!id) return;
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:3000/api/pedidos/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setPedidos((p) => p.filter((x) => x.id_pedido !== id));
      setPendingDeleteId(null);
      setSuccessModal({
        title: "Pedido eliminado",
        message: `El pedido #${id} fue eliminado correctamente.`,
      });
    } catch (e: any) {
      setModalError({
        title: "No se pudo eliminar el pedido",
        message:
          e?.response?.data?.message ||
          "Ocurrió un problema eliminando el pedido. Intenta nuevamente.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const findPedido = (id: number) => pedidos.find((p) => p.id_pedido === id);

  const toggleEntrega = async (
    pedidoId: number,
    detalleId: number,
    nuevoValor: boolean
  ) => {
    const pFound = findPedido(pedidoId);
    if (pFound?.estado_pedido === "Cancelado") {
      setModalError({
        title: "Pedido cancelado",
        message: "No puedes registrar entregas en un pedido cancelado.",
      });
      return;
    }

    const prev = pedidos;
    setPedidos((curr) =>
      curr.map((p) =>
        p.id_pedido === pedidoId
          ? {
              ...p,
              detalles: p.detalles.map((d) =>
                d.id_detalle_pedido === detalleId
                  ? { ...d, entregado: nuevoValor }
                  : d
              ),
            }
          : p
      )
    );

    try {
      const { data } = await axios.patch(
        `http://localhost:3000/api/pedidos/${pedidoId}/detalle/${detalleId}/entrega`,
        { entregado: nuevoValor },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (data?.pedidoCompletado) {
        setPedidos((curr) =>
          curr.map((p) =>
            p.id_pedido === pedidoId ? { ...p, estado_pedido: "Entregado" } : p
          )
        );
        setModalOk({ pedidoId });
      }
    } catch (e: any) {
      setPedidos(prev);
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;

      if (
        status === 409 &&
        msg?.toLowerCase?.().includes("stock insuficiente")
      ) {
        setModalError({
          title: "Existencias insuficientes",
          message:
            "No hay suficientes existencias para completar esta entrega. Por favor, contacta con el administrador.",
        });
      } else if (status === 400 && msg?.toLowerCase?.().includes("cancelado")) {
        setModalError({
          title: "Pedido cancelado",
          message: "No puedes registrar entregas en un pedido cancelado.",
        });
      } else if (status === 400 && msg?.toLowerCase?.().includes("revertir")) {
        setModalError({
          title: "Reversión no permitida",
          message:
            "Solo un administrador puede revertir una entrega dentro de 24 horas.",
        });
      } else {
        setModalError({
          title: "No se pudo actualizar la entrega",
          message: msg || "Ocurrió un problema procesando la solicitud.",
        });
      }
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/pedidos", {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      .then((res) => setPedidos(res.data))
      .catch(() => {
        setModalError({
          title: "Error al cargar pedidos",
          message: "No se pudieron obtener los pedidos. Intenta nuevamente.",
        });
      });
  }, []);

  // Reconstruye filas para cada categoría (EXCLUYE pedidos cancelados)
  const buildRows = (filterFn: (d: DetallePedido) => boolean): Row[] =>
    pedidos
      .filter((p) => p.estado_pedido !== "Cancelado")
      .flatMap((p) =>
        p.detalles.filter(filterFn).map((d) => ({
          pedidoId: p.id_pedido,
          detalleId: d.id_detalle_pedido,
          cliente: p.cliente,
          producto: `${d.nombre_producto} (${d.tipo})`,
          cantidad: d.cantidad_pedida,
          fecha: d.fecha_estimada_entrega ?? null,
          entregado: d.entregado,
        }))
      );

  const categorias = useMemo(() => {
    const pendientes = (d: DetallePedido) => !d.entregado;
    const vencidos = (d: DetallePedido) => {
      const dt = toDateSafe(d.fecha_estimada_entrega);
      return !d.entregado && !!dt && daysFromToday(dt) < 0;
    };
    const hoy = (d: DetallePedido) => {
      const dt = toDateSafe(d.fecha_estimada_entrega);
      return !d.entregado && !!dt && daysFromToday(dt) === 0;
    };
    const en1Dia = (d: DetallePedido) => {
      const dt = toDateSafe(d.fecha_estimada_entrega);
      return !d.entregado && !!dt && daysFromToday(dt) === 1;
    };
    const hasta3Dias = (d: DetallePedido) => {
      const dt = toDateSafe(d.fecha_estimada_entrega);
      const diff = dt ? daysFromToday(dt) : NaN;
      return !d.entregado && !!dt && diff >= 2 && diff <= 3;
    };
    const hasta7Dias = (d: DetallePedido) => {
      const dt = toDateSafe(d.fecha_estimada_entrega);
      const diff = dt ? daysFromToday(dt) : NaN;
      return !d.entregado && !!dt && diff >= 4 && diff <= 7;
    };
    const proximos = (d: DetallePedido) => {
      const dt = toDateSafe(d.fecha_estimada_entrega);
      return !d.entregado && !!dt && daysFromToday(dt) > 7;
    };
    const sinFecha = (d: DetallePedido) =>
      !d.entregado && !toDateSafe(d.fecha_estimada_entrega);

    return [
      {
        id: "pendientes",
        label: "Pendientes (todas las fechas)",
        rows: buildRows(pendientes),
      },
      { id: "vencidos", label: "Vencidos", rows: buildRows(vencidos) },
      { id: "hoy", label: "Hoy", rows: buildRows(hoy) },
      { id: "en1dia", label: "En 1 día", rows: buildRows(en1Dia) },
      { id: "3dias", label: "≤ 3 días", rows: buildRows(hasta3Dias) },
      { id: "7dias", label: "≤ 7 días", rows: buildRows(hasta7Dias) },
      {
        id: "proximos",
        label: "Próximos (>7 días)",
        rows: buildRows(proximos),
      },
      { id: "sinfecha", label: "Sin fecha", rows: buildRows(sinFecha) },
      {
        id: "completados",
        label: "Completados",
        rows: buildRows((d) => d.entregado),
      },
    ] as { id: string; label: string; rows: Row[] }[];
  }, [pedidos]);

  // Tabs UI state + paginación por tab (guardada por id)
  const [activeTab, setActiveTab] = useState<string>(categorias[0]?.id ?? "pendientes");
  const [pageByTab, setPageByTab] = useState<Record<string, number>>(() => {
    const rec: Record<string, number> = {};
    categorias.forEach((c) => (rec[c.id] = 1));
    return rec;
  });

  useEffect(() => {
    if (!categorias.find((c) => c.id === activeTab))
      setActiveTab(categorias[0]?.id ?? "pendientes");
    setPageByTab((prev) => {
      const next = { ...prev };
      categorias.forEach((c) => {
        if (!next[c.id]) next[c.id] = 1;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorias.length]);

  const onChangePageForTab = (tabId: string, n: number) => {
    setPageByTab((prev) => ({ ...prev, [tabId]: n }));
  };

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pedidos registrados</h2>
          <p className="text-sm text-gray-600 mt-1">Administración de entregas y seguimiento por fechas.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/pedidos/crear" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Registrar pedido</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow-sm p-3">
        <div className="flex overflow-x-auto gap-2 pb-2">
          {categorias.map((c) => {
            const count = c.rows.length;
            const active = c.id === activeTab;
            return (
              <button
                key={c.id}
                onClick={() => setActiveTab(c.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  active ? "bg-sky-600 text-white shadow" : "bg-white border"
                }`}
                aria-current={active ? "true" : undefined}
              >
                <span>{c.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-gray-100 text-gray-700"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {/* Render single active CategoryTable */}
          {categorias.map((c) =>
            c.id === activeTab ? (
              <CategoryTable
                key={c.id}
                label={c.label}
                rows={c.rows}
                page={pageByTab[c.id] ?? 1}
                onPageChange={(n) => onChangePageForTab(c.id, n)}
                itemsPerPage={20}
                onToggleEntrega={toggleEntrega}
                onEliminar={handleEliminar}
                isAdmin={esAdministrador}
              />
            ) : null
          )}
        </div>
      </div>

      {/* Pedidos Cancelados (tabla desktop + cards móvil) */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Pedidos Cancelados</h3>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">#Pedido</th>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Dirección</th>
                <th className="px-4 py-2 text-left">Creado</th>
                <th className="px-4 py-2 text-left">Detalles</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos
                .filter((p) => p.estado_pedido === "Cancelado")
                .map((p) => (
                  <tr key={p.id_pedido} className="border-t">
                    <td className="px-4 py-2">{p.id_pedido}</td>
                    <td className="px-4 py-2">{p.cliente}</td>
                    <td className="px-4 py-2">{p.direccion}</td>
                    <td className="px-4 py-2"><DateChip dateStr={p.fecha_creacion_pedido} /></td>
                    <td className="px-4 py-2">{p.detalles?.length ?? 0} ítem(s)</td>
                    <td className="px-4 py-2"><Link to={`/pedidos/${p.id_pedido}`} className="text-sky-600 hover:underline text-sm">Ver</Link></td>
                  </tr>
                ))}
              {pedidos.filter((p) => p.estado_pedido === "Cancelado").length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">No hay pedidos cancelados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards (igual estilo que las otras tablas móviles) */}
        <div className="md:hidden space-y-3">
          {pedidos.filter((p) => p.estado_pedido === "Cancelado").length === 0 ? (
            <div className="p-4 border rounded text-center text-gray-500">No hay pedidos cancelados</div>
          ) : (
            pedidos
              .filter((p) => p.estado_pedido === "Cancelado")
              .map((p) => (
                <article key={p.id_pedido} className="p-3 border rounded bg-white shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Pedido #{p.id_pedido}</div>
                        <div className="text-xs text-gray-600">{p.detalles?.length ?? 0} ítem(s)</div>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{p.cliente}</div>
                      <div className="text-xs text-gray-500 mt-1">{p.direccion}</div>
                      <div className="mt-2"><DateChip dateStr={p.fecha_creacion_pedido} /></div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-col items-end text-sm">
                        <Link to={`/pedidos/${p.id_pedido}`} className="text-sky-600 hover:underline">Ver</Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))
          )}
        </div>
      </section>

      {/* Modal: Pedido completado (antes modalOk inline) */}
      <Modal
        open={!!modalOk}
        title="Pedido completado"
        onClose={() => setModalOk(null)}
        secondaryLabel="Seguir viendo"
        onSecondary={() => setModalOk(null)}
        primaryLabel="Ver pedido"
        onPrimary={() => {
          if (modalOk) {
            const id = modalOk.pedidoId;
            setModalOk(null);
            navigate(`/pedidos/${id}`);
          }
        }}
      >
        <p className="text-sm text-gray-700">El pedido <span className="font-medium">#{modalOk?.pedidoId}</span> ha completado todas las entregas.</p>
      </Modal>

      {/* Modal: Error genérico / falta stock / cancelado / reversión */}
      <Modal
        open={!!modalError}
        title={modalError?.title}
        onClose={() => setModalError(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setModalError(null)}
      >
        <p className="text-sm text-gray-700">{modalError?.message}</p>
      </Modal>

      {/* Modal: Confirmación de eliminación */}
      <Modal
        open={pendingDeleteId !== null}
        title="Confirmar eliminación"
        onClose={() => setPendingDeleteId(null)}
        secondaryLabel="Cancelar"
        onSecondary={() => setPendingDeleteId(null)}
        primaryLabel={deleting ? "Eliminando..." : "Confirmar eliminación"}
        onPrimary={confirmEliminar}
        maxWidthClass="max-w-md"
      >
        <p className="text-sm text-gray-700">¿Estás segura/o de que deseas eliminar el pedido <span className="font-medium">#{pendingDeleteId}</span>? Esta acción no se puede deshacer.</p>
      </Modal>

      {/* Modal: Éxito (por ejemplo eliminación correcta) */}
      <Modal
        open={!!successModal}
        title={successModal?.title}
        onClose={() => setSuccessModal(null)}
        secondaryLabel="Seguir en la página"
        onSecondary={() => setSuccessModal(null)}
        primaryLabel="Volver a Pedidos"
        onPrimary={() => {
          setSuccessModal(null);
          navigate("/pedidos");
        }}
      >
        <p className="text-sm text-gray-700">{successModal?.message}</p>
      </Modal>
    </div>
  );
}
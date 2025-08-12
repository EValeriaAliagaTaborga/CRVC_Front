import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import { differenceInCalendarDays, parseISO, startOfDay, isValid } from "date-fns";

const usuario = getUsuario();
const esAdministrador = usuario?.rol === "1";

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

// Un row “plano” para la tabla
interface Row {
  pedidoId: number;
  detalleId: number;
  cliente: string;
  producto: string;
  cantidad: number;
  fecha: string;
  entregado: boolean;
}

type SortDirection = "asc" | "desc";

interface CategoryTableProps {
  label: string;
  rows: Row[];
  onToggleEntrega: (pedidoId: number, detalleId: number, nuevoValor: boolean) => void;
  onEliminar: (pedidoId: number) => void;
}

const CategoryTable = ({
  label,
  rows,
  onToggleEntrega,
  onEliminar,
}: CategoryTableProps) => {
  const ITEMS_PER_PAGE = 20;

  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof Row>("pedidoId");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [q, setQ] = useState("");

  // Filtro por producto/cliente (case-insensitive) antes de ordenar/paginar
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.producto.toLowerCase().includes(s) ||
        r.cliente.toLowerCase().includes(s)
    );
  }, [rows, q]);

  // Ordenar
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const v1 = a[sortKey], v2 = b[sortKey];
      if (typeof v1 === "number" && typeof v2 === "number") {
        return sortDir === "asc" ? v1 - v2 : v2 - v1;
      }
      if (typeof v1 === "boolean" && typeof v2 === "boolean") {
        return sortDir === "asc"
          ? Number(v1) - Number(v2)
          : Number(v2) - Number(v1);
      }
      const s1 = String(v1), s2 = String(v2);
      return sortDir === "asc" ? s1.localeCompare(s2) : s2.localeCompare(s1);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const pageRows = sorted.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const onSort = (key: keyof Row) => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  // Reiniciar página cuando cambian filas o búsqueda
  useEffect(() => {
    setPage(1);
  }, [rows.length, q]);

  return (
    <section className="space-y-2">
      <h3 className="text-xl font-semibold">{label}</h3>
      {rows.length === 0 ? (
        <p className="text-gray-500">— ningún pedido —</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          {/* Buscador por producto/cliente */}
          <div className="flex items-center gap-2 p-3 border-b">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por producto o cliente…"
              className="w-full max-w-md px-3 py-2 border rounded"
            />
          </div>
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-100">
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
                    className="px-4 py-2 cursor-pointer select-none"
                    onClick={() => onSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span>{sortDir === "asc" ? " ▲" : " ▼"}</span>
                    )}
                  </th>
                ))}
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.detalleId} className="border-t">
                  <td className="px-4 py-2">{r.pedidoId}</td>
                  <td className="px-4 py-2">{r.cliente}</td>
                  <td className="px-4 py-2">{r.producto}</td>
                  <td className="px-4 py-2">{r.cantidad}</td>
                  <td className="px-4 py-2">
                    {new Date(r.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={r.entregado}
                      disabled={!esAdministrador}
                      onChange={() =>
                        onToggleEntrega(
                          r.pedidoId,
                          r.detalleId,
                          !r.entregado
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-2 space-y-1">
                    {esAdministrador && (
                      <button
                        onClick={() => onEliminar(r.pedidoId)}
                        className="text-red-600 hover:underline text-sm block"
                      >
                        Eliminar
                      </button>
                    )}
                    <Link
                      to={`/pedidos/${r.pedidoId}/detalles/${r.detalleId}`}
                      className="text-blue-600 hover:underline text-sm block"
                    >
                      Cambiar estado
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center items-center gap-2 p-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
            >
              ◀
            </button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200"
            >
              ▶
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [modalOk, setModalOk] = useState<null | { pedidoId: number }>(null);
  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);
  const navigate = useNavigate();

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Seguro de eliminar este pedido?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/pedidos/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setPedidos((p) => p.filter((x) => x.id_pedido !== id));
    } catch {
      setModalError({
        title: "No se pudo eliminar el pedido",
        message: "Ocurrió un problema eliminando el pedido. Intenta nuevamente."
      });
    }
  };

  const findPedido = (id: number) => pedidos.find(p => p.id_pedido === id);

  const toggleEntrega = async (
    pedidoId: number,
    detalleId: number,
    nuevoValor: boolean
  ) => {
    // Pre-chequeo en frontend: si el pedido está Cancelado, no permitimos
    const pFound = findPedido(pedidoId);
    if (pFound?.estado_pedido === "Cancelado") {
      setModalError({
        title: "Pedido cancelado",
        message: "No puedes registrar entregas en un pedido cancelado."
      });
      return;
    }

    // snapshot previo
    const prev = pedidos;
    // UI optimista
    setPedidos((curr) =>
      curr.map((p) =>
        p.id_pedido === pedidoId
          ? {
              ...p,
              detalles: p.detalles.map((d) =>
                d.id_detalle_pedido === detalleId ? { ...d, entregado: nuevoValor } : d
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
      // Si el pedido quedó completado, abre popup y sincroniza estado_pedido
      if (data?.pedidoCompletado) {
        setPedidos((curr) =>
          curr.map((p) =>
            p.id_pedido === pedidoId ? { ...p, estado_pedido: "Entregado" } : p
          )
        );
        setModalOk({ pedidoId });
      }
    } catch (e: any) {
      // rollback
      setPedidos(prev);
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;

      if (status === 409 && msg?.toLowerCase?.().includes("stock insuficiente")) {
        setModalError({
          title: "Existencias insuficientes",
          message:
            "No hay suficientes existencias para completar esta entrega. " +
            "Esto no es válido. Por favor, contacta con el administrador para consultas."
        });
      } else if (status === 400 && msg?.toLowerCase?.().includes("cancelado")) {
        setModalError({
          title: "Pedido cancelado",
          message: "No puedes registrar entregas en un pedido cancelado."
        });
      } else if (status === 400 && msg?.toLowerCase?.().includes("revertir")) {
        setModalError({
          title: "Reversión no permitida",
          message: "Solo un administrador puede revertir una entrega dentro de 24 horas."
        });
      } else {
        setModalError({
          title: "No se pudo actualizar la entrega",
          message: msg || "Ocurrió un problema procesando la solicitud."
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
          message: "No se pudieron obtener los pedidos. Intenta nuevamente."
        });
      });
  }, []);

  // Helpers de fecha
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

  // Reconstruye filas para cada categoría
  const buildRows = (filterFn: (d: DetallePedido) => boolean): Row[] =>
    pedidos.flatMap((p) =>
      p.detalles.filter(filterFn).map((d) => ({
        pedidoId: p.id_pedido,
        detalleId: d.id_detalle_pedido,
        cliente: p.cliente,
        producto: `${d.nombre_producto} (${d.tipo})`,
        cantidad: d.cantidad_pedida,
        fecha: d.fecha_estimada_entrega,
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
      { label: "Pendientes (todas las fechas)", rows: buildRows(pendientes) },
      { label: "Vencidos", rows: buildRows(vencidos) },
      { label: "Hoy", rows: buildRows(hoy) },
      { label: "En 1 día", rows: buildRows(en1Dia) },
      { label: "≤ 3 días", rows: buildRows(hasta3Dias) },
      { label: "≤ 7 días", rows: buildRows(hasta7Dias) },
      { label: "Próximos (>7 días)", rows: buildRows(proximos) },
      { label: "Sin fecha", rows: buildRows(sinFecha) },
      { label: "Completados", rows: buildRows((d) => d.entregado) },
    ];
  }, [pedidos]);

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pedidos registrados</h2>
        <Link
          to="/pedidos/crear"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Registrar pedido
        </Link>
      </div>

      {categorias.map((cat) => (
        <CategoryTable
          key={cat.label}
          label={cat.label}
          rows={cat.rows}
          onToggleEntrega={toggleEntrega}
          onEliminar={handleEliminar}
        />
      ))}

      {/* Popup OK (pedido completado) */}
      {modalOk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h4 className="text-lg font-semibold mb-2">Pedido completado</h4>
            <p className="text-sm text-gray-700 mb-4">
              El pedido <span className="font-medium">#{modalOk.pedidoId}</span> ha completado todas las entregas.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOk(null)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Cerrar
              </button>
              <Link
                to={`/pedidos/${modalOk.pedidoId}`}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setModalOk(null)}
              >
                Ver pedido
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Popup Error genérico / falta stock / cancelado / reversión */}
      {modalError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h4 className="text-lg font-semibold mb-2">{modalError.title}</h4>
            <p className="text-sm text-gray-700 mb-4">{modalError.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setModalError(null)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

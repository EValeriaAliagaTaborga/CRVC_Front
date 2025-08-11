// src/pages/PedidosPage.tsx
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import { differenceInCalendarDays, parseISO } from "date-fns";

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
  estado_pedido: string;
  direccion: string;
  cliente: string;
  detalles: DetallePedido[];
}

// Un row “plano” para la tabla
interface Row {
  pedidoId: number;
  detalleId: number;
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

  // Ordenar
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
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
  }, [rows, sortKey, sortDir]);

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

  return (
    <section className="space-y-2">
      <h3 className="text-xl font-semibold">{label}</h3>
      {rows.length === 0 ? (
        <p className="text-gray-500">— ningún pedido —</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-100">
              <tr>
                {[
                  { label: "#Pedido", key: "pedidoId" as const },
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
  const navigate = useNavigate();

  // Mueve estos handlers aquí y pásalos a cada CategoryTable
  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Seguro de eliminar este pedido?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/pedidos/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setPedidos((p) => p.filter((x) => x.id_pedido !== id));
    } catch {
      alert("Error al eliminar pedido");
    }
  };

  const toggleEntrega = async (
    pedidoId: number,
    detalleId: number,
    nuevoValor: boolean
  ) => {
    try {
      await axios.patch(
        `http://localhost:3000/api/pedidos/${pedidoId}/detalle/${detalleId}/entrega`,
        { entregado: nuevoValor },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setPedidos((prev) =>
        prev.map((p) =>
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
    } catch {
      alert("No se pudo actualizar la entrega");
    }
  };

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/pedidos", {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      .then((res) => setPedidos(res.data))
      .catch(console.error);
  }, []);

  // Reconstruye filas para cada categoría
  const buildRows = (filterFn: (d: DetallePedido) => boolean): Row[] =>
    pedidos.flatMap((p) =>
      p.detalles.filter(filterFn).map((d) => ({
        pedidoId: p.id_pedido,
        detalleId: d.id_detalle_pedido,
        producto: `${d.nombre_producto} (${d.tipo})`,
        cantidad: d.cantidad_pedida,
        fecha: d.fecha_estimada_entrega,
        entregado: d.entregado,
      }))
    );

  const categorias = useMemo(
    () => [
      { label: "Pendientes", rows: buildRows((d) => !d.entregado) },
      {
        label: "Vencidos",
        rows: buildRows(
          (d) =>
            differenceInCalendarDays(parseISO(d.fecha_estimada_entrega), new Date()) < 0 &&
            !d.entregado
        ),
      },
      // … mismas categorías de “Hoy”, “1 día”, “3 días”…
      { label: "Completados", rows: buildRows((d) => d.entregado) },
    ],
    [pedidos]
  );

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
    </div>
  );
}

// src/pages/VerPedidoPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";

interface DetallePedido {
  id_detalle_pedido: number;
  id_producto: string;
  cantidad_pedida: number;
  precio_total: number;
  fecha_estimada_entrega: string | null;
  nombre_producto: string;
  tipo: string;
  entregado: boolean;
}

interface Pedido {
  id_pedido: number;
  cliente: string;
  direccion: string;
  estado_pedido: "En progreso" | "Listo para Entrega" | "Entregado" | "Cancelado";
  fecha_creacion_pedido: string;
  detalles: DetallePedido[];
}

/**
 * VerPedidoPage
 * - Carga /api/pedidos (lista) y busca el pedido por :id
 * - Muestra info y lista de detalles (tabla en desktop, cards en mobile)
 * - Usa Modal para errores
 */
export default function VerPedidoPage() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [modalError, setModalError] = useState<null | { title?: string; message?: string }>(null);

  useEffect(() => {
    const loadPedido = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:3000/api/pedidos", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const lista: Pedido[] = res.data;
        const found = lista.find((p) => p.id_pedido === Number(pedidoId));
        if (!found) {
          setModalError({
            title: "Pedido no encontrado",
            message: `No se encontró el pedido #${pedidoId}.`,
          });
          setPedido(null);
        } else {
          setPedido(found);
        }
      } catch (e: any) {
        setModalError({
          title: "Error al cargar pedido",
          message:
            e?.response?.data?.message ||
            "Ocurrió un error obteniendo los pedidos. Intenta nuevamente.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (pedidoId) loadPedido();
    else {
      setModalError({ title: "ID inválido", message: "No se recibió un id de pedido válido en la URL." });
      setLoading(false);
    }
  }, [pedidoId]);

  const calcTotal = () => {
    if (!pedido) return 0;
    return pedido.detalles.reduce((s, d) => s + Number(d.precio_total || 0), 0);
  };

  const isCancelado = pedido?.estado_pedido === "Cancelado";

  if (loading) return <p className="p-6">Cargando…</p>;

  // Si no hay pedido (y no hay modal abierto) mostramos un mensaje simple
  if (!pedido)
    return (
      <div className="p-6 space-y-4">
        <p className="text-gray-600">Pedido no encontrado.</p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/pedidos")}
            className="px-4 py-2 rounded border hover:bg-gray-50"
          >
            Volver a pedidos
          </button>
        </div>
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Pedido #{pedido.id_pedido}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {pedido.cliente} · {pedido.direccion}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/pedidos" className="text-sm text-gray-600 hover:underline">
            ← Volver
          </Link>
          {/* Opcional: enlace a la página de edición si necesitas */}
          <Link
            to={`/pedidos/${pedido.id_pedido}/detalles`}
            className="text-sm text-sky-600 hover:underline hidden md:inline"
          >
            Editar detalles
          </Link>
        </div>
      </div>

      {/* Info general */}
      <div className="bg-white rounded shadow p-4 grid md:grid-cols-3 gap-4">
        <div>
          <p><span className="font-medium">Cliente:</span> {pedido.cliente}</p>
          <p><span className="font-medium">Dirección:</span> {pedido.direccion}</p>
        </div>

        <div>
          <p>
            <span className="font-medium">Creado:</span>{" "}
            {new Date(pedido.fecha_creacion_pedido).toLocaleString()}
          </p>
          <p>
            <span className="font-medium">Total (suma subtotales):</span> Bs {calcTotal().toFixed(2)}
          </p>
        </div>

        <div className="flex items-center md:justify-end">
          <div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isCancelado
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : pedido.estado_pedido === "Entregado"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
              }`}
            >
              {pedido.estado_pedido}
            </span>

            {isCancelado && (
              <p className="text-sm text-red-600 mt-2">Este pedido fue cancelado. Aquí están los detalles que tenía.</p>
            )}
          </div>
        </div>
      </div>

      {/* Detalles: tabla desktop */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Subtotal (Bs)</th>
                <th className="px-4 py-3 text-left">Fecha estimada</th>
                <th className="px-4 py-3 text-center">Entregado</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalles.map((d) => (
                <tr key={d.id_detalle_pedido} className="border-t">
                  <td className="px-4 py-3">{d.nombre_producto}</td>
                  <td className="px-4 py-3">{d.tipo}</td>
                  <td className="px-4 py-3 text-right">{d.cantidad_pedida}</td>
                  <td className="px-4 py-3 text-right">Bs {Number(d.precio_total).toFixed(2)}</td>
                  <td className="px-4 py-3">{d.fecha_estimada_entrega ? new Date(d.fecha_estimada_entrega).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-center">{d.entregado ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 border-t text-right text-sm">
            <span className="font-semibold">Total: </span> Bs {calcTotal().toFixed(2)}
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden p-4 space-y-3">
          {pedido.detalles.map((d) => (
            <article key={d.id_detalle_pedido} className="border rounded p-3 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">{d.nombre_producto}</div>
                  <div className="text-xs text-gray-500">{d.tipo}</div>
                </div>
                <div className="text-sm text-gray-700">Bs {Number(d.precio_total).toFixed(2)}</div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                <div>Cantidad: <span className="font-medium">{d.cantidad_pedida}</span></div>
                <div>{d.fecha_estimada_entrega ? new Date(d.fecha_estimada_entrega).toLocaleDateString() : "Sin fecha"}</div>
              </div>

              <div className="mt-2 text-xs">
                <span className="font-medium">Entregado:</span> {d.entregado ? "Sí" : "No"}
              </div>
            </article>
          ))}

          <div className="py-2 text-right text-sm font-semibold">Total: Bs {calcTotal().toFixed(2)}</div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={() => navigate("/pedidos")} className="px-4 py-2 rounded border hover:bg-gray-50">
          Volver a pedidos
        </button>
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
}
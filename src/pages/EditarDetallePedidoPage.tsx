import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

interface Detalle {
  id_detalle_pedido: number;
  id_producto: string;
  nombre_producto: string;
  tipo: string;
  cantidad_pedida: number;
  precio_total: number;
  fecha_estimada_entrega: string;
  entregado: boolean;
}

interface Pedido {
  id_pedido: number;
  cliente: string;
  direccion: string;
  estado_pedido: "En progreso" | "Listo para Entrega" | "Entregado" | "Cancelado";
  fecha_creacion_pedido: string;
  detalles: Detalle[];
}

const EditarDetallePedidoPage = () => {
  const { detalleId, pedidoId } = useParams<{ detalleId: string; pedidoId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [estadoPedido, setEstadoPedido] = useState<Pedido["estado_pedido"]>("En progreso");

  // estados editables por detalle
  const [editById, setEditById] = useState<Record<number, { fecha: string; entregado: boolean }>>({});

  const isCancelado = useMemo(() => pedido?.estado_pedido === "Cancelado", [pedido]);

  // Cargar pedido + marcar fila enfocada (detalleId)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/pedidos", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const p = (res.data as Pedido[]).find((pp) => pp.id_pedido === Number(pedidoId));
        if (!p) throw new Error("Pedido no encontrado");

        setPedido(p);
        setEstadoPedido(p.estado_pedido);
        // snapshot editable por detalle
        const snap: Record<number, { fecha: string; entregado: boolean }> = {};
        for (const d of p.detalles) {
          snap[d.id_detalle_pedido] = {
            fecha: d.fecha_estimada_entrega ? d.fecha_estimada_entrega.split("T")[0] : "",
            entregado: !!d.entregado,
          };
        }
        setEditById(snap);
      } catch (e) {
        alert("Error al cargar el pedido.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pedidoId]);

  const handleUpdateEstadoPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido) return;
    try {
      await axios.put(
        `http://localhost:3000/api/pedidos/${pedido.id_pedido}/estado`,
        { estado_pedido: estadoPedido },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      // refrescar estado local
      setPedido({ ...pedido, estado_pedido: estadoPedido });
      alert("Estado del pedido actualizado");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "No se pudo actualizar el estado del pedido";
      alert(msg);
    }
  };

  const updateDetalleCampo = (id_detalle: number, patch: Partial<{ fecha: string; entregado: boolean }>) => {
    setEditById((prev) => ({ ...prev, [id_detalle]: { ...prev[id_detalle], ...patch } }));
  };

  const handleGuardarDetalle = async (d: Detalle) => {
    if (!pedido) return;
    const current = editById[d.id_detalle_pedido];
    if (!current) return;

    try {
      // 1) Actualizar fecha (si cambió) o mantener sincronía
      await axios.patch(
        `http://localhost:3000/api/pedidos/detalles/${d.id_detalle_pedido}`,
        { fecha_estimada_entrega: current.fecha, entregado: current.entregado },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      // 2) Si se marcó entregado y antes no lo estaba → transaccional (descuenta stock + kardex)
      if (current.entregado && !d.entregado) {
        await axios.patch(
          `http://localhost:3000/api/pedidos/${pedido.id_pedido}/detalle/${d.id_detalle_pedido}/entrega`,
          { entregado: true },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      }

      // 3) Si se desmarcó (true→false), el backend validará (no permitido por tu lógica actual)
      //    No hacemos llamada extra: la ruta de fecha ya envió 'entregado' pero tu backend
      //    no permite revertir vía transaccional.

      // Actualizar UI local
      const nuevosDetalles = pedido.detalles.map((row) =>
        row.id_detalle_pedido === d.id_detalle_pedido
          ? { ...row, fecha_estimada_entrega: current.fecha, entregado: current.entregado }
          : row
      );

      setPedido({ ...pedido, detalles: nuevosDetalles });

      alert("Detalle actualizado");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "No se pudo actualizar el detalle";
      alert(msg);
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (!pedido) return <p>No se encontró el pedido</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Pedido #{pedido.id_pedido}
        </h2>
        <Link to="/pedidos" className="text-blue-600 hover:underline">
          ← Volver
        </Link>
      </div>

      {/* Información del pedido */}
      <div className="bg-white rounded shadow p-4 grid md:grid-cols-2 gap-4">
        <div>
          <p><span className="font-medium">Cliente:</span> {pedido.cliente}</p>
          <p><span className="font-medium">Dirección:</span> {pedido.direccion}</p>
          <p><span className="font-medium">Creado:</span> {new Date(pedido.fecha_creacion_pedido).toLocaleString()}</p>
        </div>

        {/* Estado del pedido */}
        <form onSubmit={handleUpdateEstadoPedido} className="space-y-2">
          <label className="block font-medium">Estado del pedido</label>
          <select
            value={estadoPedido}
            onChange={(e) => setEstadoPedido(e.target.value as Pedido["estado_pedido"])}
            disabled={isCancelado}
            className="w-full border p-2 rounded"
          >
            <option value="En progreso">En progreso</option>
            <option value="Listo para Entrega">Listo para Entrega</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <button
            type="submit"
            disabled={isCancelado}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Guardar estado
          </button>
          {isCancelado && (
            <p className="text-sm text-red-600 mt-1">Este pedido está cancelado; no se pueden hacer cambios.</p>
          )}
        </form>
      </div>

      {/* Detalles */}
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Detalles del pedido</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-left">Fecha estimada</th>
                <th className="px-3 py-2 text-center">Entregado</th>
                <th className="px-3 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalles.map((d) => {
                const edit = editById[d.id_detalle_pedido];
                return (
                  <tr key={d.id_detalle_pedido} className="border-t">
                    <td className="px-3 py-2">{d.nombre_producto}</td>
                    <td className="px-3 py-2">{d.tipo}</td>
                    <td className="px-3 py-2 text-right">{d.cantidad_pedida}</td>
                    <td className="px-3 py-2">
                      <label className="block text-xs text-gray-600 mb-1">Fecha estimada de entrega</label>
                      <input
                        type="date"
                        value={edit?.fecha || ""}
                        onChange={(e) =>
                          updateDetalleCampo(d.id_detalle_pedido, { fecha: e.target.value })
                        }
                        disabled={isCancelado}
                        className="border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!edit?.entregado}
                          onChange={(e) =>
                            updateDetalleCampo(d.id_detalle_pedido, { entregado: e.target.checked })
                          }
                          disabled={isCancelado}
                        />
                        <span className="text-xs text-gray-600">¿Entregado?</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleGuardarDetalle(d)}
                        disabled={isCancelado}
                        className="text-blue-600 hover:underline"
                      >
                        Guardar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pedido.detalles.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Sin detalles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => navigate("/pedidos")}
          className="px-4 py-2 rounded border hover:bg-gray-50"
        >
          Volver a pedidos
        </button>
      </div>
    </div>
  );
};

export default EditarDetallePedidoPage;

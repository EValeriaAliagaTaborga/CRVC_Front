import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";

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

export default function EditarDetallePedidoPage() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [estadoPedido, setEstadoPedido] = useState<Pedido["estado_pedido"]>("En progreso");
  const [editById, setEditById] = useState<Record<number, { fecha: string; entregado: boolean }>>(
    {}
  );
  const [bulkSaving, setBulkSaving] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string[] | null>(null);

  // Success modal state
  const [successModal, setSuccessModal] = useState<{ title: string; message?: string } | null>(null);

  const isCancelado = useMemo(() => pedido?.estado_pedido === "Cancelado", [pedido]);

  // Load pedido and build editable snapshot
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:3000/api/pedidos", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const p = (res.data as Pedido[]).find((pp) => pp.id_pedido === Number(pedidoId));
        if (!p) throw new Error("Pedido no encontrado");
        setPedido(p);
        setEstadoPedido(p.estado_pedido);
        const snap: Record<number, { fecha: string; entregado: boolean }> = {};
        for (const d of p.detalles) {
          snap[d.id_detalle_pedido] = {
            fecha: d.fecha_estimada_entrega ? d.fecha_estimada_entrega.split("T")[0] : "",
            entregado: !!d.entregado,
          };
        }
        setEditById(snap);
      } catch (e) {
        // Mantengo alerta por error crítico de carga; si prefieres, lo cambiamos por modal.
        alert("Error al cargar el pedido.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pedidoId]);

  // Update estado del pedido (single action) - ahora muestra modal de éxito
  const handleUpdateEstadoPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido) return;
    try {
      await axios.put(
        `http://localhost:3000/api/pedidos/${pedido.id_pedido}/estado`,
        { estado_pedido: estadoPedido },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setPedido({ ...pedido, estado_pedido: estadoPedido });

      // mostrar modal de éxito con las dos opciones
      setSuccessModal({
        title: "Estado actualizado",
        message: `El estado del pedido #${pedido.id_pedido} se actualizó a "${estadoPedido}".`,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "No se pudo actualizar el estado del pedido";
      alert(msg);
    }
  };

  const updateDetalleCampo = (
    id_detalle: number,
    patch: Partial<{ fecha: string; entregado: boolean }>
  ) => {
    setEditById((prev) => ({ ...prev, [id_detalle]: { ...prev[id_detalle], ...patch } }));
  };

  // Guardar todos los cambios: itera sobre editById comparando con pedido.detalles
  const handleGuardarTodos = async () => {
    if (!pedido) return;
    setBulkSaving(true);
    setErrorSummary(null);

    const originalsById: Record<number, Detalle> = {};
    pedido.detalles.forEach((d) => (originalsById[d.id_detalle_pedido] = d));

    const entries = Object.entries(editById).map(([k, v]) => ({ id: Number(k), ...v }));
    const changed = entries.filter((e) => {
      const orig = originalsById[e.id];
      if (!orig) return false;
      const origFecha = orig.fecha_estimada_entrega ? orig.fecha_estimada_entrega.split("T")[0] : "";
      return origFecha !== (e.fecha ?? "") || Boolean(orig.entregado) !== Boolean(e.entregado);
    });

    if (changed.length === 0) {
      // mostrar modal informativo (sin navegación)
      setSuccessModal({ title: "Sin cambios", message: "No hay cambios para guardar." });
      setBulkSaving(false);
      return;
    }

    // make a copy to update locally after success
    let localPedido = { ...pedido, detalles: [...pedido.detalles] };
    const errors: string[] = [];

    // Process sequentially to make it easier to handle per-item server errors
    for (const ch of changed) {
      const orig = originalsById[ch.id];
      if (!orig) continue;

      try {
        // 1) Patch fecha + entregado (backend may accept both fields)
        await axios.patch(
          `http://localhost:3000/api/pedidos/detalles/${ch.id}`,
          { fecha_estimada_entrega: ch.fecha, entregado: ch.entregado },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        // 2) If marking entregado now (true) and originally was not -> call entrega route
        if (ch.entregado && !orig.entregado) {
          // This call may fail (e.g., stock); capture it
          await axios.patch(
            `http://localhost:3000/api/pedidos/${pedido.id_pedido}/detalle/${ch.id}/entrega`,
            { entregado: true },
            { headers: { Authorization: `Bearer ${getToken()}` } }
          );
        }

        // Update local snapshot
        localPedido = {
          ...localPedido,
          detalles: localPedido.detalles.map((d) =>
            d.id_detalle_pedido === ch.id ? { ...d, fecha_estimada_entrega: ch.fecha || "", entregado: ch.entregado } : d
          ),
        };
      } catch (err: any) {
        // collect a friendly error for this detalle
        const msg = err?.response?.data?.message || err?.message || "Error desconocido";
        errors.push(`Detalle ${orig.nombre_producto} (id ${ch.id}): ${msg}`);
        // continue processing remaining changes
      }
    }

    // Apply local updates and show results
    setPedido(localPedido);
    setBulkSaving(false);

    if (errors.length > 0) {
      setErrorSummary(errors);
      // en caso de errores parciales mostramos el modal de errores (ya lo tienes)
      // y también dejamos la opción de "seguir editando"
      // no abrimos el successModal en este caso
    } else {
      // Success: sync editById to reflect saved state
      const newSnap: Record<number, { fecha: string; entregado: boolean }> = {};
      localPedido.detalles.forEach((d) => {
        newSnap[d.id_detalle_pedido] = {
          fecha: d.fecha_estimada_entrega ? d.fecha_estimada_entrega.split("T")[0] : "",
          entregado: !!d.entregado,
        };
      });
      setEditById(newSnap);

      // Mostrar modal de éxito con opción de volver a Pedidos o seguir editando
      setSuccessModal({
        title: "Cambios guardados",
        message: `Se guardaron correctamente ${changed.length} cambio(s) en el pedido #${pedido.id_pedido}.`,
      });
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (!pedido) return <p>No se encontró el pedido</p>;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Pedido #{pedido.id_pedido}</h2>
          <p className="text-sm text-gray-600 mt-1">{pedido.cliente} · {pedido.direccion}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/pedidos" className="text-sm text-gray-600 hover:underline">← Volver</Link>
        </div>
      </div>

      {/* Pedido info + estado */}
      <div className="bg-white rounded shadow p-4 grid md:grid-cols-2 gap-4">
        <div>
          <p><span className="font-medium">Cliente:</span> {pedido.cliente}</p>
          <p><span className="font-medium">Dirección:</span> {pedido.direccion}</p>
          <p><span className="font-medium">Creado:</span> {new Date(pedido.fecha_creacion_pedido).toLocaleString()}</p>
        </div>

        <form onSubmit={handleUpdateEstadoPedido} className="space-y-2">
          <label className="block font-medium">Estado del pedido</label>
          <select
            value={estadoPedido}
            onChange={(e) => setEstadoPedido(e.target.value as Pedido["estado_pedido"])}
            disabled={isCancelado || bulkSaving}
            className="w-full border p-2 rounded"
          >
            <option value="En progreso">En progreso</option>
            <option value="Listo para Entrega">Listo para Entrega</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="submit"
              disabled={isCancelado || bulkSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Guardar estado
            </button>

            {/* Guardar todos los cambios global */}
            <button
              type="button"
              onClick={handleGuardarTodos}
              disabled={isCancelado || bulkSaving}
              className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {bulkSaving ? "Guardando..." : "Guardar todos los cambios"}
            </button>
          </div>

          {isCancelado && (
            <p className="text-sm text-red-600 mt-1">Este pedido está cancelado; no se pueden hacer cambios.</p>
          )}
        </form>
      </div>

      {/* Detalles: tabla en md+, cards en móvil */}
      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Detalles del pedido</h3>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-left">Fecha estimada</th>
                <th className="px-3 py-2 text-center">Entregado</th>
                <th className="px-3 py-2 text-center">Subtotal</th>
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
                      <input
                        type="date"
                        value={edit?.fecha || ""}
                        onChange={(e) => updateDetalleCampo(d.id_detalle_pedido, { fecha: e.target.value })}
                        disabled={isCancelado || bulkSaving}
                        className="border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!edit?.entregado}
                        onChange={(e) => updateDetalleCampo(d.id_detalle_pedido, { entregado: e.target.checked })}
                        disabled={isCancelado || bulkSaving}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">Bs {Number(d.precio_total).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {pedido.detalles.map((d) => {
            const edit = editById[d.id_detalle_pedido];
            return (
              <article key={d.id_detalle_pedido} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">{d.nombre_producto}</div>
                    <div className="text-xs text-gray-500">{d.tipo} · {d.cantidad_pedida} uds</div>
                    <div className="text-xs mt-2">Subtotal: <span className="font-medium">Bs {Number(d.precio_total).toFixed(2)}</span></div>
                  </div>

                  <div className="text-xs text-gray-500">{/* placeholder for optional badge */}</div>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fecha estimada</label>
                    <input
                      type="date"
                      value={edit?.fecha || ""}
                      onChange={(e) => updateDetalleCampo(d.id_detalle_pedido, { fecha: e.target.value })}
                      disabled={isCancelado || bulkSaving}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!edit?.entregado}
                        onChange={(e) => updateDetalleCampo(d.id_detalle_pedido, { entregado: e.target.checked })}
                        disabled={isCancelado || bulkSaving}
                      />
                      <span className="text-xs text-gray-600">Entregado</span>
                    </label>

                    <div className="text-sm text-gray-600">Cant: {d.cantidad_pedida}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="pt-8 md:pt-4 flex items-center justify-end gap-2">
          {/* Guardar todos los cambios global */}
          <button
            type="button"
            onClick={handleGuardarTodos}
            disabled={isCancelado || bulkSaving}
            className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {bulkSaving ? "Guardando..." : "Guardar todos los cambios"}
          </button>
        </div>

        {pedido.detalles.length === 0 && (
          <div className="text-center py-6 text-gray-500">Sin detalles</div>
        )}
      </div>

      {/* Error summary modal (si hubo errores en bulk save) */}
      <Modal
        open={!!errorSummary}
        title="Algunos cambios no se guardaron"
        onClose={() => setErrorSummary(null)}
        secondaryLabel="Seguir editando"
        onSecondary={() => setErrorSummary(null)}
        primaryLabel="Volver a pedidos"
        onPrimary={() => {
          setErrorSummary(null);
          navigate("/pedidos");
        }}
        maxWidthClass="max-w-lg"
      >
        <ul className="list-disc pl-5 text-sm space-y-1">
          {errorSummary?.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Modal>

      {/* Success modal (para confirmaciones) */}
      <Modal
        open={!!successModal}
        title={successModal?.title}
        onClose={() => setSuccessModal(null)}
        secondaryLabel="Seguir editando"
        onSecondary={() => setSuccessModal(null)}
        primaryLabel="Volver a Pedidos"
        onPrimary={() => navigate("/pedidos")}
      >
        <p className="text-sm text-gray-700">{successModal?.message}</p>
      </Modal>

      <div className="flex justify-end">
        <button onClick={() => navigate("/pedidos")} className="px-4 py-2 rounded border hover:bg-gray-50">
          Volver a pedidos
        </button>
      </div>
    </div>
  );
}

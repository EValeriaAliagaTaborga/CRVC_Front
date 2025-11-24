import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

interface Construccion {
  id_construccion: number;
  direccion: string;
  nombre_empresa: string;
}

interface Producto {
  id_producto: string;
  nombre_producto: string;
  precio_unitario: number;
  cantidad_stock: number;
  tipo: "Primera" | "Segunda" | "Tercera" | string;
}

interface DetallePedido {
  id_producto: string;
  cantidad_pedida: number;
  fecha_estimada_entrega: string;
  precio_total: number;
}

type ModalError =
  | null
  | {
      title: string;
      message?: string;
      items?: string[];
    };

const CrearPedidoPage = () => {
  const [construcciones, setConstrucciones] = useState<Construccion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState({
    id_construccion: "",
    estado_pedido: "En progreso",
    descuento_pedido: 0,
    tipo_descuento: "porcentaje" as "porcentaje" | "monto_total" | "monto_por_unidad",
  });

  const [detalles, setDetalles] = useState<DetallePedido[]>([]);
  const [modalError, setModalError] = useState<ModalError>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resConstrucciones, resProductos] = await Promise.all([
          axios.get("http://localhost:3000/api/construcciones", {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          axios.get("http://localhost:3000/api/productos", {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ]);
        setConstrucciones(resConstrucciones.data || []);
        setProductos(resProductos.data || []);
      } catch {
        setModalError({
          title: "No se pudo cargar la información",
          message: "Ocurrió un error consultando construcciones y/o productos. Intenta nuevamente.",
        });
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const agregarDetalle = () => {
    setDetalles((prev) => [
      ...prev,
      { id_producto: "", cantidad_pedida: 1, fecha_estimada_entrega: "", precio_total: 0 },
    ]);
  };

  const handleDetalleChange = <K extends keyof DetallePedido>(
    index: number,
    field: K,
    value: DetallePedido[K]
  ) => {
    setDetalles((prev) => {
      const nuevos = [...prev];
      const actual = { ...nuevos[index], [field]: value } as DetallePedido;

      // si cambió producto o cantidad, recalcular precio_total
      if (field === "id_producto" || field === "cantidad_pedida") {
        const producto = productos.find((p) => p.id_producto === actual.id_producto);
        const cantidad = Number(actual.cantidad_pedida || 0);
        actual.precio_total = producto ? Number(producto.precio_unitario || 0) * cantidad : 0;
      }

      nuevos[index] = actual;
      return nuevos;
    });
  };

  const eliminarDetalle = (index: number) => {
    setDetalles((prev) => prev.filter((_, i) => i !== index));
  };

  const calcularPrecioTotal = () => {
    const baseTotal = detalles.reduce((sum, d) => sum + Number(d.precio_total || 0), 0);
    const totalUnidades = detalles.reduce((sum, d) => sum + Number(d.cantidad_pedida || 0), 0);
    const disc = Number(form.descuento_pedido) || 0;

    switch (form.tipo_descuento) {
      case "porcentaje":
        return Math.max(0, baseTotal * (1 - disc / 100));
      case "monto_total":
        return Math.max(0, baseTotal - disc);
      case "monto_por_unidad":
        return Math.max(0, baseTotal - disc * totalUnidades);
      default:
        return baseTotal;
    }
  };

  // ---------- SUBMIT con popup de errores ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id_construccion || detalles.length === 0) {
      setModalError({
        title: "Datos incompletos",
        message: "Debes seleccionar una construcción y agregar al menos un producto.",
      });
      return;
    }

    const camposInvalidos = detalles.some(
      (d) => !d.id_producto || d.cantidad_pedida <= 0 || !d.fecha_estimada_entrega
    );
    if (camposInvalidos) {
      setModalError({
        title: "Valores inválidos",
        message: "Cada producto debe tener valores válidos (producto, cantidad, fecha estimada).",
      });
      return;
    }

    // --- Pre-chequeo local: Segunda/Tercera no pueden exceder stock ---
    const sumPorProducto: Record<string, number> = {};
    for (const d of detalles) {
      sumPorProducto[d.id_producto] = (sumPorProducto[d.id_producto] || 0) + Number(d.cantidad_pedida || 0);
    }

    const violaciones: string[] = [];
    for (const id of Object.keys(sumPorProducto)) {
      const p = productos.find((pp) => pp.id_producto === id);
      if (!p) continue;
      const solicitado = sumPorProducto[id];
      const stock = Number(p.cantidad_stock || 0);
      if ((p.tipo === "Segunda" || p.tipo === "Tercera") && solicitado > stock) {
        violaciones.push(`${p.nombre_producto} (${p.tipo}): solicitado ${solicitado} > stock ${stock}`);
      }
    }

    if (violaciones.length > 0) {
      setModalError({
        title: "No se puede crear el pedido",
        message: "Los siguientes productos de Segunda/Tercera exceden el stock disponible:",
        items: violaciones,
      });
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        "http://localhost:3000/api/pedidos",
        {
          id_construccion: parseInt(form.id_construccion, 10),
          estado_pedido: form.estado_pedido,
          precio_pedido: calcularPrecioTotal(),
          descuento_pedido: Number(form.descuento_pedido),
          tipo_descuento: form.tipo_descuento,
          detalles,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      navigate("/pedidos");
    } catch (error: any) {
      const msg: string | undefined = error?.response?.data?.message;
      const det: any[] | undefined = error?.response?.data?.detalles;

      if (msg && Array.isArray(det) && det.length) {
        setModalError({
          title: "No se puede crear el pedido",
          message: msg,
          items: det.map(
            (x: any) => `${x.id_producto} (${x.tipo}): solicitado ${x.solicitado} > stock ${x.stock}`
          ),
        });
      } else {
        setModalError({
          title: "Error al registrar el pedido",
          message: msg || "Ocurrió un problema procesando la solicitud.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Registrar nuevo pedido</h2>

      <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 rounded shadow space-y-6">
        {/* Construcción + Estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Construcción (empresa - dirección)</label>
            <select
              name="id_construccion"
              value={form.id_construccion}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            >
              <option value="">Seleccione una construcción</option>
              {construcciones.map((c) => (
                <option key={c.id_construccion} value={c.id_construccion}>
                  {c.nombre_empresa} - {c.direccion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estado del pedido</label>
            <select
              name="estado_pedido"
              value={form.estado_pedido}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="En progreso">En progreso</option>
              <option value="Listo para entrega">Listo para entrega</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Productos del pedido (lista de detalles) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Productos del pedido</h3>
            <button
              type="button"
              onClick={agregarDetalle}
              className="text-sm text-sky-600 hover:underline"
            >
              + Agregar producto
            </button>
          </div>

          {/* Cabecera (solo visible en md+) */}
          <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50 p-3 rounded text-sm text-gray-600">
            <div className="col-span-3">Producto</div>
            <div className="col-span-2">Cantidad</div>
            <div className="col-span-3">Fecha estimada</div>
            <div className="col-span-2">Subtotal</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {/* Lista de detalles */}
          <div className="space-y-3">
            {detalles.map((detalle, index) => {
              const prod = productos.find((p) => p.id_producto === detalle.id_producto);
              return (
                <div key={index} className="border rounded p-3 bg-white shadow-sm">
                  <div className="md:grid md:grid-cols-12 md:items-center md:gap-4">
                    {/* Producto */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium mb-1">Producto</label>
                      <select
                        value={detalle.id_producto}
                        onChange={(e) => handleDetalleChange(index, "id_producto", e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                      >
                        <option value="">Seleccione producto</option>
                        {productos.map((p) => (
                          <option key={p.id_producto} value={p.id_producto}>
                            {p.nombre_producto} - {p.tipo}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cantidad */}
                    <div className="mt-3 md:mt-0 md:col-span-2">
                      <label className="block text-xs font-medium mb-1">Cantidad</label>
                      <input
                        type="number"
                        min={1}
                        value={detalle.cantidad_pedida}
                        onChange={(e) =>
                          handleDetalleChange(
                            index,
                            "cantidad_pedida",
                            Number(e.target.value) <= 0 ? 0 : Number(e.target.value)
                          )
                        }
                        className="w-full border border-gray-300 p-2 rounded"
                      />
                    </div>

                    {/* Fecha estimada */}
                    <div className="mt-3 md:mt-0 md:col-span-3">
                      <label className="block text-xs font-medium mb-1">Fecha estimada de entrega</label>
                      <input
                        type="date"
                        value={detalle.fecha_estimada_entrega}
                        onChange={(e) => handleDetalleChange(index, "fecha_estimada_entrega", e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded"
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="mt-3 md:mt-0 md:col-span-2 flex items-center">
                      <div>
                        <label className="block text-xs font-medium mb-1">Subtotal</label>
                        <div className="text-sm font-medium">Bs {Number(detalle.precio_total || 0).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-3 md:mt-0 md:col-span-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => eliminarDetalle(index)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div>
                    {detalle.id_producto && (
                        <p className="text-xs text-gray-500 mt-2">
                          Stock: <span className="font-medium">{prod?.cantidad_stock ?? 0} uds</span>
                        </p>
                      )}
                  </div>
                </div>
              );
            })}

            {detalles.length === 0 && (
              <div className="p-3 text-center text-gray-500 border rounded">No hay productos agregados</div>
            )}
          </div>
        </div>

        {/* Resumen y descuentos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de descuento</label>
              <select
                name="tipo_descuento"
                value={form.tipo_descuento}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tipo_descuento: e.target.value as any,
                    descuento_pedido: 0,
                  }))
                }
                className="w-full border border-gray-300 p-2 rounded"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_total">Monto fijo total</option>
                <option value="monto_por_unidad">Monto por unidad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {form.tipo_descuento === "porcentaje"
                  ? "Descuento (%)"
                  : form.tipo_descuento === "monto_total"
                  ? "Descuento total (Bs)"
                  : "Descuento por unidad (Bs)"}
              </label>
              <input
                type="number"
                name="descuento_pedido"
                value={form.descuento_pedido}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, descuento_pedido: Number(e.target.value || 0) }))
                }
                min={0}
                step="0.01"
                max={form.tipo_descuento === "porcentaje" ? 100 : undefined}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl font-bold">Bs {calcularPrecioTotal().toFixed(2)}</div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              // reset form helper
              setDetalles([]);
              setForm({
                id_construccion: "",
                estado_pedido: "En progreso",
                descuento_pedido: 0,
                tipo_descuento: "porcentaje",
              });
            }}
            className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            disabled={submitting}
          >
            Limpiar
          </button>

          <button
            type="submit"
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            disabled={detalles.length === 0 || submitting}
          >
            {submitting ? "Guardando..." : "Guardar pedido"}
          </button>
        </div>
      </form>

      {/* ---- Modal Error ---- */}
      {modalError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full">
            <h4 className="text-lg font-semibold mb-2">{modalError.title}</h4>
            {modalError.message && <p className="text-sm text-gray-700 mb-3">{modalError.message}</p>}
            {modalError.items && modalError.items.length > 0 && (
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
                {modalError.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            )}
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
};

export default CrearPedidoPage;

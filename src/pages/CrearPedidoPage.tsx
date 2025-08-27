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
      items?: string[]; // para listar violaciones por producto
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
        setConstrucciones(resConstrucciones.data);
        setProductos(resProductos.data);
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const agregarDetalle = () => {
    setDetalles((prev) => [
      ...prev,
      {
        id_producto: "",
        cantidad_pedida: 0,
        fecha_estimada_entrega: "",
        precio_total: 0,
      },
    ]);
  };

  const handleDetalleChange = <K extends keyof DetallePedido>(
    index: number,
    field: K,
    value: DetallePedido[K]
  ) => {
    const nuevos = [...detalles];
    nuevos[index] = { ...nuevos[index], [field]: value };

    if (field === "id_producto" || field === "cantidad_pedida") {
      const producto = productos.find((p) => p.id_producto === nuevos[index].id_producto);
      const cantidad = Number(nuevos[index].cantidad_pedida);
      nuevos[index].precio_total = producto ? producto.precio_unitario * cantidad : 0;
    }

    setDetalles(nuevos);
  };

  const eliminarDetalle = (index: number) => {
    const nuevos = [...detalles];
    nuevos.splice(index, 1);
    setDetalles(nuevos);
  };

  const calcularPrecioTotal = () => {
    const baseTotal = detalles.reduce((sum, d) => sum + d.precio_total, 0);
    const totalUnidades = detalles.reduce((sum, d) => sum + d.cantidad_pedida, 0);
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

    try {
      await axios.post(
        "http://localhost:3000/api/pedidos",
        {
          id_construccion: parseInt(form.id_construccion),
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
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Registrar nuevo pedido</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-6 max-w-4xl">
        <div>
          <label className="block font-medium">Construcción (nombre_empresa)</label>
          <select
            name="id_construccion"
            value={form.id_construccion}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione una construcción</option>
            {construcciones.map((c) => (
              <option key={c.id_construccion} value={c.id_construccion}>
                {c.nombre_empresa} - {c.direccion}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Productos del pedido</h3>
          {detalles.map((detalle, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block font-medium">Producto</label>
                <select
                  value={detalle.id_producto}
                  onChange={(e) => handleDetalleChange(index, "id_producto", e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione producto</option>
                  {productos.map((p) => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre_producto} - {p.tipo}
                    </option>
                  ))}
                </select>
                {detalle.id_producto &&
                  (() => {
                    const prod = productos.find((p) => p.id_producto === detalle.id_producto);
                    return (
                      <p className="text-xs text-gray-500 mt-1">
                        Stock disponible: {prod?.cantidad_stock ?? 0} uds.
                      </p>
                    );
                  })()}
              </div>
              <div>
                <label className="block font-medium">Cantidad</label>
              <input
                type="number"
                placeholder="Cantidad"
                value={detalle.cantidad_pedida}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  handleDetalleChange(index, "cantidad_pedida", isNaN(value) ? 0 : value);
                }}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              </div>
              <div>
                <label className="block font-medium">Fecha estimada de entrega</label>
                <input
                  type="date"
                  value={detalle.fecha_estimada_entrega}
                  onChange={(e) => handleDetalleChange(index, "fecha_estimada_entrega", e.target.value)}
                  required
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm">Bs {detalle.precio_total.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => eliminarDetalle(index)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={agregarDetalle}
            className="text-blue-600 text-sm mt-2 hover:underline"
          >
            + Agregar producto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="">
            <div>
              <label className="block font-medium">Tipo de descuento</label>
              <select
                name="tipo_descuento"
                value={form.tipo_descuento}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipo_descuento: e.target.value as any,
                    descuento_pedido: 0,
                  })
                }
                className="w-full border p-2 rounded"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_total">Monto fijo total</option>
                <option value="monto_por_unidad">Monto por unidad</option>
              </select>
            </div>

            <div>
              <label className="block font-medium">
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
                  setForm({
                    ...form,
                    descuento_pedido: parseFloat(e.target.value || "0"),
                  })
                }
                min={0}
                step="0.01"
                max={form.tipo_descuento === "porcentaje" ? 100 : undefined}
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="flex flex-col justify-end">
              <p className="text-right text-lg font-bold">
                Total: Bs {calcularPrecioTotal().toFixed(2)}
              </p>
            </div>
          </div>
        </div>
         <div>
            <label className="block font-medium">Estado del pedido</label>
            <select
              name="estado_pedido"
              value={form.estado_pedido}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="En progreso">En progreso</option>
              <option value="Listo para entrega">Listo para entrega</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-right text-lg font-bold">
              Total: Bs {calcularPrecioTotal().toFixed(2)}
            </p>
          </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={detalles.length === 0}
        >
          Guardar pedido
        </button>
      </form>

      {/* ---- Modal Error ---- */}
      {modalError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

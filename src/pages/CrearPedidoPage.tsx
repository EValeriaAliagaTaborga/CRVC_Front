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
  tipo: string;
}

interface DetallePedido {
  id_producto: string;
  cantidad_pedida: number;
  fecha_estimada_entrega: string;
  precio_total: number;
}

const CrearPedidoPage = () => {
  const [construcciones, setConstrucciones] = useState<Construccion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState({
    id_construccion: "",
    estado_pedido: "En progreso",
    descuento_pedido: 0,
    tipo_descuento: "porcentaje" as
      | "porcentaje"
      | "monto_total"
      | "monto_por_unidad",
    detalles: [ ]
  });

  const [detalles, setDetalles] = useState<DetallePedido[]>([]);

  const navigate = useNavigate();

  // Fetch construcciones y productos
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
      } catch (error) {
        alert("Error al cargar datos del servidor");
      }
    };
    fetchData();
  }, []);

  // Manejo de cambios del formulario general
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Agregar un producto al pedido
  const agregarDetalle = () => {
    setDetalles([
      ...detalles,
      {
        id_producto: "",
        cantidad_pedida: 0,
        fecha_estimada_entrega: "",
        precio_total: 0,
      },
    ]);
  };

  // Manejar cambio en un detalle específico
  const handleDetalleChange = <K extends keyof DetallePedido>(
    index: number,
    field: K,
    value: DetallePedido[K]
  ) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      [field]: value,
    };

    if (field === "id_producto" || field === "cantidad_pedida") {
      const producto = productos.find(
        (p) => p.id_producto === nuevosDetalles[index].id_producto
      );
      const cantidad = Number(nuevosDetalles[index].cantidad_pedida);
      nuevosDetalles[index].precio_total = producto
        ? producto.precio_unitario * cantidad
        : 0;
    }

    setDetalles(nuevosDetalles);
  };

  // Eliminar producto del pedido
  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles.splice(index, 1);
    setDetalles(nuevosDetalles);
  };

  // Calcular el precio total del pedido
  const calcularPrecioTotal = () => {
    const baseTotal = detalles.reduce((sum, d) => sum + d.precio_total, 0);
    const totalUnidades = detalles.reduce(
      (sum, d) => sum + d.cantidad_pedida,
      0
    );
    const disc = form.descuento_pedido;

    switch (form.tipo_descuento) {
      case "porcentaje":
        return baseTotal * (1 - disc / 100);
      case "monto_total":
        return Math.max(0, baseTotal - disc);
      case "monto_por_unidad":
        return Math.max(0, baseTotal - disc * totalUnidades);
      default:
        return baseTotal;
    }
  };

  // Enviar el pedido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id_construccion || detalles.length === 0) {
      alert(
        "Debes seleccionar una construcción y agregar al menos un producto."
      );
      return;
    }

    const camposInvalidos = detalles.some(
      (detalle) =>
        !detalle.id_producto ||
        detalle.cantidad_pedida <= 0 ||
        !detalle.fecha_estimada_entrega
    );

    if (camposInvalidos) {
      alert(
        "Todos los productos deben tener valores válidos (producto, cantidad, fecha estimada)."
      );
      return;
    }

    console.log("➡️ Detalles enviados:", detalles);

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
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      navigate("/pedidos");
    } catch (error) {
      alert("Error al registrar el pedido");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Registrar nuevo pedido</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md space-y-6 max-w-4xl"
      >
        <div>
          <label className="block font-medium">
            Construcción (nombre_empresa)
          </label>
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
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
            >
              <select
                value={detalle.id_producto}
                onChange={(e) =>
                  handleDetalleChange(index, "id_producto", e.target.value)
                }
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione producto</option>
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre_producto} - {p.tipo}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Cantidad"
                value={detalle.cantidad_pedida}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  handleDetalleChange(
                    index,
                    "cantidad_pedida",
                    isNaN(value) ? 0 : value
                  );
                }}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <input
                type="date"
                value={detalle.fecha_estimada_entrega}
                onChange={(e) =>
                  handleDetalleChange(
                    index,
                    "fecha_estimada_entrega",
                    e.target.value
                  )
                }
                required
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Bs {detalle.precio_total.toFixed(2)}
                </span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de descuento */}
            <div>
              <label className="block font-medium">Tipo de descuento</label>
              <select
                name="tipo_descuento"
                value={form.tipo_descuento}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipo_descuento: e.target.value as any,
                    // opcional: reset valor al cambiar tipo
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
            {/* Valor del descuento */}
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
                    descuento_pedido: parseFloat(e.target.value),
                  })
                }
                min={0}
                step="0.01"
                max={form.tipo_descuento === "porcentaje" ? 100 : undefined}
                className="w-full border p-2 rounded"
              />
            </div>
            {/* Total calculado */}
            <div className="flex flex-col justify-end">
              <p className="text-right text-lg font-bold">
                Total: Bs {calcularPrecioTotal().toFixed(2)}
              </p>
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
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={detalles.length === 0}
        >
          Guardar pedido
        </button>
      </form>
    </div>
  );
};

export default CrearPedidoPage;

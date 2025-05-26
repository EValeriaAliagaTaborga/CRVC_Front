import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import { toast } from "react-toastify";


interface Producto {
  id_producto: string;
  nombre_producto: string;
  tipo: string;
}

const CrearOrdenPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre_producto: "",
    id_vagon: 0,
    fecha_carga: new Date().toISOString().slice(0, 10),
    cantidad_inicial_por_producir: 0,
    estado_orden: "En progreso"
  });


  const [tiposUnicos, setTiposUnicos] = useState<string[]>([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/productos", {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        //console.log("📦 Productos recibidos:", res.data);
        // Obtener nombres únicos
        const nombres = [...new Set(res.data.map((p: Producto) => p.nombre_producto as string))] as string[];
        setTiposUnicos(nombres);
      } catch (error) {
        toast.error("Error al cargar productos");
      }
    };

    fetchProductos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "id_vagon" || name === "cantidad_inicial_por_producir"
        ? Number(value)
        : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre_producto || form.id_vagon <= 0 || form.cantidad_inicial_por_producir <= 0) {
      toast.error("Por favor completa todos los campos correctamente");
      return;
    }

    try {
      await axios.post("http://localhost:3000/api/produccion", form, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success("Orden registrada correctamente ✅");
      navigate("/produccion");
    } catch (error) {
      toast.error("Error al registrar orden");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Registrar Nueva Orden de Producción</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4 max-w-xl">
        <div>
          <label className="block font-medium mb-1">Producto</label>
          <select
            name="nombre_producto"
            value={form.nombre_producto}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Seleccionar tipo de ladrillo</option>
            {tiposUnicos.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Número de Vagón</label>
          <input
            type="number"
            name="id_vagon"
            value={form.id_vagon}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            min={1}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Fecha de carga</label>
          <input
            type="date"
            name="fecha_carga"
            value={form.fecha_carga}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Cantidad inicial a producir</label>
          <input
            type="number"
            name="cantidad_inicial_por_producir"
            value={form.cantidad_inicial_por_producir}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            min={1}
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Guardar Orden
        </button>
      </form>
    </div>
  );
};

export default CrearOrdenPage;

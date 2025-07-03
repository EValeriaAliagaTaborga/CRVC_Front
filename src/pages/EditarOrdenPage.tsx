import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import { toast } from "react-toastify";

const EditarOrdenPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fecha_descarga: new Date().toISOString().slice(0, 10),
    cantidad_final_calidad_primera: 0,
    cantidad_final_calidad_segunda: 0,
    cantidad_final_calidad_tercera: 0,
    estado_orden: "Finalizado",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrden = async () => {
      try {
        await axios.get(`http://localhost:3000/api/produccion/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      } catch (error) {
        toast.error("Ocurrió un error al cargar la orden");
      } finally {
        setLoading(false);
      }
    };

    fetchOrden();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name.includes("cantidad") ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      form.cantidad_final_calidad_primera < 0 ||
      form.cantidad_final_calidad_segunda < 0 ||
      form.cantidad_final_calidad_tercera < 0
    ) {
      alert("Las cantidades deben ser valores positivos o cero");
      return;
    }

    try {
      await axios.put(`http://localhost:3000/api/produccion/${id}`, form, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      toast.success("Orden finalizada y stock actualizado ✅");
      navigate("/produccion");
    } catch (error) {
      toast.error("Ocurrió un error al guardar");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Finalizar Orden de Producción</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md space-y-4 max-w-xl"
      >
        <div>
          <label className="block font-medium mb-1">Fecha de descarga</label>
          <input
            type="date"
            name="fecha_descarga"
            value={form.fecha_descarga}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            Cantidad final (Calidad Primera)
          </label>
          <input
            type="number"
            name="cantidad_final_calidad_primera"
            value={form.cantidad_final_calidad_primera}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            Cantidad final (Calidad Segunda)
          </label>
          <input
            type="number"
            name="cantidad_final_calidad_segunda"
            value={form.cantidad_final_calidad_segunda}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            Cantidad final (Calidad Tercera)
          </label>
          <input
            type="number"
            name="cantidad_final_calidad_tercera"
            value={form.cantidad_final_calidad_tercera}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default EditarOrdenPage;

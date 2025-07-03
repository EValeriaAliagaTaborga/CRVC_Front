import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

const estados = ["En progreso", "Listo para entrega", "Entregado", "Cancelado"];

const EditarEstadoPedidoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/pedidos`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        const pedido = res.data.find((p: any) => p.id_pedido === Number(id));
        if (pedido) setEstado(pedido.estado_pedido);
      } catch (error) {
        alert("Error al cargar pedido");
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3000/api/pedidos/${id}/estado`,
        { estado_pedido: estado },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      navigate("/pedidos");
    } catch (error) {
      alert("Error al actualizar estado");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Actualizar estado del pedido</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md space-y-4"
      >
        <div>
          <label className="block font-medium mb-1">Estado actual</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {estados.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
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

export default EditarEstadoPedidoPage;

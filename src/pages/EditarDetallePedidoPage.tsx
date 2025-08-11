import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

const EditarDetallePedidoPage = () => {
  const { detalleId, pedidoId } = useParams<{ detalleId: string; pedidoId: string }>();
  const navigate = useNavigate();
  const [fecha, setFecha] = useState("");
  const [entregado, setEntregado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/pedidos`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      .then(res => {
        const pedido = res.data.find((p: any) => p.id_pedido === Number(pedidoId));
        const det = pedido?.detalles.find((d: any) => d.id_detalle_pedido === Number(detalleId));
        if (det) {
          setFecha(det.fecha_estimada_entrega.split("T")[0]);
          setEntregado(!!det.entregado);
        }
      })
      .finally(() => setLoading(false));
  }, [detalleId, pedidoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.patch(
      `http://localhost:3000/api/pedidos/detalles/${detalleId}`,
      { fecha_estimada_entrega: fecha, entregado },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    navigate("/pedidos");
  };

  if (loading) return <p>Cargando...</p>;
  return (
    <form onSubmit={handleSubmit} className="max-w-md p-6 bg-white rounded shadow-md space-y-4">
      <h2 className="text-xl font-bold">Actualizar entrega</h2>
      <div>
        <label className="block mb-1">Fecha estimada</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={entregado}
          onChange={e => setEntregado(e.target.checked)}
        />
        <label>¿Entregado?</label>
      </div>
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
        Guardar
      </button>
    </form>
  );
};

export default EditarDetallePedidoPage;

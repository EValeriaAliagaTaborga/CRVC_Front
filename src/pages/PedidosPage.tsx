import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

interface DetallePedido {
    id_detalle_pedido: number;
    id_producto: string;
    cantidad_pedida: number;
    precio_total: number;
    fecha_estimada_entrega: string;
    nombre_producto: string;
    tipo: string;
}

interface Pedido {
    id_pedido: number;
    fecha_creacion_pedido: string;
    precio_pedido: string;
    descuento_pedido: string;
    estado_pedido: string;
    direccion: string;
    cliente: string;
    detalles: DetallePedido[];
}

const PedidosPage = () => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);

    useEffect(() => {
        const fetchPedidos = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/pedidos", {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                setPedidos(res.data);
            } catch (error) {
                console.error("Error al obtener pedidos", error);
            }
        };

        fetchPedidos();
    }, []);

    const handleEliminar = async (id: number) => {
        if (window.confirm("¿Estás seguro de eliminar este pedido?")) {
            try {
                await axios.delete(`http://localhost:3000/api/pedidos/${id}`, {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                setPedidos(pedidos.filter(p => p.id_pedido !== id));
            } catch (error) {
                alert("Error al eliminar pedido");
            }
        }
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Pedidos registrados</h2>
                <Link
                    to="/pedidos/crear"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + Registrar pedido
                </Link>
            </div>

            <div className="bg-white shadow-md rounded overflow-x-auto">
                <table className="min-w-full text-sm table-auto">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-4 py-2">Cliente</th>
                            <th className="px-4 py-2">Construcción</th>
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Precio</th>
                            <th className="px-4 py-2">Descuento</th>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Productos</th>
                            <th className="px-4 py-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedidos.map((p) => (
                            <tr key={p.id_pedido} className="border-t align-top">
                                <td className="px-4 py-2">{p.cliente}</td>
                                <td className="px-4 py-2">{p.direccion}</td>
                                <td className="px-4 py-2">{new Date(p.fecha_creacion_pedido).toLocaleDateString()}</td>
                                <td className="px-4 py-2">Bs {parseFloat(p.precio_pedido).toFixed(2)}</td>
                                <td className="px-4 py-2">{p.descuento_pedido}%</td>
                                <td className="px-4 py-2">{p.estado_pedido}</td>
                                <td className="px-4 py-2">
                                    {p.detalles.length > 0 ? (
                                        <ul className="list-disc pl-4">
                                            {p.detalles.map((detalle) => (
                                                <li key={detalle.id_detalle_pedido}>
                                                    {detalle.nombre_producto} ({detalle.tipo}) - {detalle.cantidad_pedida} uds.
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-gray-400">Sin productos</span>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => handleEliminar(p.id_pedido)}
                                        className="text-red-600 hover:underline text-sm"
                                    >
                                        Eliminar
                                    </button>

                                </td>
                                <td className="px-4 py-2">
                                <Link
                                    to={`/pedidos/${p.id_pedido}/estado`}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    Cambiar estado
                                </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PedidosPage;
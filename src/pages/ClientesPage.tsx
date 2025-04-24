import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import { useNavigate } from "react-router-dom";

interface Cliente {
  id_cliente: number;
  nombre_empresa: string;
  nombre_contacto: string;
  telefono_fijo: string;
  celular: string;
  email: string;
}

const ClientesPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/clientes", {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });
        setClientes(res.data);
      } catch (error) {
        console.error("Error al obtener clientes", error);
      }
    };

    fetchClientes();
  }, []);

  const navigate = useNavigate();

    const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

    try {
        await axios.delete(`http://localhost:3000/api/clientes/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
        });
        // Actualiza lista local
        setClientes(clientes.filter((c) => c.id_cliente !== id));
    } catch (error) {
        alert("Error al eliminar cliente");
    }
    };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Clientes registrados</h2>
        <Link
          to="/clientes/crear"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Registrar cliente
        </Link>
      </div>

      <div className="bg-white shadow-md rounded">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-left text-sm">
            <tr>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">Contacto</th>
              <th className="px-4 py-2">Celular</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {clientes.map((cliente) => (
              <tr key={cliente.id_cliente} className="border-t">
                <td className="px-4 py-2">{cliente.nombre_empresa}</td>
                <td className="px-4 py-2">{cliente.nombre_contacto}</td>
                <td className="px-4 py-2">{cliente.celular}</td>
                <td className="px-4 py-2">{cliente.email}</td>
                <td className="px-4 py-2 space-x-2">
                    <button
                    onClick={() => navigate(`/clientes/${cliente.id_cliente}`)}
                    className="text-blue-600 hover:underline"
                    >
                    Editar
                    </button>
                    <button
                    onClick={() => handleDelete(cliente.id_cliente)}
                    className="text-red-600 hover:underline"
                    >
                    Eliminar
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientesPage;

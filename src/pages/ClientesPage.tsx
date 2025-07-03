import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";

const usuario = getUsuario();
const esAdministrador = usuario?.rol === "1";

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
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroContacto, setFiltroContacto] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 25;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/clientes", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        setClientes(res.data);
      } catch (error) {
        console.error("Error al obtener clientes", error);
      }
    };

    fetchClientes();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

    try {
      await axios.delete(`http://localhost:3000/api/clientes/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setClientes(clientes.filter((c) => c.id_cliente !== id));
    } catch (error) {
      alert("Error al eliminar cliente");
    }
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre_empresa.toLowerCase().includes(filtroEmpresa.toLowerCase()) &&
      c.nombre_contacto.toLowerCase().includes(filtroContacto.toLowerCase())
  );

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
  const clientesPagina = clientesFiltrados.slice(
    (paginaActual - 1) * clientesPorPagina,
    paginaActual * clientesPorPagina
  );

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

      {/* Filtros */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div>
          <label className="block text-sm">Empresa</label>
          <input
            type="text"
            placeholder="Filtrar por Empresa"
            value={filtroEmpresa}
            onChange={(e) => {
              setFiltroEmpresa(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm">Contacto</label>
          <input
            type="text"
            placeholder="Filtrar por Contacto"
            value={filtroContacto}
            onChange={(e) => {
              setFiltroContacto(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-md rounded">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">Contacto</th>
              <th className="px-4 py-2">Celular</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesPagina.map((cliente) => (
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
                  {esAdministrador && (
                    <button
                      onClick={() => handleDelete(cliente.id_cliente)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {clientesPagina.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPaginaActual(n)}
              className={`px-3 py-1 rounded ${
                n === paginaActual
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientesPage;

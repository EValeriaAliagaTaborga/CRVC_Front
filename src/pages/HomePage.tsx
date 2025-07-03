import { useEffect, useState } from "react";
import axios from "axios";
import { removeToken, getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import { useNavigate } from "react-router-dom";

interface Log {
  id_log: number;
  nombre_usuario: string;
  rol: string;
  accion: string;
  detalle: string;
  fecha: string;
}

const HomePage = () => {
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const registrosPorPagina = 20;
  const navigate = useNavigate();

  // Obtener usuario actual del localStorage
  useEffect(() => {
    const user = getUsuario();
    setUsuario(user);
  }, []);

  // Obtener logs desde backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/logs", {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setLogs(res.data);
      } catch (error) {
        console.error("Error al obtener logs:", error);
      }
    };

    fetchLogs();
  }, []);

  // Filtrado por nombre de usuario
  const logsFiltrados = logs.filter(log =>
    log.nombre_usuario.toLowerCase().includes(search.toLowerCase())
  );

  // Paginación (frontend)
  const totalPaginas = Math.ceil(logsFiltrados.length / registrosPorPagina);
  const logsPaginados = logsFiltrados.slice(
    (currentPage - 1) * registrosPorPagina,
    currentPage * registrosPorPagina
  );

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">
          Bienvenido {usuario.nombre}
        </h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded">
          Cerrar sesión
        </button>
      </div>

      {/* Filtro */}
      <label className="block text-sm">Buscar Logs</label>
      <input
        type="text"
        placeholder="Buscar por nombre de usuario"
        className="border px-3 py-2 mb-4 w-full rounded"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1); // Reinicia a la primera página si filtras
        }}
      />

      {/* Tabla de logs */}
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Acción</th>
              <th className="px-4 py-2">Detalle</th>
              <th className="px-4 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {logsPaginados.map((log) => (
              <tr key={log.id_log} className="border-t">
                <td className="px-4 py-2">{log.nombre_usuario}</td>
                <td className="px-4 py-2">{log.rol}</td>
                <td className="px-4 py-2">{log.accion}</td>
                <td className="px-4 py-2">{log.detalle}</td>
                <td className="px-4 py-2">{new Date(log.fecha).toLocaleString()}</td>
              </tr>
            ))}
            {logsPaginados.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No se encontraron registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-4 py-2 bg-gray-200 rounded"
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <span className="px-4 py-2">Página {currentPage} de {totalPaginas}</span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))}
          className="px-4 py-2 bg-gray-200 rounded"
          disabled={currentPage === totalPaginas}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default HomePage;
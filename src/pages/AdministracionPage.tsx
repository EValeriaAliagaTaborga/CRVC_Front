import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from "../services/auth";
import { useNavigate } from 'react-router-dom';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  id_rol: string;
}

const AdministracionPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tipoReporte, setTipoReporte] = useState('pedidos');
  const [formato, setFormato] = useState('pdf');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 15;
  const navigate = useNavigate();

  const rolesMap: { [key: string]: string } = {
      "1": "Administrador",
      "2": "Vendedor",
      "3": "Encargado de Producción"
    };
    

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/usuarios', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setUsuarios(response.data);
      } catch (error) {
        console.error('Error al obtener los usuarios:', error);
      }
    };

    fetchUsuarios();
  }, []);

  const handleEditar = (id: number) => {
    navigate(`/administracion/usuarios/editar/${id}`);
  };

  const handleGenerarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const response = await axios.post(
        'http://localhost:3000/api/reportes',
        {
          tipo: tipoReporte,
          formato: formato,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${getToken()}` }
        }
      );

      const blob = new Blob([response.data], {
        type:
          formato === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.${formato}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      alert('Hubo un error al generar el reporte.');
    } finally {
      setCargando(false);
    }
  };

    // Filtrado
  const usuariosFiltrados = usuarios.filter((usuario) =>
    usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    rolesMap[usuario.id_rol]?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Paginación
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const inicio = (paginaActual - 1) * usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(inicio, inicio + usuariosPorPagina);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Listado de Usuarios</h2>
      <label className="block text-sm">Buscar Usuario</label>
      <input
        type="text"
        placeholder="Buscar por nombre, correo o rol..."
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setPaginaActual(1); // reiniciar a página 1 al buscar
        }}
        className="border p-2 mb-4 w-full md:w-1/2 rounded"
      />

      <div className="overflow-x-auto rounded-md shadow border border-gray-200 mb-10">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Correo electrónico</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Rol</th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {usuariosPaginados.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-800">{usuario.nombre}</td>
                <td className="px-6 py-4 text-gray-600">{usuario.email}</td>
                <td className="px-6 py-4 text-gray-600">{rolesMap[usuario.id_rol]}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleEditar(usuario.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {usuariosPaginados.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2 mb-10">
          {Array.from({ length: totalPaginas }, (_, i) => (
            <button
              key={i + 1}
              className={`px-3 py-1 border rounded ${paginaActual === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
              onClick={() => setPaginaActual(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <h2>Generar Reporte</h2>
      <form onSubmit={handleGenerarReporte} className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg">
        <div>
          <label  className="block font-medium mb-1">Tipo de Reporte:</label>
          <select
            value={tipoReporte}
            onChange={(e) => setTipoReporte(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="pedidos">Pedidos</option>
            <option value="produccion">Órdenes de Producción</option>
          </select>
        </div>
        <div>
          <label  className="block font-medium mb-1">Formato:</label>
          <select
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel</option>
          </select>
        </div>
        <div>
          <label  className="block font-medium mb-1">Fecha Inicio:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            required className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label  className="block font-medium mb-1">Fecha Fin:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            required className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" disabled={cargando} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          {cargando ? 'Generando...' : 'Generar y Descargar'}
        </button>
      </form>
    </div>
  );
};

export default AdministracionPage;

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getToken } from "../services/auth";
import { useNavigate } from 'react-router-dom';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  id_rol: string;
  bloqueado?: number | boolean; // 0/1 o boolean
}

const AdministracionPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tipoReporte, setTipoReporte] = useState<'pedidos'|'produccion'|'kardex'>('pedidos');
  const [formato, setFormato] = useState<'pdf'|'xlsx'>('pdf');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 15;
  const navigate = useNavigate();

  // Kardex
  const [kardexProductoId, setKardexProductoId] = useState('');
  const [kardexTipoMov, setKardexTipoMov] = useState<''|'ENTRADA'|'SALIDA'>('');
  const [kardexTodos, setKardexTodos] = useState(false);

  // Crear usuario (modal simple)
  const [showCrear, setShowCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPass, setNuevoPass] = useState('');
  const [nuevoRol, setNuevoRol] = useState<'1'|'2'|'3'>('2');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);

  const rolesMap: { [key: string]: string } = {
    "1": "Administrador",
    "2": "Vendedor",
    "3": "Encargado de Producción"
  };

  const headers = useMemo(() => ({ Authorization: `Bearer ${getToken()}` }), []);

  const cargarUsuarios = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/usuarios', { headers });
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      alert('Error al obtener usuarios');
    }
  };

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditar = (id: number) => {
    navigate(`/administracion/usuarios/editar/${id}`);
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoEmail.trim() || !nuevoPass.trim()) {
      alert("Completa nombre, email y contraseña.");
      return;
    }
    setGuardandoUsuario(true);
    try {
      await axios.post('http://localhost:3000/api/usuarios', {
        nombre: nuevoNombre.trim(),
        email: nuevoEmail.trim(),
        contrasena: nuevoPass,
        id_rol: Number(nuevoRol),
      }, { headers });

      setShowCrear(false);
      setNuevoNombre(''); setNuevoEmail(''); setNuevoPass(''); setNuevoRol('2');
      await cargarUsuarios();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Error al crear usuario");
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este usuario? Esta acción es permanente.")) return;
    try {
      await axios.delete(`http://localhost:3000/api/usuarios/${id}`, { headers });
      setUsuarios(us => us.filter(u => u.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Error al eliminar usuario");
    }
  };

  const toggleBloqueo = async (u: Usuario) => {
    const bloqueado = !!u.bloqueado;
    const accion = bloqueado ? "DESBLOQUEAR" : "BLOQUEAR";
    if (!window.confirm(`¿${accion} usuario ${u.nombre}?`)) return;
    try {
      await axios.patch(`http://localhost:3000/api/usuarios/${u.id}/bloqueo`, {
        bloqueado: !bloqueado
      }, { headers });

      setUsuarios(us => us.map(x => x.id === u.id ? { ...x, bloqueado: !bloqueado } : x));
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || `Error al ${accion.toLowerCase()} usuario`);
    }
  };

  const handleGenerarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      if (tipoReporte === 'kardex') {
        const params: any = { formato };
        if (fechaInicio) params.desde = fechaInicio;
        if (fechaFin) params.hasta = fechaFin;
        if (kardexTipoMov) params.tipo = kardexTipoMov;

        let url = '';
        if (kardexTodos) {
          url = `http://localhost:3000/api/productos/movimientos/export`;
        } else {
          if (!kardexProductoId.trim()) {
            alert('Ingresa el código de producto o marca "Todos los productos".');
            setCargando(false);
            return;
          }
          url = `http://localhost:3000/api/productos/${encodeURIComponent(kardexProductoId)}/movimientos/export`;
        }

        const res = await axios.get(url, {
          params,
          responseType: 'blob',
          headers
        });

        const blob = new Blob([res.data], {
          type: formato === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const link = document.createElement('a');
        const dlName = kardexTodos
          ? `kardex_todos_${new Date().toISOString().split('T')[0]}.${formato}`
          : `kardex_${kardexProductoId}_${new Date().toISOString().split('T')[0]}.${formato}`;
        link.href = URL.createObjectURL(blob);
        link.download = dlName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
      } else {
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
            headers
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
      }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Listado de Usuarios</h2>
        <button
          onClick={() => setShowCrear(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nuevo usuario
        </button>
      </div>

      <label className="block text-sm">Buscar Usuario</label>
      <input
        type="text"
        placeholder="Buscar por nombre, correo o rol..."
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setPaginaActual(1);
        }}
        className="border p-2 mb-4 w-full md:w-1/2 rounded"
      />

      <div className="overflow-x-auto rounded-md shadow border border-gray-200 mb-10 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Correo</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Rol</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase">Estado</th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {usuariosPaginados.map((u) => {
              const isBlocked = !!u.bloqueado;
              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800">{u.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4 text-gray-600">{rolesMap[u.id_rol]}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {isBlocked ? 'Bloqueado' : 'Activo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-3">
                    <button
                      onClick={() => handleEditar(u.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleBloqueo(u)}
                      className={`font-medium transition ${isBlocked ? 'text-green-700 hover:text-green-900' : 'text-yellow-600 hover:text-yellow-800'}`}
                    >
                      {isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button
                      onClick={() => handleEliminar(u.id)}
                      className="text-red-600 hover:text-red-800 font-medium transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
            {usuariosPaginados.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      {/* CREAR USUARIO */}
      {showCrear && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCrearUsuario}
            className="bg-white rounded shadow-lg p-6 w-full max-w-md space-y-4"
          >
            <h3 className="text-lg font-semibold">Nuevo usuario</h3>
            <div>
              <label className="block text-sm mb-1">Nombre</label>
              <input
                value={nuevoNombre}
                onChange={e => setNuevoNombre(e.target.value)}
                className="border rounded w-full px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Correo</label>
              <input
                type="email"
                value={nuevoEmail}
                onChange={e => setNuevoEmail(e.target.value)}
                className="border rounded w-full px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Contraseña</label>
              <input
                type="password"
                value={nuevoPass}
                onChange={e => setNuevoPass(e.target.value)}
                className="border rounded w-full px-3 py-2"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Rol</label>
              <select
                value={nuevoRol}
                onChange={e => setNuevoRol(e.target.value as any)}
                className="border rounded w-full px-3 py-2"
              >
                <option value="2">Vendedor</option>
                <option value="3">Encargado de Producción</option>
                <option value="1">Administrador</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCrear(false)}
                className="px-4 py-2 rounded border"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoUsuario}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                {guardandoUsuario ? 'Guardando...' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== Reportes ===== */}
      <h2 className="text-xl font-semibold mb-2">Generar Reporte</h2>
      <form onSubmit={handleGenerarReporte} className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg">
        <div>
          <label className="block font-medium mb-1">Tipo de Reporte:</label>
          <select
            value={tipoReporte}
            onChange={(e) => setTipoReporte(e.target.value as any)}
            className="w-full p-2 border rounded"
          >
            <option value="pedidos">Pedidos</option>
            <option value="produccion">Órdenes de Producción</option>
            <option value="kardex">Kardex de Inventario</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Formato:</label>
          <select
            value={formato}
            onChange={(e) => setFormato(e.target.value as any)}
            className="w-full p-2 border rounded"
          >
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Fecha Inicio:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Fecha Fin:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {tipoReporte === 'kardex' && (
          <>
            <div className="flex items-center gap-2">
              <input
                id="todos"
                type="checkbox"
                checked={kardexTodos}
                onChange={(e) => setKardexTodos(e.target.checked)}
              />
              <label htmlFor="todos">Todos los productos</label>
            </div>

            {!kardexTodos && (
              <div>
                <label className="block font-medium mb-1">Código de Producto:</label>
                <input
                  type="text"
                  value={kardexProductoId}
                  onChange={(e) => setKardexProductoId(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Ej: ADO-001"
                  required
                />
              </div>
            )}

            <div>
              <label className="block font-medium mb-1">Tipo de movimiento (opcional):</label>
              <select
                value={kardexTipoMov}
                onChange={(e) => setKardexTipoMov(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SALIDA">Salida</option>
              </select>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {cargando ? 'Generando...' : 'Generar y Descargar'}
        </button>
      </form>
    </div>
  );
};

export default AdministracionPage;

import { Link, useNavigate } from "react-router-dom";
import { getUsuario } from "../services/user";
import { removeToken } from "../services/auth";
import { tienePermiso } from "../services/permisos"; // Asegúrate que importa de donde tienes getUsuario

const Sidebar = () => {
  const usuario = getUsuario();
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/");
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-gray-700">
        🧱 Cerámica Roja Virgen de Copacabana
      </div>

      <div className="p-4 border-b border-gray-700">
        <p className="text-sm">Bienvenido,</p>
        <p className="font-semibold">{usuario?.nombre || "Usuario"}</p>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2 text-sm">
      <ul className="space-y-2">
        <li>
          <Link to="/home" className="text-gray-50 hover:text-red-600">Inicio</Link>
        </li>

        {/* Clientes */}
        {tienePermiso(["Administrador", "Vendedor"]) && (
          <li>
            <Link to="/clientes" className="text-gray-50 hover:text-red-600">Clientes</Link>
          </li>
        )}

        {/* Construcciones */}
        {tienePermiso(["Administrador", "Vendedor"]) && (
          <li>
            <Link to="/construcciones" className="text-gray-50 hover:text-red-600">Construcciones</Link>
          </li>
        )}

        {/* Pedidos */}
        {tienePermiso(["Administrador", "Vendedor"]) && (
          <li>
            <Link to="/pedidos" className="text-gray-50 hover:text-red-600">Pedidos</Link>
          </li>
        )}

        {/* Producción */}
        {tienePermiso(["Administrador", "Encargado de Producción"]) && (
          <li>
            <Link to="/produccion" className="text-gray-50 hover:text-red-600">Producción</Link>
          </li>
        )}

        {/* Productos */}
        {tienePermiso(["Administrador", "Encargado de Producción"]) && (
          <li>
            <Link to="/productos" className="text-gray-50 hover:text-red-600">Productos</Link>
          </li>
        )}

        {/* Métricas y Gráficos */}
        {tienePermiso(["Administrador"]) && (
          <li>
            <Link to="/dashboard/metricas" className="text-gray-50 hover:text-red-600">Métricas y Gráficos</Link>
          </li>
        )}

        {/* Administracion */}
        {tienePermiso(["Administrador"]) && (
          <li>
            <Link to="/administracion" className="text-gray-50 hover:text-red-600">Administracion</Link>
          </li>
        )}

          <li>
            <Link to="/perfil" className="block hover:bg-gray-700 p-2 rounded">🙋‍♀️ Mi perfil</Link>
          </li>
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded text-sm"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

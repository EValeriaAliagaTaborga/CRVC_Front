import { Link, useNavigate } from "react-router-dom";
import { getUsuario } from "../services/user";
import { removeToken } from "../services/auth";

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
        🧱 Cerámica Roja
      </div>

      <div className="p-4 border-b border-gray-700">
        <p className="text-sm">Bienvenido,</p>
        <p className="font-semibold">{usuario?.nombre || "Usuario"}</p>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2 text-sm">
        <Link to="/home" className="block hover:bg-gray-700 p-2 rounded">🏠 Página Principal</Link>
        <Link to="/clientes" className="block hover:bg-gray-700 p-2 rounded">👤 Clientes</Link>
        <Link to="/construcciones" className="block hover:bg-gray-700 p-2 rounded">🏗️ Construcciones</Link>
        <Link to="/pedidos" className="block hover:bg-gray-700 p-2 rounded">📦 Pedidos</Link>
        <Link to="/produccion" className="block hover:bg-gray-700 p-2 rounded">🔥 Producción</Link>
        <Link to="/productos" className="block hover:bg-gray-700 p-2 rounded">📦 Productos</Link>
        <Link to="/perfil" className="block hover:bg-gray-700 p-2 rounded">🙋‍♀️ Mi perfil</Link>
        <Link to="/admin" className="block hover:bg-gray-700 p-2 rounded">⚙️ Administración</Link>
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

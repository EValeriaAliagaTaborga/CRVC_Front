import { Link, useNavigate } from "react-router-dom";
import { getUsuario } from "../services/user";
import { removeToken } from "../services/auth";
import { tienePermiso } from "../services/permisos";
import clsx from "clsx";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Sidebar responsive:
 * - En `md`+ se muestra como panel fijo (w-64).
 * - En <md se muestra como drawer (fixed) que aparece cuando isOpen = true.
 * - onClose se llama al clicar fuera (overlay) o al pulsar un link.
 */
const Sidebar = ({ isOpen = false, onClose }: Props) => {
  const usuario = getUsuario();
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    onClose?.();
    navigate("/login");
  };

  // helper para links que cierran drawer en mobile
  const handleNavLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay - sólo en mobile cuando el drawer está abierto */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-200",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!isOpen}
        onClick={() => onClose?.()}
      />

      {/* Drawer / Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out",
          // mobile: translate based on isOpen; desktop: static visible
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static md:inset-auto md:flex md:flex-col"
        )}
        aria-hidden={false}
      >
        <div className="h-full flex flex-col bg-gray-800 text-white shadow-lg">
          {/* Header / Brand */}
          <div className="md:hidden p-4 md:p-6 flex items-center justify-between border-b border-gray-700">

            {/* Close button visible only on mobile */}
            <button
              onClick={() => onClose?.()}
              className="md:hidden inline-flex items-center justify-center p-1 rounded text-gray-200 hover:bg-gray-700"
              aria-label="Cerrar menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-700">
            <p className="text-sm text-gray-200">Bienvenido,</p>
            <p className="font-semibold">{usuario?.nombre || "Usuario"}</p>
            <p className="text-xs text-gray-400 mt-1">{usuario?.email ?? ""}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-3 overflow-y-auto text-sm">
            <ul className="space-y-1">
              <li>
                <Link to="/home" onClick={handleNavLinkClick} className="block px-3 py-2 rounded hover:bg-gray-700">
                  Inicio
                </Link>
              </li>

              {tienePermiso(["Administrador", "Vendedor"]) && (
                <li>
                  <Link to="/clientes" onClick={handleNavLinkClick} className="block px-3 py-2 rounded hover:bg-gray-700">
                    Clientes
                  </Link>
                </li>
              )}

              {tienePermiso(["Administrador", "Vendedor"]) && (
                <li>
                  <Link to="/construcciones" onClick={handleNavLinkClick} className="block px-3 py-2 rounded hover:bg-gray-700">
                    Construcciones
                  </Link>
                </li>
              )}

              {tienePermiso(["Administrador", "Vendedor"]) && (
                <li>
                  <Link to="/pedidos" onClick={handleNavLinkClick} className="block px-3 py-2 rounded hover:bg-gray-700">
                    Pedidos
                  </Link>
                </li>
              )}

              {tienePermiso(["Administrador", "Encargado de Producción"]) && (
                <li>
                  <Link to="/produccion" onClick={handleNavLinkClick} className="block px-3 py-2 rounded hover:bg-gray-700">
                    Producción de Horno
                  </Link>
                </li>
              )}

              {tienePermiso(["Administrador", "Vendedor", "Encargado de Producción"]) && (
                <li>
                  <Link to="/productos" onClick={handleNavLinkClick} className="block px-3 py-2 rounded hover:bg-gray-700">
                    Productos
                  </Link>
                </li>
              )}

              {tienePermiso(["Administrador"]) && (
                <li>
                  <Link to="/dashboard/metricas" onClick={handleNavLinkClick} className="block px-3 py-2 rounded hover:bg-gray-700">
                    Métricas y Gráficos
                  </Link>
                </li>
              )}

              {tienePermiso(["Administrador"]) && (
                <li>
                  <Link to="/administracion" onClick={handleNavLinkClick} className="block px-3 py-2 rounded hover:bg-gray-700">
                    Administración
                  </Link>
                </li>
              )}

              <li>
                <Link to="/perfil" onClick={handleNavLinkClick} className="block px-3 py-2 rounded hover:bg-gray-700">
                  🙋‍♀️ Mi perfil
                </Link>
              </li>
            </ul>
          </nav>

          {/* Footer / Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded text-sm flex items-center justify-center gap-2"
            >
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

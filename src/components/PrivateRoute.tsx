import { Navigate } from "react-router-dom";
import { getToken, isTokenExpired } from "../services/auth";
import { getUsuario } from "../services/user";

const rolesMap: { [key: string]: string } = {
  "1": "Administrador",
  "2": "Vendedor",
  "3": "Encargado de Producción"
};

interface PrivateRouteProps {
  children: React.ReactElement;
  rolesPermitidos?: string[];
}

const PrivateRoute = ({ children, rolesPermitidos }: PrivateRouteProps) => {
  const token = getToken();
  const usuario = getUsuario();

  if (!token || isTokenExpired() || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && rolesPermitidos.length > 0) {
    const rolNombre = rolesMap[usuario.rol];
    if (!rolesPermitidos.includes(rolNombre)) {
      return <Navigate to="/acceso-denegado" replace />;
    }
  }

  return children;
};

export default PrivateRoute;

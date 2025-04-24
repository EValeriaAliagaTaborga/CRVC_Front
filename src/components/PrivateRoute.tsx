import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/auth";

interface PrivateRouteProps {
children: React.ReactElement;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  return isAuthenticated() ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;

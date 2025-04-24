import { getToken } from "./auth";
import { jwtDecode } from "jwt-decode";

interface UsuarioPayload {
  id: number;
  rol: string;
  nombre: string;
  email: string;
  exp: number;
}

export const getUsuario = (): UsuarioPayload | null => {
  const token = getToken();
  if (!token || token.split(".").length !== 3) return null; // 👈 valida estructura

  try {
    return jwtDecode<UsuarioPayload>(token);
  } catch (error) {
    console.error("❌ Error al decodificar el token:", error);
    return null;
  }
};

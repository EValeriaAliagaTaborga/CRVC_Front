import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
  [key: string]: any;
}

export const getToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const setToken = (token: string) => {
  if (token.split(".").length === 3) {
    localStorage.setItem("accessToken", token);
  } else {
    console.log("Token inválido, no se guardó");
  }
};

export const removeToken = () => {
  localStorage.removeItem("accessToken");
};

export const isTokenExpired = (): boolean => {
  const token = getToken();
  if (!token) return true;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const now = Date.now() / 1000;
    return decoded.exp < now;
  } catch (error) {
    console.error("Error al decodificar el token", error);
    return true;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken() && !isTokenExpired();
};

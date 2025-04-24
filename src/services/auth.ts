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
  
  export const isAuthenticated = (): boolean => {
    return !!getToken(); // true si hay token
  };
  
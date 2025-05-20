import { getUsuario } from "./user"; // Asegúrate que importa de donde tienes getUsuario

const rolesMap: { [key: string]: string } = {
    "1": "Administrador",
    "2": "Vendedor",
    "3": "Encargado de Producción"
  };
  

export const tienePermiso = (rolesPermitidos: string[]): boolean => {
  const usuario = getUsuario();
  if (!usuario) return false;

  const rolNombre = rolesMap[usuario.rol];
  return rolesPermitidos.includes(rolNombre);
};

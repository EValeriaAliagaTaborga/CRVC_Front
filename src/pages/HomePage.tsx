import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { removeToken } from "../services/auth";
import { getUsuario } from "../services/user";

const HomePage = () => {
  const [usuario, setUsuario] = useState<{ nombre: string; rol: string } | null>(null);

  useEffect(() => {
    const user = getUsuario();
    setUsuario(user);
  }, []);

  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/");
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Bienvenido {usuario?.nombre || "Usuario"} ({usuario?.rol || "Rol"})</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default HomePage;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setToken } from "../services/auth";
import { isAuthenticated } from "../services/auth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        contrasena,
      });
      setToken(res.data.accessToken);
      navigate("/home");
    } catch (error) {
      alert("Error de autenticación");
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/home");
    }
  }, []);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-80"
      >
        <h2 className="text-xl font-bold mb-4">Iniciar Sesión</h2>
        <div className="pb-8">
          <label className="block text-sm">Correo electrónico</label>
          <input
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="block text-sm">Contraseña</label>
          <input
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 w-full rounded"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
};

export default LoginPage;

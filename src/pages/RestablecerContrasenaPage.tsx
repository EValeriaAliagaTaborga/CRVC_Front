import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const RestablecerContrasenaPage = () => {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const cambiar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (p1 !== p2) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (p1.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:3000/api/auth/password/restablecer", {
        token, nueva_contrasena: p1
      });
      alert("Contraseña actualizada. Ya puedes iniciar sesión.");
      navigate("/login");
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-6 rounded shadow w-full max-w-md">
          <p className="text-sm text-red-600">Token inválido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={cambiar} className="bg-white p-6 rounded shadow w-full max-w-md space-y-3">
        <h2 className="text-lg font-semibold">Restablecer contraseña</h2>
        <label className="block text-sm">Nueva contraseña</label>
        <input
          type="password"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
          minLength={6}
        />
        <label className="block text-sm">Repetir contraseña</label>
        <input
          type="password"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
          minLength={6}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
};

export default RestablecerContrasenaPage;

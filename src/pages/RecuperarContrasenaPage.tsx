import { useState } from "react";
import axios from "axios";

const RecuperarContrasenaPage = () => {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const solicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:3000/api/auth/password/solicitar", { email });
      setEnviado(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || "No se pudo enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-white p-6 rounded shadow w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">Revisa tu correo</h2>
          <p className="text-gray-700 text-sm">
            Si el correo existe en el sistema, te enviamos un enlace para restablecer la contraseña.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={solicitar} className="bg-white p-6 rounded shadow w-full max-w-md space-y-3">
        <h2 className="text-lg font-semibold">Recuperar contraseña</h2>
        <label className="block text-sm">Correo electrónico</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="tu@email.com"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Enviando..." : "Enviar enlace de restablecimiento"}
        </button>
      </form>
    </div>
  );
};

export default RecuperarContrasenaPage;

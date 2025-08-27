import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const MiPerfilPage = () => {
  const usuario = getUsuario(); // { id, nombre, email, id_rol? }
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    id_rol: 0,
  });

  const [loading, setLoading] = useState(true);

  // Estados para cambio de contraseña
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardandoPwd, setGuardandoPwd] = useState(false);

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!usuario?.id) return;
      try {
        const res = await axios.get(`http://localhost:3000/api/usuarios/${usuario.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setForm({
          nombre: res.data?.nombre || "",
          email: res.data?.email || "",
          id_rol: res.data?.id_rol || 0,
        });
      } catch (error) {
        alert("Error al cargar perfil");
      } finally {
        setLoading(false);
      }
    };
    fetchUsuario();
  }, []);

  const handleChangePerfil = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmitPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3000/api/usuarios/${usuario?.id}`,
        form,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success("Perfil actualizado correctamente ✅");
      navigate("/home");
    } catch {
      toast.error("Error al actualizar perfil ❌");
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actual || !nueva || !confirmar) {
      toast.warn("Completa todos los campos de contraseña");
      return;
    }
    if (nueva.length < 6) {
      toast.warn("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (nueva !== confirmar) {
      toast.warn("Las contraseñas no coinciden");
      return;
    }
    if (nueva === actual) {
      toast.warn("La nueva contraseña no puede ser igual a la actual");
      return;
    }

    setGuardandoPwd(true);
    try {
      await axios.put(
        `http://localhost:3000/api/usuarios/${usuario?.id}/password`,
        { actual, nueva },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success("Contraseña actualizada ✅");
      // Limpia los campos
      setActual("");
      setNueva("");
      setConfirmar("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "No se pudo actualizar la contraseña");
    } finally {
      setGuardandoPwd(false);
    }
  };

  if (loading) return <p>Cargando perfil...</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Mi Perfil</h2>

      {/* Form de datos de perfil */}
      <form onSubmit={handleSubmitPerfil} className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg">
        <h3 className="text-lg font-semibold">Datos personales</h3>

        <div>
          <label className="block font-medium mb-1">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChangePerfil}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Correo electrónico</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChangePerfil}
            className="w-full p-2 border rounded"
          />
        </div>

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Guardar cambios
        </button>
      </form>

      {/* Form de cambio de contraseña */}
      <form onSubmit={handleCambiarPassword} className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg">
        <h3 className="text-lg font-semibold">Cambiar contraseña</h3>

        <div>
          <label className="block font-medium mb-1">Contraseña actual</label>
          <input
            type="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className="w-full p-2 border rounded"
            autoComplete="current-password"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Nueva contraseña</label>
          <input
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            className="w-full p-2 border rounded"
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Confirmar nueva contraseña</label>
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            className="w-full p-2 border rounded"
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={guardandoPwd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {guardandoPwd ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
};

export default MiPerfilPage;

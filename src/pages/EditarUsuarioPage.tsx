import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { getToken } from "../services/auth";

interface Usuario {
  nombre: string;
  email: string;
  id_rol: string | number;
}

const rolesOptions = [
  { value: "1", label: "Administrador" },
  { value: "2", label: "Vendedor" },
  { value: "3", label: "Encargado de Producción" },
];

const EditarUsuarioPage = () => {
  const { id } = useParams<{ id: string }>();
  const [usuario, setUsuario] = useState<Usuario>({
    nombre: "",
    email: "",
    id_rol: "",
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Forzar cambio de contraseña (solo admin)
  const [nuevaPwd, setNuevaPwd] = useState("");
  const [confirmarPwd, setConfirmarPwd] = useState("");
  const [forzandoPwd, setForzandoPwd] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/usuarios/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setUsuario({
          nombre: response.data?.nombre || "",
          email: response.data?.email || "",
          id_rol: String(response.data?.id_rol ?? ""),
        });
      } catch (error) {
        alert("Error al obtener el usuario");
      } finally {
        setCargando(false);
      }
    };

    fetchUsuario();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUsuario({
      ...usuario,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await axios.put(`http://localhost:3000/api/usuarios/${id}`, {
        nombre: usuario.nombre,
        email: usuario.email,
        id_rol: Number(usuario.id_rol),
      }, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      alert("Usuario actualizado correctamente");
      navigate("/admin");
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      alert("Hubo un error al actualizar el usuario.");
    } finally {
      setGuardando(false);
    }
  };

  const forzarCambioPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaPwd || !confirmarPwd) {
      alert("Completa la nueva contraseña y su confirmación.");
      return;
    }
    if (nuevaPwd.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nuevaPwd !== confirmarPwd) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    setForzandoPwd(true);
    try {
      await axios.put(
        `http://localhost:3000/api/usuarios/${id}/password/forzar`,
        { nueva: nuevaPwd },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      alert("Contraseña actualizada (forzada) correctamente");
      setNuevaPwd("");
      setConfirmarPwd("");
    } catch (error: any) {
      console.error("Error al forzar contraseña:", error);
      alert(error?.response?.data?.message || "No se pudo forzar la contraseña.");
    } finally {
      setForzandoPwd(false);
    }
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Editar Usuario</h2>

      {/* Datos del usuario */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4 max-w-xl">
        <div>
          <label className="block mb-1 font-medium">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={usuario.nombre}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={usuario.email}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Rol</label>
          <select
            name="id_rol"
            value={usuario.id_rol}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Seleccione un rol…</option>
            {rolesOptions.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {guardando ? "Guardando..." : "Guardar Cambios"}
        </button>
      </form>

      {/* Forzar cambio de contraseña (solo Admin) */}
      <form onSubmit={forzarCambioPassword} className="bg-white p-6 rounded shadow space-y-4 max-w-xl">
        <h3 className="text-lg font-semibold">Forzar cambio de contraseña</h3>
        <p className="text-sm text-gray-600">
          Esta acción <b>no requiere</b> la contraseña actual del usuario. Solo para Administradores.
        </p>

        <div>
          <label className="block mb-1 font-medium">Nueva contraseña</label>
          <input
            type="password"
            value={nuevaPwd}
            onChange={(e) => setNuevaPwd(e.target.value)}
            className="w-full border p-2 rounded"
            minLength={6}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Confirmar nueva contraseña</label>
          <input
            type="password"
            value={confirmarPwd}
            onChange={(e) => setConfirmarPwd(e.target.value)}
            className="w-full border p-2 rounded"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={forzandoPwd}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          {forzandoPwd ? "Actualizando..." : "Forzar cambio"}
        </button>
      </form>
    </div>
  );
};

export default EditarUsuarioPage;

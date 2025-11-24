// src/pages/MiPerfilPage.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

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

  // Modals
  const [modalError, setModalError] = useState<null | { title: string; message: string }>(null);
  const [successModal, setSuccessModal] = useState<null | { title: string; message?: string }>(null);

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
      } catch (error: any) {
        setModalError({
          title: "Error al cargar perfil",
          message: error?.response?.data?.message || "No se pudo cargar la información del perfil.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setSuccessModal({ title: "Perfil actualizado", message: "Tu perfil se actualizó correctamente." });
    } catch (err: any) {
      setModalError({
        title: "Error al actualizar perfil",
        message: err?.response?.data?.message || "No se pudo actualizar el perfil.",
      });
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actual || !nueva || !confirmar) {
      setModalError({ title: "Campos incompletos", message: "Completa todos los campos de contraseña." });
      return;
    }
    if (nueva.length < 6) {
      setModalError({ title: "Contraseña inválida", message: "La nueva contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (nueva !== confirmar) {
      setModalError({ title: "Contraseñas distintas", message: "Las contraseñas no coinciden." });
      return;
    }
    if (nueva === actual) {
      setModalError({ title: "Contraseña inválida", message: "La nueva contraseña no puede ser igual a la actual." });
      return;
    }

    setGuardandoPwd(true);
    try {
      await axios.put(
        `http://localhost:3000/api/usuarios/${usuario?.id}/password`,
        { actual, nueva },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setSuccessModal({ title: "Contraseña actualizada", message: "La contraseña fue actualizada correctamente." });
      // Limpia los campos
      setActual("");
      setNueva("");
      setConfirmar("");
    } catch (err: any) {
      setModalError({
        title: "Error al cambiar contraseña",
        message: err?.response?.data?.message || "No se pudo actualizar la contraseña.",
      });
    } finally {
      setGuardandoPwd(false);
    }
  };

  if (loading) return <p className="p-4">Cargando perfil...</p>;

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mi Perfil</h2>
          <p className="text-sm text-gray-600 mt-1">Edita tus datos y cambia tu contraseña de forma segura.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/home")}
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* Grid responsive: stacked on mobile, two columns on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form de datos de perfil */}
        <form onSubmit={handleSubmitPerfil} className="bg-white p-6 rounded shadow-md space-y-4">
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

          <div className="flex justify-end">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Guardar cambios
            </button>
          </div>
        </form>

        {/* Form de cambio de contraseña */}
        <form onSubmit={handleCambiarPassword} className="bg-white p-6 rounded shadow-md space-y-4">
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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={guardandoPwd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {guardandoPwd ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      </div>

      {/* Error modal */}
      <Modal
        open={!!modalError}
        title={modalError?.title}
        onClose={() => setModalError(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setModalError(null)}
      >
        <p className="text-sm text-gray-700">{modalError?.message}</p>
      </Modal>

      {/* Success modal */}
      <Modal
        open={!!successModal}
        title={successModal?.title}
        onClose={() => setSuccessModal(null)}
        primaryLabel="Cerrar"
        onPrimary={() => {
          // si el success fue por actualización de perfil, llevamos al home al cerrar
          setSuccessModal(null);
          // decide si quieres navegar al home siempre; aquí solo navegamos cuando el mensaje es perfil actualizado
          if (successModal?.title === "Perfil actualizado") navigate("/home");
        }}
      >
        <p className="text-sm text-gray-700">{successModal?.message}</p>
      </Modal>
    </div>
  );
};

export default MiPerfilPage;

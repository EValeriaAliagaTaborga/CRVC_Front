import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../services/auth";
import { getUsuario } from "../services/user";
import { useNavigate } from "react-router-dom";

const MiPerfilPage = () => {
  const usuario = getUsuario(); // { id, nombre, email }
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    id_rol: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!usuario?.id) return;

      try {
        const res = await axios.get(`http://localhost:3000/api/usuarios/${usuario?.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        console.log("🎯 Datos recibidos:", res.data); // <-- revisa aquí
        setForm({
          nombre: res.data.nombre,
          email: res.data.email,
          id_rol: res.data.id_rol
        });
      } catch (error) {
        alert("Error al cargar perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3000/api/usuarios/${usuario?.id}`,
        form,
        {
          headers: { Authorization: `Bearer ${getToken()}` }
        }
      );
      alert("Perfil actualizado correctamente");
      navigate("/home");
    } catch (error) {
      alert("Error al actualizar perfil");
    }
  };

  if (loading) return <p>Cargando perfil...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Mi Perfil</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4 max-w-lg">
        <div>
          <label className="block font-medium mb-1">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Correo electrónico</label>
          <input
            type="email"
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default MiPerfilPage;

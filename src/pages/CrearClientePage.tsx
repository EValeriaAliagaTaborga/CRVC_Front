import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getToken } from "../services/auth";

const CrearClientePage = () => {
  const [form, setForm] = useState({
    nombre_empresa: "",
    nombre_contacto: "",
    telefono_fijo: "",
    celular: "",
    email: "",
  });

  const [errors, setErrors] = useState({
    nombre_empresa: "",
    nombre_contacto: "",
    telefono_fijo: "",
    celular: "",
    email: "",
  });

  const validarFormulario = (): boolean => {
    const nuevosErrores: any = {};

    if (!(form.nombre_empresa || "").trim()) {
      nuevosErrores.nombre_empresa = "Este campo es obligatorio";
    }

    if (!(form.nombre_contacto || "").trim()) {
      nuevosErrores.nombre_contacto = "Este campo es obligatorio";
    }

    if (!(form.celular || "").trim()) {
      nuevosErrores.celular = "Este campo es obligatorio";
    }

    if (form.email !== "") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        nuevosErrores.email = "Correo electrónico no válido";
      }
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    try {
      await axios.post("http://localhost:3000/api/clientes", form, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      navigate("/clientes");
    } catch (error) {
      alert("Error al registrar cliente");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Registrar nuevo cliente</h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow-md rounded space-y-4 max-w-lg"
      >
        <label className="block mb-1 font-medium">Nombre de la empresa:</label>
        <input
          type="text"
          name="nombre_empresa"
          value={form.nombre_empresa || ""}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.nombre_empresa && (
          <p className="text-red-600 text-sm mt-1">{errors.nombre_empresa}</p>
        )}

        <label className="block mb-1 font-medium">Nombre de contacto:</label>
        <input
          type="text"
          name="nombre_contacto"
          value={form.nombre_contacto || ""}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.nombre_contacto && (
          <p className="text-red-600 text-sm mt-1">{errors.nombre_contacto}</p>
        )}

        <label className="block mb-1 font-medium">Teléfono fijo:</label>
        <input
          type="text"
          name="telefono_fijo"
          value={form.telefono_fijo || ""}
          onChange={handleChange}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.telefono_fijo && (
          <p className="text-red-600 text-sm mt-1">{errors.telefono_fijo}</p>
        )}

        <label className="block mb-1 font-medium">Celular:</label>
        <input
          type="text"
          name="celular"
          value={form.celular || ""}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.celular && (
          <p className="text-red-600 text-sm mt-1">{errors.celular}</p>
        )}

        <label className="block mb-1 font-medium">Email:</label>
        <input
          type="text"
          name="email"
          value={form.email || ""}
          onChange={handleChange}
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$" // Basic email validation
          title="Formato de correo electrónico no válido"
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email}</p>
        )}
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Guardar
        </button>
      </form>
    </div>
  );
};

export default CrearClientePage;

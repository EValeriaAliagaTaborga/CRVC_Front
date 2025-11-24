// src/pages/CrearClientePage.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getToken } from "../services/auth";
import Modal from "../components/Modal";

const CrearClientePage: React.FC = () => {
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

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<null | { title?: string; message?: string }>(null);
  const [successModal, setSuccessModal] = useState<null | { title: string; message?: string }>(null);

  const navigate = useNavigate();

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

    setErrors({
      nombre_empresa: nuevosErrores.nombre_empresa || "",
      nombre_contacto: nuevosErrores.nombre_contacto || "",
      telefono_fijo: nuevosErrores.telefono_fijo || "",
      celular: nuevosErrores.celular || "",
      email: nuevosErrores.email || "",
    });

    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // clear field error as user types
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setSubmitting(true);
    try {
      await axios.post("http://localhost:3000/api/clientes", form, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      setSuccessModal({
        title: "Cliente registrado",
        message: "El cliente se registró correctamente.",
      });
    } catch (err: any) {
      setModalError({
        title: "Error al registrar cliente",
        message: err?.response?.data?.message || "Ocurrió un problema registrando el cliente. Intenta nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Registrar nuevo cliente</h2>
          <p className="text-sm text-gray-600 mt-1">Rellena los datos del cliente.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/clientes")}
            className="px-3 py-2 rounded border hover:bg-gray-50 text-sm"
          >
            ← Volver a clientes
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 sm:p-6 shadow-md rounded space-y-4 max-w-lg mx-auto w-full"
      >
        <div>
          <label className="block mb-1 font-medium">Nombre de la empresa</label>
          <input
            type="text"
            name="nombre_empresa"
            value={form.nombre_empresa || ""}
            onChange={handleChange}
            required
            className={`w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombre_empresa ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.nombre_empresa && (
            <p className="text-red-600 text-sm mt-1">{errors.nombre_empresa}</p>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Nombre de contacto</label>
          <input
            type="text"
            name="nombre_contacto"
            value={form.nombre_contacto || ""}
            onChange={handleChange}
            required
            className={`w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombre_contacto ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.nombre_contacto && (
            <p className="text-red-600 text-sm mt-1">{errors.nombre_contacto}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Teléfono fijo</label>
            <input
              type="text"
              name="telefono_fijo"
              value={form.telefono_fijo || ""}
              onChange={handleChange}
              className={`w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.telefono_fijo ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.telefono_fijo && (
              <p className="text-red-600 text-sm mt-1">{errors.telefono_fijo}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Celular</label>
            <input
              type="text"
              name="celular"
              value={form.celular || ""}
              onChange={handleChange}
              required
              className={`w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.celular ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.celular && (
              <p className="text-red-600 text-sm mt-1">{errors.celular}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email || ""}
            onChange={handleChange}
            className={`w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"}`}
            placeholder="ejemplo@empresa.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/clientes")}
            className="px-4 py-2 rounded border hover:bg-gray-50"
            disabled={submitting}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className={`px-4 py-2 rounded text-white ${submitting ? "bg-green-400" : "bg-green-600 hover:bg-green-700"}`}
            disabled={submitting}
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>

      {/* Modal: éxito */}
      <Modal
        open={!!successModal}
        title={successModal?.title}
        onClose={() => setSuccessModal(null)}
        secondaryLabel="Seguir editando"
        onSecondary={() => setSuccessModal(null)}
        primaryLabel="Volver a clientes"
        onPrimary={() => {
          setSuccessModal(null);
          navigate("/clientes");
        }}
      >
        <p className="text-sm text-gray-700">{successModal?.message}</p>
      </Modal>

      {/* Modal: error genérico */}
      <Modal
        open={!!modalError}
        title={modalError?.title || "Error"}
        onClose={() => setModalError(null)}
        primaryLabel="Cerrar"
        onPrimary={() => setModalError(null)}
      >
        <p className="text-sm text-gray-700">{modalError?.message}</p>
      </Modal>
    </div>
  );
};

export default CrearClientePage;
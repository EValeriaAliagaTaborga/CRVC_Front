import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

const EditarConstruccionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id_cliente: "",
    direccion: "",
    estado_obra: "",
    nombre_contacto_obra: "",
    celular_contacto_obra: "",
  });

  const [errors, setErrors] = useState({
    id_cliente: "",
    direccion: "",
    estado_obra: "",
    nombre_contacto_obra: "",
    celular_contacto_obra: "",
  });

  const [clientes, setClientes] = useState<
    { id_cliente: number; nombre_empresa: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resConstruccion, resClientes] = await Promise.all([
          axios.get(`http://localhost:3000/api/construcciones/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          axios.get("http://localhost:3000/api/clientes", {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ]);

        const construccion = resConstruccion.data;

        setForm({
          id_cliente: construccion.id_cliente.toString(),
          direccion: construccion.direccion || "",
          estado_obra: construccion.estado_obra || "",
          nombre_contacto_obra: construccion.nombre_contacto_obra || "",
          celular_contacto_obra: construccion.celular_contacto_obra || "",
        });

        setClientes(resClientes.data);
      } catch (error) {
        alert("Error al cargar la información");
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: any = {};

    if (!form.direccion.trim())
      nuevosErrores.direccion = "La dirección es obligatoria";
    if (!form.estado_obra.trim())
      nuevosErrores.estado_obra = "El estado de la obra es obligatorio";
    if (!form.nombre_contacto_obra.trim())
      nuevosErrores.nombre_contacto_obra =
        "El nombre del contacto es obligatorio";
    if (!form.celular_contacto_obra.trim())
      nuevosErrores.celular_contacto_obra =
        "El celular del contacto es obligatorio";

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      await axios.put(
        `http://localhost:3000/api/construcciones/${id}`,
        {
          ...form,
          id_cliente: parseInt(form.id_cliente),
        },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      navigate("/construcciones");
    } catch (error) {
      alert("Error al actualizar construcción");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Editar construcción</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow-md rounded space-y-4 max-w-lg"
      >
        <div>
          <label className="block font-medium">Cliente</label>
          <select
            name="id_cliente"
            value={form.id_cliente}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre_empresa}
              </option>
            ))}
          </select>
          {errors.id_cliente && (
            <p className="text-red-600 text-sm">{errors.id_cliente}</p>
          )}
        </div>

        <div>
          <label className="block font-medium">Dirección</label>
          <input
            type="text"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.direccion && (
            <p className="text-red-600 text-sm">{errors.direccion}</p>
          )}
        </div>

        <div>
          <label className="block font-medium">Estado de la obra</label>
          <input
            type="text"
            name="estado_obra"
            value={form.estado_obra}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.estado_obra && (
            <p className="text-red-600 text-sm">{errors.estado_obra}</p>
          )}
        </div>

        <div>
          <label className="block font-medium">Nombre contacto de obra</label>
          <input
            type="text"
            name="nombre_contacto_obra"
            value={form.nombre_contacto_obra}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nombre_contacto_obra && (
            <p className="text-red-600 text-sm">
              {errors.nombre_contacto_obra}
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium">Celular contacto de obra</label>
          <input
            type="text"
            name="celular_contacto_obra"
            value={form.celular_contacto_obra}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.celular_contacto_obra && (
            <p className="text-red-600 text-sm">
              {errors.celular_contacto_obra}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default EditarConstruccionPage;

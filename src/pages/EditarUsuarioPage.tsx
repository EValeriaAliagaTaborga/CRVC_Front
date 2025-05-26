import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

interface Usuario {
  nombre: string;
  email: string;
  rol: string;
}

const EditarUsuarioPage = () => {
  const { id } = useParams<{ id: string }>();
  const [usuario, setUsuario] = useState<Usuario>({
    nombre: '',
    email: '',
    rol: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/usuarios/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setUsuario(response.data);
      } catch (error) {
        console.error('Error al obtener el usuario:', error);
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
    try {
      await axios.put(`http://localhost:3000/api/usuarios/${id}`, usuario, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      alert('Usuario actualizado correctamente');
      navigate('/admin');
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      alert('Hubo un error al actualizar el usuario.');
    }
  };

  return (
    <div>
      <h2>Editar Usuario</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={usuario.nombre}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Correo Electrónico:</label>
          <input
            type="email"
            name="email"
            value={usuario.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Rol:</label>
          <select name="rol" value={usuario.rol} onChange={handleChange} required>
            <option value="">Seleccione un rol</option>
            <option value="Administrador">Administrador</option>
            <option value="Empleado">Empleado</option>
          </select>
        </div>
        <button type="submit">Guardar Cambios</button>
      </form>
    </div>
  );
};

export default EditarUsuarioPage;

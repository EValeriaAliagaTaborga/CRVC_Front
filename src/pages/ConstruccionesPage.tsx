import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getToken } from "../services/auth";

interface Construccion {
    id_construccion: number;
    direccion: string;
    estado_obra: string;
    nombre_contacto_obra: string;
    celular_contacto_obra: string;
    nombre_empresa: string;
}

const ConstruccionesPage = () => {
    const [construcciones, setConstrucciones] = useState<Construccion[]>([]);
    const navigate = useNavigate();
    const [filtroDireccion, setFiltroDireccion] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroContacto, setFiltroContacto] = useState("");

    useEffect(() => {
        const fetchConstrucciones = async () => {
            try {
                const res = await axios.get("http://localhost:3000/api/construcciones", {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                setConstrucciones(res.data);
            } catch (error) {
                console.error("Error al obtener construcciones", error);
            }
        };

        fetchConstrucciones();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("¿Deseas eliminar esta construcción?")) return;
        try {
            await axios.delete(`http://localhost:3000/api/construcciones/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setConstrucciones(construcciones.filter(c => c.id_construccion !== id));
        } catch (error) {
            alert("Error al eliminar construcción");
        }
    };

    const construccionesFiltradas = construcciones.filter((c) =>
        c.direccion.toLowerCase().includes(filtroDireccion.toLowerCase()) &&
        c.estado_obra.toLowerCase().includes(filtroEstado.toLowerCase()) &&
        c.nombre_contacto_obra.toLowerCase().includes(filtroContacto.toLowerCase())
    );


    return (
        <div>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                    type="text"
                    placeholder="Filtrar por dirección"
                    value={filtroDireccion}
                    onChange={(e) => setFiltroDireccion(e.target.value)}
                    className="p-2 border rounded w-full"
                />
                <input
                    type="text"
                    placeholder="Filtrar por estado de obra"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="p-2 border rounded w-full"
                />
                <input
                    type="text"
                    placeholder="Filtrar por contacto"
                    value={filtroContacto}
                    onChange={(e) => setFiltroContacto(e.target.value)}
                    className="p-2 border rounded w-full"
                />
            </div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Construcciones registradas</h2>
                <Link to="/construcciones/crear" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    + Registrar construcción
                </Link>
            </div>

            <div className="bg-white shadow-md rounded">
                <table className="min-w-full text-sm table-auto">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-4 py-2">Cliente</th>
                            <th className="px-4 py-2">Dirección</th>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Contacto obra</th>
                            <th className="px-4 py-2">Celular</th>
                            <th className="px-4 py-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {construccionesFiltradas.map((c) => (
                            <tr key={c.id_construccion} className="border-t">
                                <td className="px-4 py-2">{c.nombre_empresa}</td>
                                <td className="px-4 py-2">{c.direccion}</td>
                                <td className="px-4 py-2">{c.estado_obra}</td>
                                <td className="px-4 py-2">{c.nombre_contacto_obra}</td>
                                <td className="px-4 py-2">{c.celular_contacto_obra}</td>
                                <td className="px-4 py-2 space-x-2">
                                    <button onClick={() => navigate(`/construcciones/editar/${c.id_construccion}`)} className="text-blue-600 hover:underline">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(c.id_construccion)} className="text-red-600 hover:underline">
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConstruccionesPage;

import { useState, useEffect } from "react";
import ClientService from "../services/client.service";
import { useNavigate, useParams } from "react-router-dom";

function EditClient() {
  const { id } = useParams(); // Obtener ID de la URL
  const navigate = useNavigate();
  const [client, setClient] = useState({
    name: "",
    rut: "", // Mostrar RUT pero no permitir editarlo
    phone: "",
    email: ""
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Cargar datos del cliente al inicio
  useEffect(() => {
    ClientService.get(id)
      .then(response => {
        setClient(response.data); // Carga todos los datos, incluyendo RUT
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching client:", error);
        setMessage("Error al cargar los datos del cliente.");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    // No permitir cambiar el RUT
    if (e.target.name !== "rut") {
        setClient({ ...client, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("Actualizando cliente...");

    // Enviar solo los campos editables
    const updateData = {
        name: client.name,
        phone: client.phone,
        email: client.email
    };

    ClientService.update(id, updateData)
      .then(() => {
        navigate("/clients"); // Volver a la lista
      })
      .catch((error) => {
        console.error("Error updating client:", error);
        setMessage(`Error al actualizar cliente: ${error.response?.data?.message || error.response?.data || error.message}`);
      });
  };

  if (loading) {
    return <p style={{ padding: 16 }}>Cargando...</p>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Editar Cliente (ID: {id})</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre: </label>
          <input
            type="text"
            name="name"
            value={client.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>RUT: </label>
          <input
            type="text"
            name="rut"
            value={client.rut}
            onChange={handleChange}
            required
            readOnly // Hacer el campo de solo lectura
            style={{ backgroundColor: '#eee' }} // Estilo visual para indicar no editable
          />
        </div>
        <div>
          <label>Teléfono: </label>
          <input
            type="text"
            name="phone"
            value={client.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Email: </label>
          <input
            type="email"
            name="email"
            value={client.email}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" style={{ marginTop: '15px' }}>Guardar Cambios</button>
      </form>
      {message && <p style={{ color: message.startsWith("Error") ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}

export default EditClient;
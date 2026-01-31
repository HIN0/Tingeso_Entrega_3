import { useState } from "react";
import ClientService from "../services/client.service";
import { useNavigate } from "react-router-dom";

function AddClient() {
  const [client, setClient] = useState({
    name: "",
    rut: "",
    phone: "",
    email: ""
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setClient({ ...client, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("Guardando cliente...");

    ClientService.create(client)
      .then(() => {
        navigate("/clients");
      })
      .catch((error) => {
        console.error("Error creating client:", error);
        setMessage(`Error al crear cliente: ${error.response?.data || error.message}`);
      });
  };

  return (
    <div style={{padding: 16}}>
      <h2>Registrar Nuevo Cliente (ADMIN)</h2>
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
        <button type="submit" style={{marginTop: '15px'}}>Guardar Cliente</button>
      </form>
      {message && <p style={{ color: message.startsWith("Error") ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}

export default AddClient;
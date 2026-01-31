import { useState, useEffect } from "react";
import ToolService from "../services/tool.service";
import { useNavigate, useParams } from "react-router-dom";

function EditTool() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState({
    name: "",
    category: "",
    replacementValue: 0,
    // Stock y Status no se editan aquí directamente
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cargar datos de la herramienta al montar el componente
  useEffect(() => {
    ToolService.get(id)
      .then(response => {
        const { name, category, replacementValue } = response.data;
        setTool({ name, category, replacementValue });
        setLoading(false);
      })
      .catch(e => {
        console.error("Error fetching tool:", e);
        setError("Failed to load tool data.");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
     const value = (e.target.name === 'replacementValue')
                  ? parseInt(e.target.value) || 0
                  : e.target.value;
    setTool({ ...tool, [e.target.name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (tool.replacementValue < 0) {
        setError("Replacement Value cannot be negative.");
        return;
    }

    ToolService.update(id, tool) // Llama al método update del servicio
      .then(() => {
        navigate("/tools"); // Volver a la lista después de guardar
      })
      .catch((err) => {
        console.error("Error updating tool:", err);
        const errorMsg = err.response?.data?.message || err.response?.data || "Failed to update tool.";
        setError(errorMsg);
      });
  };

  if (loading) {
    return <p>Loading tool data...</p>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Edit Tool (ID: {id})</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name: </label>
          <input
            type="text"
            name="name"
            value={tool.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Category: </label>
          <input
            type="text"
            name="category"
            value={tool.category}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Replacement Value: </label>
          <input
            type="number"
            name="replacementValue"
            value={tool.replacementValue}
            onChange={handleChange}
            required
            min="0"
          />
        </div>

        <button type="submit" style={{ marginTop: '15px' }}>Save Changes</button>
      </form>
    </div>
  );
}

export default EditTool;
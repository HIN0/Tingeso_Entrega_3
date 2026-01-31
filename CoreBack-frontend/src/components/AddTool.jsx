import { useState } from "react";
import ToolService from "../services/tool.service";
import { useNavigate } from "react-router-dom";

// --- FUNCIÓN AUXILIAR PARA DAR FORMATO A LOS ERRORES DE VALIDACIÓN ---
const formatValidationErrors = (errors) => {
    if (!errors || typeof errors !== 'object') {
        return "Validation failed with an unknown error.";
    }
    let errorString = "Validation Errors:\n";
    for (const field in errors) {
        // Formatea el nombre del campo para que sea más legible (ej: "replacementValue" -> "Replacement Value")
        const formattedField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        errorString += `• ${formattedField}: ${errors[field]}\n`;
    }
    return errorString.trim();
};
// ----------------------------------------------------------------------


function AddTool() {
  const [tool, setTool] = useState({
    name: "",
    category: "",
    replacementValue: 0,
    stock: 0,
    inRepair: 0 // <--- 1. Inicializar el nuevo campo a 0
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    // 2. Asegurarse que los campos numéricos (incluyendo inRepair si lo añades como input) se parseen
    const value = (e.target.name === 'stock' || e.target.name === 'replacementValue' || e.target.name === 'inRepair')
                  ? parseInt(e.target.value) || 0
                  : e.target.value;
    setTool({ ...tool, [e.target.name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Puedes añadir validaciones si es necesario para inRepair aquí
    if (tool.stock < 0 || tool.replacementValue < 0 || tool.inRepair < 0) {
        setError("Stock, Replacement Value (and In Repair) cannot be negative.");
        return;
    }
     if (tool.replacementValue < 1000) { // Validacion Min(1000) del backend
        setError("Replacement Value must be at least 1000.");
        return;
    }


    // 3. El objeto 'tool' ya incluye 'inRepair' por el estado inicializado
    ToolService.create(tool)
      .then(() => {
        navigate("/tools");
      })
      .catch((err) => {
        console.error("Error creating tool:", err);
        
        const backendErrors = err.response?.data?.fieldErrors;
        let errorMsg;
        
        if (backendErrors) {
            // --- LÓGICA CORREGIDA: Usar la función para formatear errores ---
            errorMsg = formatValidationErrors(backendErrors);
        } else {
            // Lógica para otros tipos de errores (Bad Request, Internal Server, etc.)
            errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       err.response?.data || 
                       "Failed to create tool. Please check the data.";
        }
        
        setError(errorMsg);
      });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Add Tool</h2>
      {/* Renderizado mejorado para mostrar los errores con saltos de línea */}
      {error && (
        <div style={{ color: 'red', whiteSpace: 'pre-wrap', border: '1px solid red', padding: '10px', marginBottom: '15px' }}>
          <strong>Error:</strong><br/>{error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* ... Inputs para name, category ... */}
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
          <label>Initial Stock: </label>
          <input
            type="number"
            name="stock"
            value={tool.stock}
            onChange={handleChange}
            required
            min="0" // Permitir 0 pero validar >= 0 en handleSubmit o backend
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
            min="1000" // Mantener la validación del backend
          />
        </div>

        {/* 4. PUEDE SER QUIZA: Añadir un input para 'inRepair' si el usuario debe definirlo.
           Si siempre es 0 al crear, no necesitas un input, solo inicializarlo en el estado. */}
        {/*
        <div>
          <label>Initial In Repair: </label>
          <input
            type="number"
            name="inRepair"
            value={tool.inRepair}
            onChange={handleChange}
            required
            min="0"
          />
        </div>
        */}

        <button type="submit" style={{ marginTop: '15px' }}>Save</button>
      </form>
    </div>
  );
}

export default AddTool;
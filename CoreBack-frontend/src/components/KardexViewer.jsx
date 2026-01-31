import React, { useState } from "react";
import KardexService from "../services/kardex.service";

function KardexViewer() {
  const [queryType, setQueryType] = useState("tool"); // 'tool' o 'date'
  const [toolId, setToolId] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [kardexData, setKardexData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFetchKardex = () => {
    setMessage("");
    setKardexData([]); 
    setLoading(true);

    let promise;
    if (queryType === "tool") {
      promise = KardexService.getByToolId(toolId);
    } else { 
      promise = KardexService.getByDateRange(dateRange.start, dateRange.end);
    }

    promise
      .then(response => {
        setKardexData(response.data);
        if (response.data.length === 0) {
          setMessage("No movements found for the specified criteria.");
        }
      })
      .catch(error => {
        console.error("Error fetching kardex:", error);
        setMessage(`Error: ${error.message || "Could not fetch kardex data."}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Formatear fecha/hora para mostrarla
  const formatDateTime = (dateTimeString) => {
      if (!dateTimeString) return '-';
      try {
          const date = new Date(dateTimeString);
          return date.toLocaleString(); // Formato local (ej. 21/10/2025, 10:30:00)
      } catch (e) {
          return dateTimeString; // Devolver original si hay error
      }
  };


  return (
    <div style={{ padding: 16 }}>
      <h2>Kardex Viewer</h2>
      {/* Selector de tipo de consulta */}
      <div>
        <label>
          <input
            type="radio"
            name="queryType"
            value="tool"
            checked={queryType === "tool"}
            onChange={() => setQueryType("tool")}
          />
          Query by Tool ID
        </label>
        <label style={{ marginLeft: '15px' }}>
          <input
            type="radio"
            name="queryType"
            value="date"
            checked={queryType === "date"}
            onChange={() => setQueryType("date")}
          />
          Query by Date Range
        </label>
      </div>

      {/* Inputs condicionales */}
      <div style={{ margin: '15px 0' }}>
        {queryType === "tool" && (
          <div>
            <label>Tool ID: </label>
            <input
              type="number"
              value={toolId}
              onChange={(e) => setToolId(e.target.value)}
              placeholder="Enter Tool ID"
            />
          </div>
        )}
        {queryType === "date" && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Botón de búsqueda */}
      <button onClick={handleFetchKardex} disabled={loading}>
        {loading ? "Loading..." : "Fetch Kardex Movements"}
      </button>

      {/* Mensajes y Tabla de Resultados */}
      {message && <p style={{ color: message.startsWith("Error") ? 'red' : 'green', marginTop: '15px' }}>{message}</p>}

      {kardexData.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Kardex Movements</h3>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date/Time</th>
                <th>Tool ID</th>
                <th>Tool Name</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {kardexData.map(movement => (
                <tr key={movement.id}>
                  <td>{movement.id}</td>
                  <td>{formatDateTime(movement.movementDate)}</td>
                  <td>{movement.tool?.id}</td>
                  <td>{movement.tool?.name}</td>
                  <td>{movement.type}</td>
                  <td>{movement.quantity}</td>
                  <td>{movement.user?.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default KardexViewer;
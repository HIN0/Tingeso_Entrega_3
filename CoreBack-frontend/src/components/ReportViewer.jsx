import React, { useEffect, useState } from "react";
import ReportService from "../services/report.service";
import { useKeycloak } from "@react-keycloak/web";

function ReportViewer() {
  const [reportType, setReportType] = useState("LATE_CLIENTS"); // Tipo de reporte activo
  const [reportData, setReportData] = useState([]); // Datos del reporte
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); 

  // Estado unificado para el rango de fechas
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  // Estado para controlar si el filtro de fecha está activo
  const [useDateFilter, setUseDateFilter] = useState(false);

  const { keycloak } = useKeycloak();
  const isAdminOrUser = keycloak?.authenticated && (keycloak.hasRealmRole("ADMIN") || keycloak.hasRealmRole("USER"));

  // Función para cargar reportes, ahora usa las fechas si están activas
  const loadReport = (type, filterDates) => {
    if (!isAdminOrUser) return;
    setLoading(true);
    setReportData([]);
    setMessage(""); // Limpiar mensajes

    // Determinar qué fechas pasar al servicio
    const fromDate = filterDates && dateRange.from ? dateRange.from : null;
    const toDate = filterDates && dateRange.to ? dateRange.to : null;

    // Validar que si se usan fechas, estén ambas presentes (excepto para Top Tools donde es obligatorio)
    if (filterDates && type !== "TOP_TOOLS" && (!fromDate || !toDate)) {
        setMessage("Error: Both start and end dates are required when date filter is active.");
        setLoading(false);
        return;
    }
    if (type === "TOP_TOOLS" && (!fromDate || !toDate)) {
        // Ya validado en el servicio, pero podemos añadir mensaje aquí
        setMessage("Error: Date range is mandatory for Top Tools report.");
        setLoading(false);
        return;
    }


    let promise;
    switch (type) {
      case "ACTIVE_LOANS":
      case "LATE_LOANS":
        // Llamar al servicio con las fechas (pueden ser null)
        promise = ReportService.getLoansByStatus(type.replace('_LOANS', ''), fromDate, toDate);
        break;
      case "LATE_CLIENTS":
         // Llamar al servicio con las fechas (pueden ser null)
        promise = ReportService.getClientsWithLateLoans(fromDate, toDate);
        break;
      case "TOP_TOOLS":
         // Las fechas son obligatorias aquí y ya se validaron
        promise = ReportService.getTopTools(fromDate, toDate);
        break;
      default:
        setMessage("Error: Invalid report type selected.");
        setLoading(false);
        return; // Salir si el tipo no es válido
    }

    // Procesar la promesa
    promise
      .then(response => {
        setReportData(response.data);
        if (response.data.length === 0) {
          setMessage("No results found for the selected criteria.");
        }
      })
      .catch(e => {
          console.error("Error loading report:", e);
          setMessage(`Error loading report: ${e.response?.data?.message || e.message || 'Unknown error'}`);
      })
      .finally(() => setLoading(false));
  };

  // Cargar reporte inicial (sin filtro de fecha)
  useEffect(() => {
    loadReport(reportType, false); // Carga inicial sin filtro
  }, [isAdminOrUser]); // Solo se ejecuta si cambia el estado de autenticación/rol

  // Manejador para cambiar de reporte y ejecutarlo
  const handleRunReport = (type) => {
    setReportType(type); // Actualiza el tipo de reporte
    // Ejecuta la carga usando el estado actual de useDateFilter
    loadReport(type, useDateFilter);
  };

  // Renderizado de datos (sin cambios)
  const renderData = () => {
    // ... (igual que antes)
    if (loading) return <p>Loading data...</p>;
    if (message && reportData.length === 0) return <p>{message}</p>; // Mostrar mensaje si no hay datos
    if (reportData.length === 0) return <p>Click a report button to view data.</p>; // Mensaje inicial o si no hay datos


    switch (reportType) {
      case "ACTIVE_LOANS":
      case "LATE_LOANS":
        return (
          <table>
            <thead><tr><th>ID</th><th>Cliente</th><th>Herramienta</th><th>Inicio</th><th>Vencimiento</th><th>Estado</th></tr></thead>
            <tbody>
              {reportData.map(loan => (
                <tr key={loan.id}>
                  <td>{loan.id}</td>
                  <td>{loan.client?.name} ({loan.client?.rut})</td>
                  <td>{loan.tool?.name}</td>
                  <td>{loan.startDate}</td>
                  <td>{loan.dueDate}</td>
                  <td>{loan.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "LATE_CLIENTS":
         return (
          <table>
            <thead><tr><th>ID</th><th>RUT</th><th>Nombre</th><th>Email</th><th>Estado</th></tr></thead>
            <tbody>
              {reportData.map(client => (
                <tr key={client.id}>
                  <td>{client.id}</td>
                  <td>{client.rut}</td>
                  <td>{client.name}</td>
                  <td>{client.email}</td>
                  <td>{client.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "TOP_TOOLS":
        return (
          <table>
            <thead><tr><th>Ranking</th><th>Herramienta</th><th>Total Préstamos</th></tr></thead>
            <tbody>
              {/* El backend devuelve Object[] con ToolEntity y Count */}
              {reportData.map((item, index) => (
                <tr key={item[0]?.id || index}> {/* Usar ID de herramienta si existe como key */}
                  <td>{index + 1}</td>
                  <td>{item[0]?.name}</td>
                  <td>{item[1]}</td> {/* Asumiendo que item[1] es el count */}
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return <p>Select a report type.</p>;
    }
  };


  return (
    <div style={{ padding: 16 }}>
      <h2>Reportes del Sistema (Épica 6)</h2>

      {/* --- Controles de Filtro de Fecha --- */}
      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <h4>Date Filter (Optional for Loans/Clients, Required for Top Tools)</h4>
        <label>
          <input
            type="checkbox"
            checked={useDateFilter}
            onChange={(e) => setUseDateFilter(e.target.checked)}
          />
          Apply Date Filter
        </label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px', opacity: useDateFilter ? 1 : 0.5 }}>
          <label>From:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
            disabled={!useDateFilter} // Deshabilitar si el checkbox no está marcado
          />
          <label>To:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
            disabled={!useDateFilter} // Deshabilitar si el checkbox no está marcado
          />
        </div>
      </div>


      {/* --- Botones de Reporte --- */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => handleRunReport("LATE_CLIENTS")} disabled={loading}>
          Clientes Atrasados (RF6.2) {useDateFilter ? '(Filtered)' : ''}
        </button>
        <button onClick={() => handleRunReport("ACTIVE_LOANS")} disabled={loading}>
          Préstamos Activos (RF6.1) {useDateFilter ? '(Filtered)' : ''}
        </button>
        <button onClick={() => handleRunReport("LATE_LOANS")} disabled={loading}>
          Préstamos Atrasados (RF6.1) {useDateFilter ? '(Filtered)' : ''}
        </button>
        {/* Botón Ranking siempre usa filtro si está activo, o es requerido */}
        <button
           onClick={() => handleRunReport("TOP_TOOLS")}
           // Deshabilitar si está cargando O si el filtro está activo pero faltan fechas
           disabled={loading || (useDateFilter && (!dateRange.from || !dateRange.to))}
           title={!useDateFilter ? "Enable date filter to run Top Tools report" : ""} // Tooltip
        >
          Ranking Herramientas (RF6.3) {useDateFilter ? '(Filtered)' : '(Date Range Required)'}
        </button>
         {!useDateFilter && <span style={{fontSize: '0.9em', color: 'orange'}}>(Enable Date Filter for Top Tools)</span>}
         {useDateFilter && (!dateRange.from || !dateRange.to) && <span style={{fontSize: '0.9em', color: 'red'}}>(Select From/To Dates)</span>}

      </div>

      {/* --- Visor de Datos --- */}
      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        <h3>
          Results: {reportType.replace('_', ' ')}
          {useDateFilter && dateRange.from && dateRange.to && ` (From ${dateRange.from} To ${dateRange.to})`}
        </h3>
        {renderData()}
      </div>
    </div>
  );
}

export default ReportViewer;
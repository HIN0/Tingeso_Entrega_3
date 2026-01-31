import React, { useEffect, useState } from "react";
import ClientService from "../services/client.service";
import LoanService from "../services/loan.service";
import { useKeycloak } from "@react-keycloak/web";
import { Link } from "react-router-dom";

// Componente simple para mostrar los detalles de las deudas debajo de la fila del cliente
function DebtDetails({ clientId, onPay, messageSetter }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setErrorMessage("");
    LoanService.getUnpaidLoansByClient(clientId)
      .then(response => {
        setDebts(response.data);
        if (response.data.length === 0) {
          setErrorMessage("No hay deudas pendientes (estado RECEIVED) para este cliente.");
        }
      })
      .catch(e => {
        console.error("Error fetching unpaid loans:", e);
        setErrorMessage(`Error al cargar deudas: ${e.response?.data?.message || e.message}`);
      })
      .finally(() => setLoading(false));
  }, [clientId]); // Recargar si cambia el ID del cliente (aunque en este uso no cambiará mientras esté visible)

  const handlePay = (loanId) => {
    setErrorMessage(""); // Limpiar errores antes de intentar pagar
    if (!window.confirm(`¿Marcar la deuda del préstamo #${loanId} como pagada?`)) {
        return;
    }
    messageSetter(`Procesando pago para préstamo ${loanId}...`); // Usar el setter del componente padre
    LoanService.markAsPaid(loanId)
      .then(() => {
        messageSetter(`Pago registrado para préstamo ${loanId}. Actualizando lista...`);
        // Recargar las deudas para esta fila
        setLoading(true);
        LoanService.getUnpaidLoansByClient(clientId)
          .then(response => setDebts(response.data))
          .catch(e => setErrorMessage(`Error al recargar deudas: ${e.response?.data?.message || e.message}`))
          .finally(() => setLoading(false));
      })
      .catch(e => {
        console.error("Error marking loan as paid:", e);
        setErrorMessage(`Error al marcar pago: ${e.response?.data?.message || e.message}`);
        messageSetter(""); // Limpiar mensaje de progreso si hay error
      });
  };

  if (loading) {
    return (
      <td colSpan="7" style={{ textAlign: 'center', padding: '10px', fontStyle: 'italic' }}>
        Cargando deudas...
      </td>
    );
  }

  return (
    <td colSpan="7" style={{ padding: '10px', backgroundColor: '#f0f0f0', borderTop: '2px solid grey' }}>
      <h4 style={{ marginTop: 0 }}>Deudas Pendientes (Estado RECEIVED)</h4>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {debts.length > 0 ? (
        <table border="1" style={{ width: '95%', margin: 'auto', borderCollapse: 'collapse', backgroundColor: 'white', color: '#333' }}>
          <thead>
            <tr>
              <th>Préstamo ID</th>
              <th>Herramienta</th>
              <th>Monto ($)</th>
              <th>Inicio</th>
              <th>Vencimiento</th>
              <th>Devolución</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {debts.map(loan => (
              <tr key={loan.id}>
                <td>{loan.id}</td>
                <td>{loan.tool?.name}</td>
                <td>{loan.totalPenalty.toFixed(0)}</td>
                <td>{loan.startDate}</td>
                <td>{loan.dueDate}</td>
                <td>{loan.returnDate}</td>
                <td>
                  <button onClick={() => handlePay(loan.id)} style={{ backgroundColor: 'green', color: 'white' }}>
                    Pagar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !errorMessage && <p>No se encontraron deudas pendientes (estado RECEIVED).</p>
      )}
    </td>
  );
}


function ClientList() {
  const [clients, setClients] = useState([]);
  const { keycloak } = useKeycloak();
  const isAuth = !!keycloak?.authenticated;
  const isAdmin = isAuth && keycloak.hasRealmRole("ADMIN");
  const isEmployee = isAuth && keycloak.hasRealmRole("USER");
  const [message, setMessage] = useState("");

  // Nuevo estado para controlar qué cliente tiene los detalles de deuda visibles
  const [visibleDebtsClientId, setVisibleDebtsClientId] = useState(null);

  const loadClients = () => {
    setMessage("");
    ClientService.getAll()
      .then(response => setClients(response.data))
      .catch(e => {
        console.error("Error fetching clients:", e);
        setMessage("Error al cargar la lista de clientes.");
      });
  };

  useEffect(() => {
    if (isAdmin || isEmployee) {
      loadClients();
    }
  }, [isAdmin, isEmployee]);

  // Modificado: Usa 'attemptReactivation' cuando se intenta activar
  const handleUpdateStatus = (id, currentStatus, clientName) => {
    setMessage("");
    if (currentStatus === "ACTIVE") {
      // Flujo para Restringir (igual)
      if (window.confirm(`¿Seguro que quieres cambiar el estado del cliente ${clientName} (ID: ${id}) a RESTRICTED?`)) {
        ClientService.updateStatus(id, "RESTRICTED")
          .then(loadClients)
          .catch(e => {
            console.error(`Error updating client status to RESTRICTED:`, e);
            setMessage(`Error al restringir: ${e.response?.data?.message || e.message}`);
          });
      }
    } else { // currentStatus === "RESTRICTED"
      // Flujo para Activar (Usa nuevo método)
      if (window.confirm(`¿Intentar reactivar al cliente ${clientName} (ID: ${id})? Se verificará que no tenga deudas ni atrasos.`)) {
        ClientService.attemptReactivation(id) // Llama al servicio del frontend que llama al backend
          .then((response) => {
            setMessage(`Intento de activación para ${clientName}. Estado final: ${response.data.status}.`);
            loadClients(); // Recargar para reflejar el cambio (si ocurrió)
          })
          .catch(e => {
            console.error(`Error attempting reactivation for client ${id}:`, e);
            setMessage(`Error al intentar activar ${clientName}: ${e.response?.data?.message || e.message}`);
          });
      }
    }
  };

  // Modificado: Ahora Muestra/Oculta los detalles de la deuda
  const handleShowOrHideDebts = (clientId) => {
    setMessage(""); // Limpiar mensaje general
    if (visibleDebtsClientId === clientId) {
      setVisibleDebtsClientId(null); // Si ya están visibles, ocúltalos
    } else {
      setVisibleDebtsClientId(clientId); // Si no, muéstralos
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Gestión de Clientes</h2>
      {isAdmin && (
        <Link to="/clients/add" style={{ marginBottom: '15px', display: 'inline-block' }}>
          ➕ Registrar Nuevo Cliente
        </Link>
      )}
      {message && <p style={{ color: message.startsWith("Error") ? 'red' : 'green' }}>{message}</p>}

      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>RUT</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            // Usamos React.Fragment para poder renderizar dos filas por cliente si es necesario
            <React.Fragment key={client.id}>
              <tr>
                <td>{client.id}</td>
                <td>{client.rut}</td>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td style={{ fontWeight: 'bold', color: client.status === 'RESTRICTED' ? 'red' : 'green' }}>{client.status}</td>
                <td>
                  {/* Editar (Solo Admin) */}
                  {isAdmin && (
                    <Link to={`/clients/edit/${client.id}`} style={{ marginRight: '10px' }}>
                      Editar
                    </Link>
                  )}
                  {/* Activar/Restringir (Solo Admin) */}
                  {isAdmin && (
                    <button
                      onClick={() => handleUpdateStatus(client.id, client.status, client.name)}
                      style={{ backgroundColor: client.status === 'ACTIVE' ? 'darkred' : 'darkgreen', color: 'white', marginRight: '10px' }}
                    >
                      {client.status === 'ACTIVE' ? 'Restringir' : 'Activar (Verificar)'}
                    </button>
                  )}
                  {/* Ver/Ocultar Deudas (Admin o Empleado, solo si está restringido) */}
                  {(isAdmin || isEmployee) && client.status === 'RESTRICTED' && (
                       <button
                          onClick={() => handleShowOrHideDebts(client.id)}
                          style={{ backgroundColor: 'purple', color: 'white' }}
                        >
                          {visibleDebtsClientId === client.id ? 'Ocultar Deudas' : 'Ver Deudas'}
                        </button>
                  )}
                </td>
              </tr>
              {/* Fila Condicional para mostrar detalles de deuda */}
              {visibleDebtsClientId === client.id && (
                <tr className="debt-details-row">
                  {/* Pasamos el clientId y el setMessage para que el subcomponente pueda actualizar mensajes */}
                  <DebtDetails clientId={client.id} onPay={() => {}} messageSetter={setMessage} />
                  {/* La función onPay aquí es un placeholder, ya que la lógica de pago está dentro de DebtDetails */}
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClientList;
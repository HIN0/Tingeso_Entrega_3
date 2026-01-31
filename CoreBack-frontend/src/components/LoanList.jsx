import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import LoanService from "../services/loan.service";
import { Link } from "react-router-dom";

function LoanList() {
  const [loans, setLoans] = useState([]);
  const { keycloak } = useKeycloak();
  const isAuth = !!keycloak?.authenticated;
  const isAdmin = isAuth && keycloak.hasRealmRole("ADMIN");
  // Uso el rol 'USER' como alias para 'Employee' (según SecurityConfig)
  const isUser = isAuth && keycloak.hasRealmRole("USER");

  const loadLoans = () => {
    LoanService.getAll()
      .then(response => {
        if (Array.isArray(response.data)) {
          setLoans(response.data);
        } else {
          console.error("Error: API did not return an array for loans", response.data);
          setLoans([]); // Poner un array vacío en caso de error
        }
      })
      .catch(e => {
          console.error("Error fetching loans:", e);
          setLoans([]); // Poner un array vacío en caso de error de red
      });
  };

  useEffect(() => {
    // Solo cargar si está autenticado
    if(isAuth) {
      loadLoans();
    }
  }, [isAuth]);

  // --- Renderizado ---
  return (
    <div style={{ padding: 16 }}> {/* Añadir padding */}
      <h2>Loans</h2>
      {(isAdmin || isUser) && <Link to="/loans/add" style={{ marginBottom: '15px', display: 'inline-block' }}>➕ Add Loan</Link>}
      
      {/* Tabla para mejor visualización */}
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Tool</th>
            <th>Start</th>
            <th>Due</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Asegurarse que 'loans' es un array antes de mapear */}
          {Array.isArray(loans) && loans.map(loan => (
            <tr key={loan.id}>
              <td>{loan.id}</td>
              <td>{loan.client?.name}</td>
              <td>{loan.tool?.name}</td>
              <td>{loan.startDate}</td>
              <td>{loan.dueDate}</td>
              <td style={{ fontWeight: 'bold', color: loan.status === 'LATE' ? 'red' : 'inherit' }}>
                {loan.status}
              </td>
              <td>
                {/* Mostrar si (es Admin O Empleado) Y (estado es ACTIVE O LATE) */}
                {(isAdmin || isUser) && (loan.status === "ACTIVE" || loan.status === "LATE") && (
                  <Link to={`/loans/return/${loan.id}`}>Return</Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Mostrar si el array está vacío o no es un array */}
      {(!Array.isArray(loans) || loans.length === 0) && (
          <p style={{ marginTop: '15px' }}>No loans (Active or Late) found.</p>
      )}
    </div>
  );
}

export default LoanList;
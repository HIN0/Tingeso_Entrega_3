import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoanService from "../services/loan.service";

function ReturnLoan() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estado para guardar los detalles del préstamo (para obtener toolId y valor de reposición)
  const [loanDetails, setLoanDetails] = useState(null);
  const [returnForm, setReturnForm] = useState({
    returnDate: "",
    damaged: false,
    irreparable: false,
    toolId: null, 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Loan Details para obtener toolId y valor de reposición
  useEffect(() => {
    LoanService.get(id) // Asume que tienes un método get(id) en loan.service.js
      .then(response => {
        const loan = response.data;
        if (loan.status !== "ACTIVE" && loan.status !== "LATE") {
            setError("El préstamo no está activo ni atrasado.");
            setLoading(false);
            return;
        }
        setLoanDetails(loan);
        setReturnForm(prev => ({
            ...prev,
            toolId: loan.tool.id, // Extraer toolId (requerido por el DTO del backend)
            // Establecer la fecha de devolución por defecto a hoy
            returnDate: new Date().toISOString().substring(0, 10) 
        }));
        setLoading(false);
      })
      .catch(e => {
        console.error("Error fetching loan details:", e);
        setError("Error al cargar los detalles del préstamo.");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newForm = { ...returnForm, [name]: type === 'checkbox' ? checked : value };
    
    // Si desmarcan DAÑADO, deben desmarcar IRREPARABLE
    if (name === 'damaged' && !checked) {
        newForm.irreparable = false;
    }

    setReturnForm(newForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!returnForm.toolId) {
        setError("Error: ID de herramienta no encontrado.");
        return;
    }
    
    if (returnForm.damaged && !window.confirm("CONFIRMAR: La devolución implica cargos. ¿Desea continuar?")) {
        return;
    }

    const payload = {
        toolId: returnForm.toolId,
        damaged: returnForm.damaged,
        irreparable: returnForm.irreparable,
        returnDate: returnForm.returnDate,
    };
    
    LoanService.returnLoan(id, payload)
      .then(() => {
        navigate("/loans");
      })
      .catch((e) => {
        console.error("Error returning loan:", e.response ? e.response.data : e);
        setError(`Error en la devolución: ${e.response?.data?.message || 'Error de conexión/servidor.'}`);
      });
  };

  if (loading) return <h3 style={{padding:16}}>Cargando detalles del préstamo...</h3>;
  if (error) return <h3 style={{padding:16, color: 'red'}}>{error}</h3>;
  if (!loanDetails) return <h3 style={{padding:16}}>Préstamo no válido o no encontrado.</h3>;


  return (
    <div style={{ padding: 16 }}>
      <h2>Devolución de Préstamo #{id}</h2>
      <p>Herramienta: <strong>{loanDetails.tool?.name}</strong> | Cliente: <strong>{loanDetails.client?.name}</strong></p>
      <p>Fecha Vencimiento: {loanDetails.dueDate}</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Fecha de Devolución: </label>
          <input
            type="date"
            name="returnDate"
            value={returnForm.returnDate}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{marginTop: '10px'}}>
          <label>
            <input
              type="checkbox"
              name="damaged"
              checked={returnForm.damaged}
              onChange={handleChange}
            />
            ¿Herramienta dañada? (Aplica cargo por Reparación o Reposición)
          </label>
        </div>

        {returnForm.damaged && (
            <div style={{marginLeft: '20px', marginTop: '10px'}}>
                <label>
                    <input
                        type="checkbox"
                        name="irreparable"
                        checked={returnForm.irreparable}
                        onChange={handleChange}
                    />
                    ¿Daño irreparable? (Aplica Cargo de Reposición: ${loanDetails.tool?.replacementValue})
                </label>
            </div>
        )}

        <button type="submit" style={{marginTop: '20px'}}>Confirmar Devolución</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ReturnLoan;
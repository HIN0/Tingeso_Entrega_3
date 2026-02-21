import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoanService from "../services/loan.service";
import { 
  Box, Typography, TextField, Button, Paper, Grid, 
  Checkbox, FormControlLabel, CircularProgress, Alert, Snackbar, Divider
} from '@mui/material';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CancelIcon from '@mui/icons-material/Cancel';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

function ReturnLoan() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loanDetails, setLoanDetails] = useState(null);
  const [returnForm, setReturnForm] = useState({
    returnDate: "",
    damaged: false,
    irreparable: false,
    toolId: null, 
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notificacion, setNotificacion] = useState({ open: false, text: '', severity: 'info' });

  useEffect(() => {
    LoanService.get(id)
      .then(response => {
        const loan = response.data;
        if (loan.status !== "ACTIVE" && loan.status !== "LATE") {
            showMsg("El préstamo no está en un estado apto para devolución.", "warning");
            setTimeout(() => navigate("/loans"), 3000);
            return;
        }
        setLoanDetails(loan);
        setReturnForm(prev => ({
            ...prev,
            toolId: loan.tool.id,
            returnDate: new Date().toISOString().substring(0, 10) 
        }));
        setLoading(false);
      })
      .catch(e => {
        console.error("Error fetching loan details:", e);
        showMsg("Error al cargar los detalles del préstamo.", "error");
        setLoading(false);
      });
  }, [id, navigate]);

  const showMsg = (text, severity = "info") => setNotificacion({ open: true, text, severity });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newForm = { ...returnForm, [name]: type === 'checkbox' ? checked : value };
    
    // Heurística #5: Lógica de exclusividad (Solo una opción de daño puede estar marcada)
    if (name === 'damaged' && checked) {
        newForm.irreparable = false;
    } else if (name === 'irreparable' && checked) {
        newForm.damaged = false;
    }

    setReturnForm(newForm);
  };

  // Validaciones de negocio para el estado del formulario
  const isDateInvalid = loanDetails && returnForm.returnDate < loanDetails.startDate;
  const areBothSelected = returnForm.damaged && returnForm.irreparable;
  const isFormInvalid = isDateInvalid || areBothSelected || !returnForm.returnDate;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
        toolId: returnForm.toolId,
        damaged: returnForm.damaged,
        irreparable: returnForm.irreparable,
        returnDate: returnForm.returnDate,
    };
    
    LoanService.returnLoan(id, payload)
      .then(() => {
        showMsg("¡Devolución registrada exitosamente!", "success");
        setTimeout(() => navigate("/loans"), 2000);
      })
      .catch((e) => {
        const errorMsg = e.response?.data?.message || 'Error en el servidor.';
        showMsg(`Error: ${errorMsg}`, "error");
        setSubmitting(false);
      });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 3 }}>
      <Snackbar 
        open={notificacion.open} 
        autoHideDuration={4000} 
        onClose={() => setNotificacion({ ...notificacion, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={notificacion.severity} variant="filled">{notificacion.text}</Alert>
      </Snackbar>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Devolución de Préstamo #{id}
      </Typography>

      <Paper elevation={3} sx={{ p: 5, borderRadius: 2 }}>
        {/* Información del Préstamo */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="textSecondary">Herramienta</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{loanDetails.tool?.name}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="textSecondary">Cliente</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{loanDetails.client?.name}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Alert severity={loanDetails.status === "LATE" ? "error" : "info"} sx={{ mt: 1 }}>
                Fecha de Inicio: <strong>{loanDetails.startDate}</strong> | 
                Vencimiento: <strong>{loanDetails.dueDate}</strong> 
                {loanDetails.status === "LATE" && " - PRÉSTAMO ATRASADO"}
              </Alert>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container direction="column" spacing={4}>
            
            {/* Fecha de Devolución con Validación */}
            <Grid item>
              <TextField
                fullWidth
                label="Fecha de Devolución Real"
                name="returnDate"
                type="date"
                value={returnForm.returnDate}
                onChange={handleChange}
                required
                error={isDateInvalid}
                helperText={isDateInvalid ? `Error: La fecha no puede ser anterior al inicio (${loanDetails.startDate})` : "Fecha Válida"}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Opciones de Daño con Validación de Exclusividad */}
            <Grid item>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  borderColor: areBothSelected ? 'red' : 'divider',
                  bgcolor: areBothSelected ? '#fff8f8' : 'inherit'
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Estado de la Herramienta (Seleccione máximo una opción)
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox name="damaged" checked={returnForm.damaged} onChange={handleChange} color="warning" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ReportProblemIcon sx={{ mr: 1, color: 'orange' }} size="small" />
                        <Typography>Herramienta Dañada (Aplica cargo por Reparación)</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={<Checkbox name="irreparable" checked={returnForm.irreparable} onChange={handleChange} color="error" />}
                    label={
                      <Typography color="error" sx={{ fontWeight: 'medium' }}>
                        Daño Irreparable (Cargo Reposición: ${loanDetails.tool?.replacementValue})
                      </Typography>
                    }
                  />
                </Box>

                {areBothSelected && (
                  <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block', fontWeight: 'bold' }}>
                    * Heurística #5: No puede marcar ambas opciones simultáneamente.
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Botones de Acción */}
            <Grid item>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 6 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ px: 8, py: 2, fontWeight: 'bold' }}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AssignmentReturnIcon />}
                  disabled={isFormInvalid || submitting}
                >
                  CONFIRMAR DEVOLUCIÓN
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  sx={{ px: 8, py: 2, fontWeight: 'bold' }}
                  startIcon={<CancelIcon />}
                  onClick={() => navigate("/loans")}
                  disabled={submitting}
                >
                  CANCELAR
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default ReturnLoan;
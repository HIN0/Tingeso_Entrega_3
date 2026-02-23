import React, { useState, useEffect } from "react";
import LoanService from "../services/loan.service";
import ClientService from "../services/client.service";
import ToolService from "../services/tool.service";
import { useNavigate } from "react-router-dom";
import { 
  Box, Typography, Button, Paper, Grid, Snackbar, Alert, 
  CircularProgress, Autocomplete, TextField, InputAdornment 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import ConstructionIcon from '@mui/icons-material/Construction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventBusyIcon from '@mui/icons-material/EventBusy';

function AddLoan() {
  const [loan, setLoan] = useState({ clientId: "", toolId: "", startDate: "", dueDate: "" });
  const [clients, setClients] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [notificacion, setNotificacion] = useState({ open: false, text: '', severity: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([ClientService.getAll(), ToolService.getAll()])
      .then(([clientsRes, toolsRes]) => {
        setClients(clientsRes.data);
        setTools(toolsRes.data);
        setDataLoaded(true);
      })
      .catch(() => showMsg("Error al sincronizar datos de DB", "error"));
  }, []);

  const showMsg = (text, severity = "info") => setNotificacion({ open: true, text, severity });

  // CORRECCIÓN SONAR: Uso de Number.parseInt en lugar de parseInt global
  const clientExists = (id) => !id || clients.some(c => c.id === Number.parseInt(id));
  const toolExists = (id) => !id || tools.some(t => t.id === Number.parseInt(id));

  // Lógica de ayuda para textos y estados (Evita ternarios anidados en el JSX)
  const getClientHelperText = () => {
    if (!clientExists(loan.clientId)) return "Persona no existe en DB";
    return loan.clientId === "" ? "Ingrese valor" : "Cliente validado";
  };

  const getToolHelperText = () => {
    if (!toolExists(loan.toolId)) return "Herramienta no existe en DB";
    return loan.toolId === "" ? "Ingrese valor" : "Herramienta disponible";
  };

  const getStatusColor = (exists, value) => {
    return exists && value !== "" ? "success" : "error";
  };

  const isFormInvalid = !loan.clientId || !loan.toolId || !loan.startDate || !loan.dueDate || 
                        !clientExists(loan.clientId) || !toolExists(loan.toolId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    LoanService.create(loan)
      .then(() => {
        showMsg("¡Préstamo registrado exitosamente!", "success");
        setTimeout(() => navigate("/loans"), 2000);
      })
      .catch((error) => {
        showMsg(error.response?.data?.message || "Error al crear préstamo", "error");
        setLoading(false);
      });
  };

  if (!dataLoaded) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 3 }}>
      <Snackbar open={notificacion.open} autoHideDuration={2000} onClose={() => setNotificacion({ ...notificacion, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={notificacion.severity} variant="filled">{notificacion.text}</Alert>
      </Snackbar>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Registrar Nuevo Préstamo</Typography>

      <Paper elevation={3} sx={{ p: 5, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container direction="column" spacing={4}>
            
            {/* CLIENTE */}
            <Grid item xs={12}>
              <Autocomplete
                options={clients.filter(c => c.status === 'ACTIVE')}
                getOptionLabel={(option) => `ID: ${option.id} - ${option.name} (${option.rut})`}
                onChange={(_event, newValue) => setLoan({ ...loan, clientId: newValue ? newValue.id : "" })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Seleccionar Cliente"
                    required
                    error={!clientExists(loan.clientId) || loan.clientId === ""}
                    helperText={getClientHelperText()}
                    color={getStatusColor(clientExists(loan.clientId), loan.clientId)}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonIcon color={getStatusColor(clientExists(loan.clientId), loan.clientId)} />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* HERRAMIENTA */}
            <Grid item xs={12}>
              <Autocomplete
                options={tools.filter(t => t.status === 'AVAILABLE')}
                getOptionLabel={(option) => `ID: ${option.id} - ${option.name} (${option.category})`}
                onChange={(_event, newValue) => setLoan({ ...loan, toolId: newValue ? newValue.id : "" })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Seleccionar Herramienta"
                    required
                    error={!toolExists(loan.toolId) || loan.toolId === ""}
                    helperText={getToolHelperText()}
                    color={getStatusColor(toolExists(loan.toolId), loan.toolId)}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <ConstructionIcon color={getStatusColor(toolExists(loan.toolId), loan.toolId)} />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* FECHAS */}
            <Grid item xs={12}>
              <TextField
                fullWidth label="Fecha de Inicio" name="startDate" type="date"
                value={loan.startDate} onChange={(e) => setLoan({...loan, startDate: e.target.value})} required
                error={loan.startDate === ""}
                helperText={loan.startDate === "" ? "Ingrese valor" : "Fecha de inicio del préstamo"}
                InputLabelProps={{ shrink: true }}
                color={loan.startDate !== "" ? "success" : "error"}
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon color={loan.startDate !== "" ? "success" : "error"} /></InputAdornment> }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth label="Fecha de Vencimiento" name="dueDate" type="date"
                value={loan.dueDate} onChange={(e) => setLoan({...loan, dueDate: e.target.value})} required
                error={loan.dueDate === ""}
                helperText={loan.dueDate === "" ? "Ingrese valor" : "Fecha límite para la devolución"}
                InputLabelProps={{ shrink: true }}
                color={loan.dueDate !== "" ? "success" : "error"}
                InputProps={{ startAdornment: <InputAdornment position="start"><EventBusyIcon color={loan.dueDate !== "" ? "success" : "error"} /></InputAdornment> }}
              />
            </Grid>

            {/* BOTONES */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <Button type="submit" variant="contained" color="primary" disabled={isFormInvalid || loading} sx={{ px: 8, py: 2, fontWeight: 'bold' }} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}>
                  GUARDAR PRÉSTAMO
                </Button>
                <Button variant="contained" color="error" onClick={() => navigate("/loans")} sx={{ px: 8, py: 2, fontWeight: 'bold' }} startIcon={<CancelIcon />}>
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

export default AddLoan;
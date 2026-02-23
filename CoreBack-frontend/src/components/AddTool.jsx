import React, { useState } from "react";
import ToolService from "../services/tool.service";
import { useNavigate } from "react-router-dom";
import { 
  Box, Typography, TextField, Button, Paper, Grid, 
  InputAdornment, Snackbar, Alert, CircularProgress 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ConstructionIcon from '@mui/icons-material/Construction';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return "Error desconocido en la validación.";
  let errorString = "";
  for (const field in errors) {
    const formattedField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    errorString += `• ${formattedField}: ${errors[field]}\n`;
  }
  return errorString.trim();
};

function AddTool() {
  const [tool, setTool] = useState({
    name: "",
    category: "",
    replacementValue: "",
    stock: "",
    inRepair: 0 
  });
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notificacion, setNotificacion] = useState({ open: false, text: '', severity: 'error' });
  const navigate = useNavigate();

  // CORRECCIÓN SONAR: Se eliminó el ternario anidado para mejorar legibilidad
  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumericField = ['stock', 'replacementValue', 'inRepair'].includes(name);
    
    let finalValue = value;

    if (isNumericField) {
      // CORRECCIÓN SONAR: Uso de Number.parseInt con base decimal explícita
      finalValue = value === "" ? "" : (Number.parseInt(value, 10) || 0);
    }
    
    setTool({ ...tool, [name]: finalValue });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Validaciones funcionales (Heurística #5)
    if (tool.replacementValue < 1000) {
      setNotificacion({ open: true, text: "El valor de reposición debe ser al menos 1000.", severity: 'warning' });
      setLoading(false);
      return;
    }

    ToolService.create(tool)
      .then(() => {
        setNotificacion({ 
          open: true, 
          text: "¡Herramienta registrada exitosamente!", 
          severity: 'success' 
        });
        setTimeout(() => navigate("/tools"), 2000); 
      })
      .catch((err) => {
        const backendErrors = err.response?.data?.fieldErrors;
        const msg = backendErrors ? formatValidationErrors(backendErrors) : (err.response?.data?.message || "Error al crear la herramienta.");
        setErrorMsg(msg);
        setNotificacion({ open: true, text: "Error en el formulario", severity: 'error' });
      })
      .finally(() => setLoading(false));
  };

  // Heurística #5: Prevención de errores (Deshabilitar si faltan campos)
  const isFormInvalid = !tool.name || !tool.category || tool.stock === "" || tool.replacementValue === "";

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
      <Snackbar 
        open={notificacion.open} 
        autoHideDuration={5000} 
        onClose={() => setNotificacion({ ...notificacion, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={notificacion.severity} variant="filled">{notificacion.text}</Alert>
      </Snackbar>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Agregar Nueva Herramienta</Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            <strong>Errores de Validación:</strong><br/>{errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Nombre" name="name" value={tool.name} onChange={handleChange} required
                error={tool.name === ""} helperText={tool.name === "" ? "Ingrese nombre" : ""}
                InputProps={{ startAdornment: <InputAdornment position="start"><ConstructionIcon color="primary" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Categoría" name="category" value={tool.category} onChange={handleChange} required
                error={tool.category === ""} helperText={tool.category === "" ? "Ingrese categoría" : ""}
                InputProps={{ startAdornment: <InputAdornment position="start"><CategoryIcon color="primary" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Stock Inicial" name="stock" type="number" value={tool.stock} onChange={handleChange} required
                error={tool.stock === ""} helperText={tool.stock === "" ? "Ingrese valor" : ""}
                sx={{ "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": { display: "none" }, "& input[type=number]": { MozAppearance: "textfield" } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><InventoryIcon color="primary" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Valor de Reposición" name="replacementValue" type="number" value={tool.replacementValue} onChange={handleChange} required
                error={tool.replacementValue === ""} helperText={tool.replacementValue === "" ? "Ingrese valor" : ""}
                sx={{ "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": { display: "none" }, "& input[type=number]": { MozAppearance: "textfield" } }}
                InputProps={{ 
                    startAdornment: (
                        <InputAdornment position="start">
                            <AttachMoneyIcon color="primary" />
                        </InputAdornment>
                    ) 
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 3 }}>
                <Button
                  type="submit" variant="contained" color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={isFormInvalid || loading} sx={{ px: 4 }}
                >
                  Guardar Herramienta
                </Button>
                <Button
                  variant="contained" color="error"
                  startIcon={<CancelIcon />} onClick={() => navigate("/tools")}
                  sx={{ px: 4 }}
                >
                  Cancelar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default AddTool;
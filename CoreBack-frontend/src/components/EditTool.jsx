import React, { useState, useEffect } from "react";
import ToolService from "../services/tool.service";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Box, Typography, TextField, Button, Paper, Grid, 
  InputAdornment, Snackbar, Alert, CircularProgress 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ConstructionIcon from '@mui/icons-material/Construction';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

function EditTool() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState({
    name: "",
    category: "",
    replacementValue: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificacion, setNotificacion] = useState({ open: false, text: '', severity: 'info' });

  useEffect(() => {
    ToolService.get(id)
      .then(response => {
        const { name, category, replacementValue } = response.data;
        setTool({ name, category, replacementValue });
        setLoading(false);
      })
      .catch(e => {
        console.error("Error fetching tool:", e);
        showMsg("Error al cargar los datos de la herramienta.", "error");
        setLoading(false);
      });
  }, [id]);

  const showMsg = (text, severity = "info") => setNotificacion({ open: true, text, severity });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumeric = name === 'replacementValue';
    const val = isNumeric ? (value === "" ? "" : parseInt(value) || 0) : value;
    setTool({ ...tool, [name]: val });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    if (tool.replacementValue < 1000) {
      showMsg("El valor de reposición debe ser al menos 1000.", "warning");
      setSaving(false);
      return;
    }

    ToolService.update(id, tool)
      .then(() => {
        showMsg("¡Herramienta actualizada exitosamente!", "success");
        setTimeout(() => {
          navigate("/tools");
        }, 2000);
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || "Error al actualizar la herramienta.";
        showMsg(errorMsg, "error");
        setSaving(false);
      });
  };

  const isFormInvalid = !tool.name || !tool.category || tool.replacementValue === "";

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 3 }}>
      <Snackbar 
        open={notificacion.open} 
        autoHideDuration={2000} 
        onClose={() => setNotificacion({ ...notificacion, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={notificacion.severity} variant="filled">{notificacion.text}</Alert>
      </Snackbar>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Editar Herramienta (ID: {id})
      </Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={4}>
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
                fullWidth label="Valor de Reposición" name="replacementValue" type="number" 
                value={tool.replacementValue} onChange={handleChange} required
                error={tool.replacementValue === ""} helperText={tool.replacementValue === "" ? "Ingrese valor" : ""}
                sx={{
                  "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": { display: "none" },
                  "& input[type=number]": { MozAppearance: "textfield" }
                }}
                InputProps={{ 
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon color="primary" />
                    </InputAdornment>
                  ) 
                }}
              />
            </Grid>

            {/* Fila para los botones centrados */}
            <Grid item xs={12}>
              <Box sx={{ 
                mt: 4, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: 4 
              }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={isFormInvalid || saving}
                  sx={{ px: 5, py: 1.5 }}
                >
                  Guardar Herramienta
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate("/tools")}
                  sx={{ px: 5, py: 1.5 }}
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

export default EditTool;
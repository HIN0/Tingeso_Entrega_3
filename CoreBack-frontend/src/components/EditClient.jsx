import React, { useState, useEffect } from "react";
import ClientService from "../services/client.service";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Box, Typography, TextField, Button, Paper, Grid, 
  InputAdornment, Snackbar, Alert, CircularProgress 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

function EditClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState({ name: "", rut: "", phone: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notificacion, setNotificacion] = useState({ open: false, text: '', severity: 'info' });

  // Expresiones regulares para validación (Heurística #5)
  const regs = {
    phone: /^9\d{8}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  };

  // Cargar datos del cliente al inicio
  useEffect(() => {
    ClientService.get(id)
      .then(response => {
        setClient(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching client:", error);
        showMsg("Error al cargar los datos del cliente.", "error");
        setLoading(false);
      });
  }, [id]);

  const showMsg = (text, severity = "info") => setNotificacion({ open: true, text, severity });

  const handleChange = (e) => {
    // Bloqueo funcional: No permitir cambiar el RUT (Requisito Funcional)
    if (e.target.name !== "rut") {
      setClient({ ...client, [e.target.name]: e.target.value });
    }
  };

  const validateName = () => client.name.trim().length >= 3;
  const validatePhone = () => regs.phone.test(client.phone);
  const validateEmail = () => regs.email.test(client.email);

  const getFieldColor = (isValid, value) => {
    if (!value) return "error";
    return isValid ? "success" : "error";
  };

  // Validación general del formulario para habilitar el botón
  const isFormInvalid = !(validateName() && validatePhone() && validateEmail());

  const handleSubmit = (e) => {
    e.preventDefault();
    setUpdating(true);

    const updateData = {
      name: client.name,
      phone: client.phone,
      email: client.email
    };

    ClientService.update(id, updateData)
      .then(() => {
        showMsg("¡Cliente actualizado exitosamente!", "success");
        // Heurística #1: Tiempo para que el usuario lea el éxito
        setTimeout(() => navigate("/clients"), 2000);
      })
      .catch((error) => {
        const errorMsg = error.response?.data?.message || error.response?.data || error.message;
        showMsg(`Error al actualizar: ${errorMsg}`, "error");
        setUpdating(false);
      });
  };

  const autofillStyles = {
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px white inset",
      WebkitTextFillColor: "black",
    },
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 3 }}>
      <Snackbar open={notificacion.open} autoHideDuration={2000} onClose={() => setNotificacion({ ...notificacion, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={notificacion.severity} variant="filled">{notificacion.text}</Alert>
      </Snackbar>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Editar Cliente (ID: {id})</Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={4}>
            {/* Nombre */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Nombre Completo" name="name" value={client.name} onChange={handleChange} required
                color={getFieldColor(validateName(), client.name)}
                focused={client.name !== ""}
                error={client.name === "" || !validateName()}
                helperText={client.name === "" ? "Ingrese valor" : (!validateName() ? "Mínimo 3 caracteres" : "Nombre válido")}
                sx={{ ...autofillStyles }}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color={getFieldColor(validateName(), client.name)} /></InputAdornment> }}
              />
            </Grid>

            {/* RUT (Solo lectura por requisito funcional) */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="RUT (No editable)" name="rut" value={client.rut} readOnly
                disabled // Heurística #4: Consistencia visual de campo no editable
                InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon /></InputAdornment> }}
                sx={{ bgcolor: '#f5f5f5' }}
              />
            </Grid>

            {/* Teléfono */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Teléfono" name="phone" value={client.phone} onChange={handleChange} required
                color={getFieldColor(validatePhone(), client.phone)}
                focused={client.phone !== ""}
                error={client.phone === "" || !validatePhone()}
                helperText={client.phone === "" ? "Ingrese valor" : (!validatePhone() ? "Debe empezar con 9 y tener 9 dígitos" : "Teléfono válido")}
                sx={{ ...autofillStyles }}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon color={getFieldColor(validatePhone(), client.phone)} /></InputAdornment> }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Email" name="email" value={client.email} onChange={handleChange} required
                color={getFieldColor(validateEmail(), client.email)}
                focused={client.email !== ""}
                error={client.email === "" || !validateEmail()}
                helperText={client.email === "" ? "Ingrese valor" : (!validateEmail() ? "Correo inválido" : "Email válido")}
                sx={{ ...autofillStyles }}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color={getFieldColor(validateEmail(), client.email)} /></InputAdornment> }}
              />
            </Grid>

            {/* Botones Centrados */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 4 }}>
                <Button
                  type="submit" variant="contained" color="primary"
                  disabled={isFormInvalid || updating} sx={{ px: 5, py: 1.5 }}
                  startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  Guardar Cambios
                </Button>
                <Button
                  variant="contained" color="error"
                  onClick={() => navigate("/clients")} sx={{ px: 5, py: 1.5 }}
                  startIcon={<CancelIcon />}
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

export default EditClient;
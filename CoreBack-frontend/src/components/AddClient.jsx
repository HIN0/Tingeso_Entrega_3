import React, { useState } from "react";
import ClientService from "../services/client.service";
import { useNavigate } from "react-router-dom";
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

function AddClient() {
  const [client, setClient] = useState({ name: "", rut: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [notificacion, setNotificacion] = useState({ open: false, text: '', severity: 'info' });
  const navigate = useNavigate();

  // CORRECCIÓN SONAR: Se eliminó el escape innecesario en el guion del RUT
  const regs = {
    rut: /^(\d{1,2}(\.?\d{3}){2})-([\dkK])$/, 
    phone: /^9\d{8}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  };

  const handleChange = (e) => {
    setClient({ ...client, [e.target.name]: e.target.value });
  };

  const showMsg = (text, severity = "info") => setNotificacion({ open: true, text, severity });

  const validateName = () => client.name.trim().length >= 3;
  const validateRut = () => regs.rut.test(client.rut);
  const validatePhone = () => regs.phone.test(client.phone);
  const validateEmail = () => regs.email.test(client.email);

  const getFieldColor = (isValid, value) => {
    if (!value) return "error";
    return isValid ? "success" : "error";
  };

  const isFormInvalid = !(validateName() && validateRut() && validatePhone() && validateEmail());

  // CORRECCIÓN SONAR: Extracción de ternarios anidados para mejorar legibilidad
  const getNameHelperText = () => {
    if (client.name === "") return "Ingrese nombre completo";
    return validateName() ? "Nombre válido" : "Mínimo 3 caracteres";
  };

  const getRutHelperText = () => {
    if (!client.rut) return "Ingrese rut";
    return validateRut() ? "RUT válido" : "Formato: 12.345.678-9";
  };

  const getPhoneHelperText = () => {
    if (!client.phone) return "Ingrese número telefónico";
    return validatePhone() ? "Teléfono válido" : "Debe empezar con 9 y tener 9 dígitos";
  };

  const getEmailHelperText = () => {
    if (!client.email) return "Ingrese correo electrónico";
    return validateEmail() ? "Email válido" : "Correo inválido";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    ClientService.create(client)
      .then(() => {
        showMsg("¡Cliente registrado exitosamente!", "success");
        setTimeout(() => navigate("/clients"), 2000);
      })
      .catch((error) => {
        showMsg(`Error: ${error.response?.data || error.message}`, "error");
        setLoading(false);
      });
  };

  const autofillStyles = {
    "& input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px white inset",
      WebkitTextFillColor: "black",
    },
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 3 }}>
      <Snackbar open={notificacion.open} autoHideDuration={2000} onClose={() => setNotificacion({ ...notificacion, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={notificacion.severity} variant="filled">{notificacion.text}</Alert>
      </Snackbar>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Registrar Nuevo Cliente</Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2}}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={4}>
            {/* Nombre */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Nombre Completo" name="name" value={client.name} onChange={handleChange} required
                color={getFieldColor(validateName(), client.name)}
                focused={client.name !== ""}
                error={client.name === "" || (client.name !== "" && !validateName())}
                helperText={getNameHelperText()}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color={getFieldColor(validateName(), client.name)} /></InputAdornment> }}
                sx={{...autofillStyles}}
              />
            </Grid>

            {/* RUT */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="RUT" name="rut" value={client.rut} onChange={handleChange} required
                color={getFieldColor(validateRut(), client.rut)}
                focused={client.rut !== ""}
                error={(client.rut !== "" && !validateRut()) || client.rut === ""}
                helperText={getRutHelperText()}
                placeholder="12.345.678-9"
                InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon color={getFieldColor(validateRut(), client.rut)} /></InputAdornment> }}
                sx={{...autofillStyles}}
              />
            </Grid>

            {/* Teléfono */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Teléfono" name="phone" value={client.phone} onChange={handleChange} required
                color={getFieldColor(validatePhone(), client.phone)}
                focused={client.phone !== ""}
                error={client.phone === "" || !validatePhone()}
                helperText={getPhoneHelperText()}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon color={getFieldColor(validatePhone(), client.phone)} /></InputAdornment> }}
                sx={{...autofillStyles}}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Email" name="email" value={client.email} onChange={handleChange} required
                color={getFieldColor(validateEmail(), client.email)}
                focused={client.email !== ""}
                error={client.email === "" || !validateEmail()}
                helperText={getEmailHelperText()}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color={getFieldColor(validateEmail(), client.email)} /></InputAdornment> }}
                sx={{...autofillStyles}}
              />
            </Grid>

            {/* Botones */}
            <Grid item xs={12}>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 4 }}>
                <Button
                  type="submit" variant="contained" color="primary"
                  disabled={isFormInvalid || loading} sx={{ px: 5, py: 1.5 }}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  Guardar Cliente
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

export default AddClient;
import React, { useEffect, useState } from "react";
import TariffService from "../services/tariff.service";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";
import { 
  Box, Typography, TextField, Button, Paper, Grid, 
  InputAdornment, Snackbar, Alert, CircularProgress 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentsIcon from '@mui/icons-material/Payments';
import GavelIcon from '@mui/icons-material/Gavel';
import BuildIcon from '@mui/icons-material/Build';

function TariffManager() {
  const [tariffs, setTariffs] = useState({
    dailyRentFee: 0,
    dailyLateFee: 0,
    repairFee: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notificacion, setNotificacion] = useState({ open: false, text: '', severity: 'info' });

  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();
  const isAdmin = initialized && keycloak?.authenticated && keycloak.hasRealmRole("ADMIN"); 

  const loadTariffs = () => {
    setLoading(true);
    TariffService.getTariff()
      .then(response => {
        setTariffs({
          dailyRentFee: response.data.dailyRentFee ?? 0,
          dailyLateFee: response.data.dailyLateFee ?? 0,
          repairFee: response.data.repairFee ?? 0,
        });
      })
      .catch(() => showMsg("Error al cargar las tarifas.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) loadTariffs();
  }, [isAdmin]);

  const showMsg = (text, severity = "info") => setNotificacion({ open: true, text, severity });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Mantenemos Number.parseInt para cumplir con la regla S7773
    const numericValue = value === "" ? "" : Number.parseInt(value, 10);
    setTariffs({ ...tariffs, [name]: numericValue });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showMsg("Guardando cambios...", "info");
    
    TariffService.updateTariff(tariffs)
      .then(() => {
        showMsg("Tarifas actualizadas correctamente.", "success");
        loadTariffs();
      })
      .catch((err) => showMsg(`Error al actualizar: ${err.message}`, "error"));
  };

  // CORRECCIÓN SONAR: Validación robusta que evita el chequeo "siempre falso"
  // Comprobamos si es un string vacío o si el resultado del parseo es NaN
  const isFormInvalid = Object.values(tariffs).some(val => 
    val == "" || val == null || val == undefined || Number.isNaN(val)
  );

  if (!initialized || loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
      <Snackbar 
        open={notificacion.open} 
        autoHideDuration={4000} 
        onClose={() => setNotificacion({ ...notificacion, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={notificacion.severity} variant="filled">{notificacion.text}</Alert>
      </Snackbar>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Configuración de Tarifas</Typography>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={4}>
            {[
              { name: "dailyRentFee", label: "Tarifa Diaria de Arriendo", icon: <PaymentsIcon color="primary" /> },
              { name: "dailyLateFee", label: "Multa Diaria por Atraso", icon: <GavelIcon color="error" /> },
              { name: "repairFee", label: "Cargo Reparación Leve", icon: <BuildIcon color="warning" /> }
            ].map((field) => (
              <Grid item xs={12} md={6} key={field.name}>
                <TextField
                  fullWidth
                  label={field.label}
                  name={field.name}
                  type="number"
                  value={tariffs[field.name]}
                  onChange={handleChange}
                  required
                  // Coherencia visual con la lógica de validación
                  error={tariffs[field.name] === "" || Number.isNaN(tariffs[field.name])}
                  helperText={tariffs[field.name] === "" ? "Ingrese valor" : ""}
                  sx={{
                    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": { display: "none" },
                    "& input[type=number]": { MozAppearance: "textfield" }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {field.icon}
                        <Typography sx={{ ml: 1, fontWeight: 'bold', color: 'text.secondary' }}>$</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            ))}

            <Grid item xs={12}>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isFormInvalid}
                  sx={{ px: 4 }}
                >
                  Guardar Configuración
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate("/")}
                  sx={{ px: 4 }}
                >
                  Cancelar Modificación
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default TariffManager;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";

// Componentes
import Header from "./components/Header";
import ToolList from "./components/ToolList";
import AddTool from "./components/AddTool";
import LoanList from "./components/LoanList";
import AddLoan from "./components/AddLoan";
import ReturnLoan from "./components/ReturnLoan";
import ClientList from "./components/ClientList";
import TariffManager from "./components/TariffManager";
import ReportViewer from "./components/ReportViewer";
import EditTool from "./components/EditTool";
import AddClient from "./components/AddClient"; 
import EditClient from "./components/EditClient";
import KardexViewer from "./components/KardexViewer";

// Material UI
import { Container, CssBaseline, Box, Typography, Paper, CircularProgress, Button } from '@mui/material';

// Utilidad de verificación de roles integrada
const hasRequiredRole = (keycloak, roles) => {
  if (!keycloak?.tokenParsed) return false;
  const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];
  const resourceRoles = keycloak.tokenParsed.resource_access?.['toolrent-client']?.roles || [];
  const allRoles = [...realmRoles, ...resourceRoles].map(r => r.toUpperCase());
  
  return roles.some(role => allRoles.includes(role.toUpperCase()));
};

// Componente de Ruta Protegida (Heurística #1: Visibilidad del estado)
function RequireAuth({ children, roles }) {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Cargando sesión segura...</Typography>
      </Box>
    );
  }

  if (!keycloak?.authenticated) {
    return <Navigate to="/" replace />;
  }
  // Necesario?
  if (roles && roles.length > 0) {
    if (!hasRequiredRole(keycloak, roles)) {
      return (
        <Container maxWidth="md" sx={{ mt: 5 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderTop: '5px solid #d32f2f' }}>
            <Typography variant="h5" color="error" gutterBottom>Acceso Restringido</Typography>
            <Typography variant="body1">
              Tu cuenta no tiene los permisos suficientes para acceder a esta sección.
              <br />Roles requeridos: <strong>{roles.join(", ")}</strong>
            </Typography>
            <Button variant="outlined" component={Link} to="/" sx={{ mt: 3 }}>Volver al Inicio</Button>
          </Paper>
        </Container>
      );
    }
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa' // Fondo gris muy claro para mejor contraste (Heurística #8)
      }}>
        
        {/* Header único: Elimina la barra blanca antigua al no llamar más a <Menu /> */}
        <Header />

        <Container maxWidth="lg" sx={{ mt: 3, mb: 6, flexGrow: 1 }}>
          <Routes>
            {/* Página de Bienvenida (Heurística #4) */}
            <Route path="/" element={
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Paper elevation={0} sx={{ p: 5, backgroundColor: 'transparent' }}>
                  <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    ToolRent
                  </Typography>
                  <Typography variant="h5" color="textSecondary" sx={{ mb: 4 }}>
                    Sistema Profesional de Gestión y Préstamo de Herramientas
                  </Typography>
                  <Typography variant="body1">
                    Utiliza la barra de navegación superior para gestionar el inventario, clientes y préstamos.
                  </Typography>
                </Paper>
              </Box>
            } />

            {/* --- Módulo de Herramientas --- */}
            <Route path="/tools" element={<RequireAuth><ToolList /></RequireAuth>} />
            <Route path="/tools/add" element={<RequireAuth roles={["ADMIN","USER"]}><AddTool /></RequireAuth>} />
            <Route path="/tools/edit/:id" element={<RequireAuth roles={["ADMIN"]}><EditTool /></RequireAuth>} />

            {/* --- Módulo de Préstamos --- */}
            <Route path="/loans" element={<RequireAuth><LoanList /></RequireAuth>} />
            <Route path="/loans/add" element={<RequireAuth roles={["ADMIN","USER"]}><AddLoan /></RequireAuth>} />
            <Route path="/loans/return/:id" element={<RequireAuth roles={["ADMIN", "USER"]}><ReturnLoan /></RequireAuth>} />

            {/* --- Módulo de Clientes --- */}
            <Route path="/clients" element={<RequireAuth roles={["ADMIN"]}><ClientList /></RequireAuth>} />
            <Route path="/clients/add" element={<RequireAuth roles={["ADMIN"]}><AddClient /></RequireAuth>} />
            <Route path="/clients/edit/:id" element={<RequireAuth roles={["ADMIN"]}><EditClient /></RequireAuth>} />
            
            {/* --- Administración y Reportes --- */}
            <Route path="/tariffs" element={<RequireAuth roles={["ADMIN"]}><TariffManager /></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth roles={["ADMIN","USER"]}><ReportViewer /></RequireAuth>} />
            <Route path="/kardex" element={<RequireAuth roles={["ADMIN", "USER"]}><KardexViewer /></RequireAuth>} />

            {/* Error 404 (Heurística #9: Ayudar a recuperarse de errores) */}
            <Route path="*" element={
              <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography variant="h4" gutterBottom>404 - Página no encontrada</Typography>
                <Button variant="contained" component={Link} to="/">Ir al Inicio</Button>
              </Box>
            } />
          </Routes>
        </Container>

        {/* Footer simple para consistencia visual (Heurística #4) */}
        <Box component="footer" sx={{ py: 3, textAlign: 'center', backgroundColor: '#fff', borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="textSecondary">
            © 2026 Sistema de Gestión de Herramientas - Evaluación 3
          </Typography>
        </Box>
      </Box>
    </Router>
  );
}
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, Chip, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';
import { useKeycloak } from "@react-keycloak/web";
import ConstructionIcon from '@mui/icons-material/Construction';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Header = () => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return null;

  const isAuth = !!keycloak?.authenticated;
  const token = isAuth ? keycloak.tokenParsed : null;
  const username = token?.preferred_username ?? "Invitado";
  const roles = Array.isArray(token?.realm_access?.roles) ? token.realm_access.roles : [];
  const isAdmin = roles.includes("ADMIN");

  return (
    <AppBar 
      position="sticky" // Cambiado a sticky para que siempre esté visible al hacer scroll
      sx={{ 
        mb: 4, 
        backgroundColor: '#1976d2',
        minHeight: '64px', // Altura fija estándar de Material UI para PC
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="lg"> {/* 'lg' asegura un ancho máximo fijo y centrado en pantallas grandes */}
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
          
          {/* SECCIÓN IZQUIERDA: Logo y Nombre */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ConstructionIcon sx={{ mr: 1 }} />
            <Typography
              variant="h6"
              noWrap
              sx={{ 
                fontWeight: 700, 
                fontSize: '1.1rem', // Tamaño de fuente prudente
                letterSpacing: '.05rem',
                textTransform: 'uppercase'
              }}
            >
              TOOLRENT
            </Typography>
          </Box>

          {/* SECCIÓN CENTRAL: Navegación con espaciado fijo */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'nowrap' }}>
            <Button color="inherit" component={Link} to="/tools" sx={{ fontSize: '0.85rem', px: 1.5 }}>Herramientas</Button>
            <Button color="inherit" component={Link} to="/loans" sx={{ fontSize: '0.85rem', px: 1.5 }}>Préstamos</Button>
            <Button color="inherit" component={Link} to="/clients" sx={{ fontSize: '0.85rem', px: 1.5 }}>Clientes</Button>
            <Button color="inherit" component={Link} to="/reports" sx={{ fontSize: '0.85rem', px: 1.5 }}>Reportes</Button>
            <Button color="inherit" component={Link} to="/kardex" sx={{ fontSize: '0.85rem', px: 1.5 }}>Kardex</Button>
            
            {isAdmin && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button color="inherit" component={Link} to="/tariffs" sx={{ fontSize: '0.85rem', px: 1.5 }}>Tarifas</Button>
              </Box>
            )}
          </Box>

          {/* SECCIÓN DERECHA: Usuario y Logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Tooltip title={`Roles: ${roles.join(', ')}`}>
              <Chip 
                icon={<AccountCircleIcon style={{ color: 'white' }} />}
                label={username}
                variant="outlined"
                size="small"
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.5)',
                  maxWidth: '150px' // Evita que nombres muy largos deformen la barra
                }}
              />
            </Tooltip>

            <Button 
              variant="contained" 
              color="error" // Rojo para Logout mejora la legibilidad de la acción
              size="small"
              sx={{ fontWeight: 'bold' }}
              onClick={() => isAuth ? keycloak.logout() : keycloak.login()}
            >
              {isAuth ? "Salir" : "Entrar"}
            </Button>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import App from './App.jsx'
import './index.css'
import keycloak from './services/keycloak'
import { CircularProgress, Box, Typography } from '@mui/material'

const root = ReactDOM.createRoot(document.getElementById('root'))

const initOptions = {
    onLoad: 'login-required',
    checkLoginIframe: false,
    pkceMethod: 'S256'
}

// Pantalla de carga profesional (Heurística #1)
const LoadingScreen = () => (
    <Box sx={{ 
        display: 'flex', flexDirection: 'column', justifyContent: 'center', 
        alignItems: 'center', height: '100vh', bgcolor: '#f5f5f7' 
    }}>
        <CircularProgress size={50} sx={{ color: '#1976d2' }} />
        <Typography sx={{ mt: 2, fontWeight: '500', color: '#1a237e' }}>
            Sincronizando con ToolRent...
        </Typography>
    </Box>
)

root.render(
    <ReactKeycloakProvider 
        authClient={keycloak} 
        initOptions={initOptions}
        LoadingComponent={<LoadingScreen />}
    >
        <App />
    </ReactKeycloakProvider>
)
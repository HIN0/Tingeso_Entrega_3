import React from 'react'
import ReactDOM from 'react-dom/client'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import App from './App.jsx'
import './index.css'
import keycloak from './services/keycloak'

const root = ReactDOM.createRoot(document.getElementById('root'))

const initOptions = {
    onLoad: 'login-required',
    checkLoginIframe: false,
    pkceMethod: 'S256'
}

root.render(
  // Quitamos React.StrictMode para evitar la doble inicialización de Keycloak
    <ReactKeycloakProvider 
    authClient={keycloak} 
    initOptions={initOptions}
    onEvent={(event, error) => {
    console.log('Keycloak Event:', event, error)
    }}
    >
        <App />
    </ReactKeycloakProvider>
)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
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

const checkRole = (keycloak, roleName) => {
  if (!keycloak || !keycloak.tokenParsed) return false;
  
  // 1. Buscar en Realm Roles (Nivel Global)
  const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];
  
  // 2. Buscar en Resource Roles (Nivel Cliente "toolrent-client")
  const resourceRoles = keycloak.tokenParsed.resource_access?.['toolrent-client']?.roles || [];
  
  // Juntamos todo y buscamos ignorando mayúsculas/minúsculas
  const allRoles = [...realmRoles, ...resourceRoles];
  return allRoles.some(r => r.toUpperCase() === roleName.toUpperCase());
};

function RequireAuth({ children, roles }) {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div style={{padding: 20}}>Cargando autenticación...</div>;
  }

  if (!keycloak?.authenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles?.length) {
    const hasPermission = roles.some((r) => checkRole(keycloak, r));
    if (!hasPermission) return <h3 style={{padding:16}}>No autorizado (Faltan roles: {roles.join(", ")})</h3>;
  }
  return children;
}

function Menu() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized || !keycloak?.authenticated) return null;

  // DEBUG: Esto mostrará en la consola del navegador (F12) tus roles exactos
  const myRoles = keycloak.tokenParsed?.realm_access?.roles || [];
  console.log("=== TUS ROLES ===", myRoles);

  const isAdmin = checkRole(keycloak, "ADMIN");
  const isUser = checkRole(keycloak, "USER");

  return (
    <nav style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:"1px solid #eee", background: "#f9f9f9"}}>
      <Link to="/tools">Herramientas</Link>
      
      {isAdmin && <Link to="/tools/add">Agregar herramienta</Link>}
      
      <Link to="/loans">Préstamos</Link>
      
      {isAdmin && <Link to="/clients">Clientes</Link>}
      {isAdmin && <Link to="/tariffs">Tarifas</Link>}
      
      {(isUser || isAdmin) && <Link to="/loans/add">Registrar préstamo</Link>}
      {(isUser || isAdmin) && <Link to="/reports">Reportes</Link>} 
      {(isUser || isAdmin) && <Link to="/kardex">Kardex</Link>}
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <Header />
      <Menu />
      <Routes>
        <Route path="/" element={
          <div style={{ padding: 16 }}>
            <h2>Bienvenido a ToolRent</h2>
            <p>Por favor, selecciona una opción del menú.</p>
          </div>
        } />
        {/* --- Rutas de Herramientas --- */}
        <Route path="/tools" element={<RequireAuth><ToolList /></RequireAuth>} />
        <Route path="/tools/add" element={<RequireAuth roles={["ADMIN"]}><AddTool /></RequireAuth>} />
        <Route path="/tools/edit/:id" element={<RequireAuth roles={["ADMIN"]}><EditTool /></RequireAuth>} />

        {/* --- Rutas de Préstamos --- */}
        <Route path="/loans" element={<RequireAuth><LoanList /></RequireAuth>} />
        <Route path="/loans/add" element={<RequireAuth roles={["ADMIN","USER"]}><AddLoan /></RequireAuth>} />
        <Route path="/loans/return/:id" element={<RequireAuth roles={["ADMIN", "USER"]}><ReturnLoan /></RequireAuth>} />

        {/* --- Rutas de Clientes --- */}
        <Route path="/clients" element={<RequireAuth roles={["ADMIN"]}><ClientList /></RequireAuth>} />
        <Route path="/clients/add" element={<RequireAuth roles={["ADMIN"]}><AddClient /></RequireAuth>} />
        <Route path="/clients/edit/:id" element={<RequireAuth roles={["ADMIN"]}><EditClient /></RequireAuth>} />
        
        {/* --- Rutas de Tarifas, Reportes y Kardex--- */}
        <Route path="/tariffs" element={<RequireAuth roles={["ADMIN"]}><TariffManager /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth roles={["USER","ADMIN"]}><ReportViewer /></RequireAuth>} />
        <Route path="/kardex" element={<RequireAuth roles={["ADMIN", "USER"]}><KardexViewer /></RequireAuth>} />

        {/* fallback */}
        <Route path="*" element={
            <div style={{ padding: 16 }}>
                <h2>Página no encontrada</h2>
                <Link to="/">Volver al inicio</Link>
            </div>
        } />
      </Routes>
    </Router>
  );
}
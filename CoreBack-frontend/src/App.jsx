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

function RequireAuth({ children, roles }) {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) return null;
  if (!keycloak?.authenticated) return <Navigate to="/" replace />;

  if (roles?.length) {
    const hasRole = roles.some((r) => keycloak.hasRealmRole(r));
    if (!hasRole) return <h3 style={{padding:16}}>No autorizado</h3>;
  }
  return children;
}

function Menu() {
  const { keycloak } = useKeycloak();
  const isAuth = !!keycloak?.authenticated;
  const isAdmin = isAuth && keycloak.hasRealmRole("ADMIN");
  const isUser = isAuth && keycloak.hasRealmRole("USER");

  return (
    <nav style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:"1px solid #eee"}}>
      <Link to="/tools">Herramientas</Link>
      {(isAdmin) && <Link to="/tools/add">Agregar herramienta</Link>}
      <Link to="/loans">Préstamos</Link>
      {(isAdmin) && <Link to="/clients">Clientes</Link>}
      {(isAdmin) && <Link to="/tariffs">Tarifas</Link>}
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

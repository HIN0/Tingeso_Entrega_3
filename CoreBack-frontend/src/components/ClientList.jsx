import React, { useEffect, useState } from "react";
import ClientService from "../services/client.service";
import LoanService from "../services/loan.service";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Typography, Button, Chip, Box, IconButton, Tooltip, Collapse, Snackbar, Alert,
  CircularProgress, Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentsIcon from '@mui/icons-material/Payments';

// Subcomponente de Deudas (Heurística #1 y #4)
function DebtDetails({ clientId, messageSetter }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDebts = () => {
    setLoading(true);
    LoanService.getUnpaidLoansByClient(clientId)
      .then(response => {
        setDebts(response.data);
        if (response.data.length === 0) setErrorMessage("No hay deudas pendientes.");
      })
      .catch(e => setErrorMessage(`Error: ${e.response?.data?.message || e.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDebts(); }, [clientId]);

  const handlePay = (loanId) => {
    if (!window.confirm(`¿Marcar la deuda del préstamo #${loanId} como pagada?`)) return;
    messageSetter(`Procesando pago...`);
    LoanService.markAsPaid(loanId)
      .then(() => {
        messageSetter(`Pago registrado con éxito.`);
        loadDebts();
      })
      .catch(e => messageSetter(`Error al pagar: ${e.response?.data?.message || e.message}`));
  };

  if (loading) return <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>;

  return (
    <Box sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1, border: '1px solid #eee' }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Deudas Pendientes (Estado RECEIVED)
      </Typography>
      {errorMessage && <Alert severity="info" sx={{ mb: 1 }}>{errorMessage}</Alert>}
      {debts.length > 0 && (
        <Table size="small" sx={{ bgcolor: 'white' }}>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Herramienta</TableCell>
              <TableCell>Monto ($)</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell align="center">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {debts.map(loan => (
              <TableRow key={loan.id}>
                <TableCell>{loan.id}</TableCell>
                <TableCell>{loan.tool?.name}</TableCell>
                <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>{loan.totalPenalty.toFixed(0)}</TableCell>
                <TableCell>{loan.dueDate}</TableCell>
                <TableCell align="center">
                  <Button size="small" variant="contained" color="success" startIcon={<PaymentsIcon />} onClick={() => handlePay(loan.id)}>
                    Pagar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

function ClientList() {
  const [clients, setClients] = useState([]);
  const [visibleDebtsClientId, setVisibleDebtsClientId] = useState(null);
  const [notificacion, setNotificacion] = useState({ open: false, text: '', severity: 'info' });
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();

  const isAdmin = initialized && keycloak?.authenticated && keycloak.hasRealmRole("ADMIN");
  const isEmployee = initialized && keycloak?.authenticated && keycloak.hasRealmRole("USER");

  const loadClients = () => {
    ClientService.getAll().then(res => setClients(res.data)).catch(() => showMsg("Error al cargar clientes", "error"));
  };

  const showMsg = (text, severity = "info") => setNotificacion({ open: true, text, severity });

  useEffect(() => { if (isAdmin || isEmployee) loadClients(); }, [isAdmin, isEmployee]);

  const handleUpdateStatus = (id, currentStatus, name) => {
    if (currentStatus === "ACTIVE") {
      if (window.confirm(`¿Restringir al cliente ${name}?`)) {
        ClientService.updateStatus(id, "RESTRICTED").then(loadClients).catch(e => showMsg(e.response?.data?.message, "error"));
      }
    } else {
      if (window.confirm(`¿Intentar reactivar a ${name}? Se verificará solvencia.`)) {
        ClientService.attemptReactivation(id)
          .then(res => {
            showMsg(`Estado final: ${res.data.status}`, "success");
            loadClients();
          })
          .catch(e => showMsg(e.response?.data?.message, "error"));
      }
    }
  };

  return (
    <Box>
      <Snackbar open={notificacion.open} autoHideDuration={5000} onClose={() => setNotificacion({ ...notificacion, open: false })}>
        <Alert severity={notificacion.severity} variant="filled">{notificacion.text}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestión de Clientes</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => navigate("/clients/add")}>
            Registrar Cliente
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: '#1976d2' }}>
            <TableRow>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>RUT</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients
              .slice() // Crea una copia para no mutar el estado original
              .sort((a, b) => {
              // 1. Ordenar por Estado (Prioridad: ACTIVE > RESTRICTED)
                if (a.status !== b.status) {
                  return a.status === 'ACTIVE' ? -1 : 1;
              }
              // 2. Si el estado es el mismo, ordenar por ID (Ascendente)
              return a.id - b.id;
              })
            .map(client => (
              <React.Fragment key={client.id}>
                <TableRow hover>
                  <TableCell align="center">{client.id}</TableCell>
                  <TableCell align="center">{client.rut}</TableCell>
                  <TableCell align="center">{client.name}</TableCell>
                  <TableCell align="center">
                    <Chip label={client.status} color={client.status === 'ACTIVE' ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      {isAdmin && (
                        <>
                          <Tooltip title="Editar"><IconButton color="primary" onClick={() => navigate(`/clients/edit/${client.id}`)}><EditIcon /></IconButton></Tooltip>
                          <Tooltip title={client.status === 'ACTIVE' ? 'Restringir' : 'Activar (Verificar)'}>
                            <IconButton color={client.status === 'ACTIVE' ? 'error' : 'success'} onClick={() => handleUpdateStatus(client.id, client.status, client.name)}>
                              {client.status === 'ACTIVE' ? <BlockIcon /> : <CheckCircleIcon />}
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {(isAdmin || isEmployee) && client.status === 'RESTRICTED' && (
                        <Tooltip title={visibleDebtsClientId === client.id ? 'Ocultar Deudas' : 'Ver Deudas'}>
                          <IconButton color="secondary" onClick={() => setVisibleDebtsClientId(visibleDebtsClientId === client.id ? null : client.id)}>
                            {visibleDebtsClientId === client.id ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={visibleDebtsClientId === client.id} timeout="auto" unmountOnExit>
                      <DebtDetails clientId={client.id} messageSetter={(t) => showMsg(t, "info")} />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default ClientList;
import React, { useEffect, useState } from "react";
import ClientService from "../services/client.service";
import LoanService from "../services/loan.service";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Typography, Button, Chip, Box, IconButton, Tooltip, Collapse, Snackbar, Alert,
  CircularProgress, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, 
  DialogActions, Zoom, TextField, InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentsIcon from '@mui/icons-material/Payments';
import SearchIcon from '@mui/icons-material/Search';

// Subcomponente de Deudas Modernizado (Heurística #1 y #4)
function DebtDetails({ clientId, messageSetter }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmPay, setConfirmPay] = useState({ open: false, loanId: null });

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

  const handlePay = () => {
    messageSetter(`Procesando pago...`);
    LoanService.markAsPaid(confirmPay.loanId)
      .then(() => {
        messageSetter(`Pago registrado con éxito.`);
        setConfirmPay({ open: false, loanId: null });
        loadDebts();
      })
      .catch(e => messageSetter(`Error al pagar: ${e.response?.data?.message || e.message}`));
  };

  if (loading) return <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>;

  return (
    <Box sx={{ p: 3, bgcolor: '#f9f9f9', borderRadius: 2, mb: 2, border: '1px solid #ddd', mx: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#555' }}>
        DEUDAS PENDIENTES (PRÉSTAMOS RECIBIDOS CON CARGOS)
      </Typography>
      {errorMessage && <Alert severity="info" sx={{ mb: 1 }}>{errorMessage}</Alert>}
      {debts.length > 0 && (
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#eee' }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Herramienta</TableCell>
                <TableCell>Monto Multa ($)</TableCell>
                <TableCell>Vencimiento Original</TableCell>
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
                    <Button 
                      size="small" variant="contained" color="success" 
                      onClick={() => setConfirmPay({ open: true, loanId: loan.id })}
                      startIcon={<PaymentsIcon />}
                    >
                      Pagar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={confirmPay.open} onClose={() => setConfirmPay({ open: false, loanId: null })}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Confirmar Pago</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Desea marcar la deuda del préstamo #{confirmPay.loanId} como pagada en el sistema?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmPay({ open: false, loanId: null })}>Cancelar</Button>
          <Button onClick={handlePay} variant="contained" color="success">Confirmar Pago</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ClientList() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el filtro
  const [loading, setLoading] = useState(true);
  const [visibleDebtsClientId, setVisibleDebtsClientId] = useState(null);
  const [notificacion, setNotificacion] = useState({ open: false, text: '', severity: 'info' });
  const [confirmStatus, setConfirmStatus] = useState({ open: false, id: null, status: null, name: '' });
  
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();

  const isAdmin = initialized && keycloak?.authenticated && keycloak.hasRealmRole("ADMIN");
  const isEmployee = initialized && keycloak?.authenticated && keycloak.hasRealmRole("USER");

  const loadClients = () => {
    setLoading(true);
    ClientService.getAll()
      .then(res => setClients(res.data))
      .catch(() => showMsg("Error al cargar clientes", "error"))
      .finally(() => setLoading(false));
  };

  const showMsg = (text, severity = "info") => setNotificacion({ open: true, text, severity });

  useEffect(() => { if (isAdmin || isEmployee) loadClients(); }, [isAdmin, isEmployee]);

  // Lógica de filtrado dinámico (Heurística #7)
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExecuteStatusUpdate = () => {
    const { id, status, name } = confirmStatus;
    if (status === "ACTIVE") {
      ClientService.updateStatus(id, "RESTRICTED")
        .then(() => {
          showMsg(`${name} ha sido restringido exitosamente.`, "warning");
          loadClients();
        })
        .catch(e => showMsg(e.response?.data?.message, "error"))
        .finally(() => setConfirmStatus({ ...confirmStatus, open: false }));
    } else {
      ClientService.attemptReactivation(id)
        .then(res => {
          showMsg(`Resultado de reactivación: ${res.data.status}`, "success");
          loadClients();
        })
        .catch(e => showMsg(e.response?.data?.message, "error"))
        .finally(() => setConfirmStatus({ ...confirmStatus, open: false }));
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Snackbar open={notificacion.open} autoHideDuration={5000} onClose={() => setNotificacion({ ...notificacion, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={notificacion.severity} variant="filled" sx={{ width: '100%' }}>{notificacion.text}</Alert>
      </Snackbar>

      <Dialog open={confirmStatus.open} onClose={() => setConfirmStatus({ ...confirmStatus, open: false })} TransitionComponent={Zoom}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Cambio de Estado Administrativo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmStatus.status === 'ACTIVE' 
              ? `¿Está seguro de restringir a ${confirmStatus.name}? No podrá realizar nuevos préstamos hasta ser reactivado.`
              : `Se verificará si ${confirmStatus.name} posee deudas pendientes antes de reactivarlo. ¿Continuar?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmStatus({ ...confirmStatus, open: false })} variant="outlined">Cancelar</Button>
          <Button onClick={handleExecuteStatusUpdate} variant="contained" color={confirmStatus.status === 'ACTIVE' ? "error" : "success"}>
            {confirmStatus.status === 'ACTIVE' ? "Confirmar Restricción" : "Confirmar Reactivación"}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Gestión de Clientes</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, justifyContent: 'flex-end' }}>
          
          {/* BUSCADOR DINÁMICO (Heurística #7) */}
          <TextField 
            placeholder="Buscar por nombre o RUT..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', md: '400px' }, bgcolor: 'white' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {isAdmin && (
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => navigate("/clients/add")} sx={{ borderRadius: 2, px: 3 }}>
              Registrar Cliente
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1976d2' }}>
            <TableRow>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>RUT</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Nombre Completo</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Teléfono</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Correo Electrónico</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}><CircularProgress /><Typography sx={{ mt: 2 }}>Cargando base de datos...</Typography></TableCell></TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Alert severity="info" variant="outlined" sx={{ justifyContent: 'center' }}>
                    No se encontraron clientes que coincidan con "{searchTerm}"
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              filteredClients
                .slice()
                .sort((a, b) => a.status === b.status ? a.id - b.id : (a.status === 'ACTIVE' ? -1 : 1))
                .map(client => (
                  <React.Fragment key={client.id}>
                    <TableRow hover>
                      <TableCell align="center">{client.id}</TableCell>
                      <TableCell align="center">{client.rut}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'medium' }}>{client.name}</TableCell>
                      <TableCell align="center">{client.phone}</TableCell>
                      <TableCell align="center">{client.email}</TableCell>
                      <TableCell align="center">
                        <Chip label={client.status} color={client.status === 'ACTIVE' ? 'success' : 'error'} sx={{ fontWeight: 'bold', minWidth: '100px' }} />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          {isAdmin && (
                            <>
                              <Tooltip title="Editar Perfil"><IconButton color="primary" onClick={() => navigate(`/clients/edit/${client.id}`)} sx={{ bgcolor: '#e3f2fd' }}><EditIcon /></IconButton></Tooltip>
                              <Tooltip title={client.status === 'ACTIVE' ? 'Restringir Cliente' : 'Intentar Reactivación'}>
                                <IconButton 
                                  color={client.status === 'ACTIVE' ? 'error' : 'success'} 
                                  sx={{ bgcolor: client.status === 'ACTIVE' ? '#ffebee' : '#e8f5e9' }}
                                  onClick={() => setConfirmStatus({ open: true, id: client.id, status: client.status, name: client.name })}
                                >
                                  {client.status === 'ACTIVE' ? <BlockIcon /> : <CheckCircleIcon />}
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {(isAdmin || isEmployee) && client.status === 'RESTRICTED' && (
                            <Tooltip title={visibleDebtsClientId === client.id ? 'Cerrar Panel de Deudas' : 'Ver Deudas Pendientes'}>
                              <IconButton color="secondary" sx={{ bgcolor: '#f3e5f5' }} onClick={() => setVisibleDebtsClientId(visibleDebtsClientId === client.id ? null : client.id)}>
                                {visibleDebtsClientId === client.id ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ p: 0 }} colSpan={7}>
                        <Collapse in={visibleDebtsClientId === client.id} timeout="auto" unmountOnExit>
                          <DebtDetails clientId={client.id} messageSetter={(t) => showMsg(t, "info")} />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default ClientList;
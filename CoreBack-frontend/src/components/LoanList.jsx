import React, { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import LoanService from "../services/loan.service";
import { useNavigate } from "react-router-dom";
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Button, Chip, Box, IconButton, Tooltip, CircularProgress, Alert 
} from '@mui/material';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HistoryIcon from '@mui/icons-material/History';

function LoanList() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();
  
  const isAuth = !!keycloak?.authenticated;
  const isAdmin = isAuth && keycloak.hasRealmRole("ADMIN");
  const isUser = isAuth && keycloak.hasRealmRole("USER");

  const loadLoans = () => {
    setLoading(true);
    LoanService.getAll()
      .then(response => {
        setLoans(Array.isArray(response.data) ? response.data : []);
      })
      .catch(e => {
        console.error("Error fetching loans:", e);
        setLoans([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialized && isAuth) loadLoans();
  }, [initialized, isAuth]);

  // Heurística #4: Mapeo de estados con colores semánticos
  const getStatusChip = (status) => {
    const config = {
      'LATE': { color: 'error', label: 'ATRASADO' },
      'ACTIVE': { color: 'primary', label: 'ACTIVO' },
      'RETURNED': { color: 'success', label: 'DEVUELTO' },
      'RECEIVED': { color: 'warning', label: 'RECIBIDO' }
    };
    const { color, label } = config[status] || { color: 'default', label: status };
    return <Chip label={label} color={color} size="small" variant="filled" sx={{ fontWeight: 'bold' }} />;
  };

  if (!initialized || loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestión de Préstamos</Typography>
        {(isAdmin || isUser) && (
          <Button 
            variant="contained" 
            startIcon={<AddCircleOutlineIcon />} 
            onClick={() => navigate("/loans/add")}
            sx={{ borderRadius: 2 }}
          >
            Nuevo Préstamo
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#1976d2' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cliente</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Herramienta</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Inicio</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Vencimiento</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loans
              .slice()
              .sort((a, b) => {
                // Heurística #1: Priorizar LATE arriba
                if (a.status === 'LATE' && b.status !== 'LATE') return -1;
                if (a.status !== 'LATE' && b.status === 'LATE') return 1;
                return b.id - a.id; // Luego por ID descendente
              })
              .map((loan) => (
                <TableRow key={loan.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>{loan.id}</TableCell>
                  <TableCell sx={{ fontWeight: 'medium' }}>{loan.client?.name}</TableCell>
                  <TableCell>{loan.tool?.name}</TableCell>
                  <TableCell>{loan.startDate}</TableCell>
                  <TableCell>{loan.dueDate}</TableCell>
                  <TableCell>{getStatusChip(loan.status)}</TableCell>
                  <TableCell align="center">
                    {(isAdmin || isUser) && (loan.status === "ACTIVE" || loan.status === "LATE") ? (
                      <Tooltip title="Registrar Devolución">
                        <IconButton 
                          color="primary" 
                          onClick={() => navigate(`/loans/return/${loan.id}`)}
                        >
                          <AssignmentReturnIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Sin acciones pendientes">
                        <IconButton disabled><HistoryIcon /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {loans.length === 0 && (
          <Box sx={{ p: 3 }}>
            <Alert severity="info">No se encontraron préstamos registrados.</Alert>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
}

export default LoanList;
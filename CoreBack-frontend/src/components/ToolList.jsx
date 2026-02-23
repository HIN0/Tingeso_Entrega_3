import React, { useEffect, useState } from 'react';
import ToolService from '../services/tool.service';
import { 
Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
Paper, Typography, Button, Chip, Box, IconButton, Tooltip, 
TextField, Snackbar, Alert, Divider, Dialog, DialogActions, 
DialogContent, DialogContentText, DialogTitle, Zoom
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from "@react-keycloak/web";

const ToolList = () => {
const [activeTools, setActiveTools] = useState([]);
const [decommissionedTools, setDecommissionedTools] = useState([]);
const [error, setError] = useState({ open: false, text: '', severity: 'error' });
const [adjustment, setAdjustment] = useState({ id: null, quantity: 1, type: null });

// ESTADO PARA EL DIÁLOGO DE CONFIRMACIÓN (Heurística #5)
const [confirmOpen, setConfirmOpen] = useState(false);
const [toolToDecommission, setToolToDecommission] = useState(null);

const navigate = useNavigate();
const { keycloak, initialized } = useKeycloak();
const isAdmin = initialized && keycloak?.authenticated && keycloak.hasRealmRole("ADMIN");

const loadTools = () => {
    ToolService.getAll()
    .then(response => {
        const allTools = response.data;
        setDecommissionedTools(allTools.filter(t => t.status === 'DECOMMISSIONED'));
        setActiveTools(allTools.filter(t => t.status !== 'DECOMMISSIONED'));
    })
    .catch(e => {
        console.error(e);
        setError({ open: true, text: 'Error al cargar herramientas', severity: 'error' });
    });
};

useEffect(() => {
    if (initialized && keycloak.authenticated) {
    loadTools();
    }
}, [initialized, keycloak.authenticated]);

// Apertura del diálogo amigable
const openDecommissionDialog = (tool) => {
    setToolToDecommission(tool);
    setConfirmOpen(true);
};

const handleDecommissionConfirm = () => {
    if (!toolToDecommission) return;
    
    ToolService.decommission(toolToDecommission.id)
    .then(() => {
        setError({ open: true, text: `"${toolToDecommission.name}" dada de baja con éxito`, severity: 'success' });
        setConfirmOpen(false);
        loadTools();
    })
    .catch(e => {
        const msg = e.response?.data?.message || "No se pudo dar de baja";
        setError({ open: true, text: `Error: ${msg}`, severity: 'error' });
        setConfirmOpen(false);
    });
};

const applyStockAdjustment = () => {
    const quantityChange = adjustment.type === 'INCREASE' ? adjustment.quantity : -adjustment.quantity;
    ToolService.adjustStock(adjustment.id, { quantityChange })
    .then(() => {
        setAdjustment({ id: null, quantity: 1, type: null });
        loadTools();
    })
    .catch(e => {
        setError({ open: true, text: 'Error al ajustar stock', severity: 'error' });
    });
};

const getStatusChip = (status) => {
    const colors = { 'AVAILABLE': 'success', 'REPAIRING': 'warning', 'LOANED': 'primary' };
    return <Chip label={status} color={colors[status] || 'default'} size="small" variant="filled" sx={{ fontWeight: 'bold' }} />;
};

return (
    <Box sx={{ p: 4 }}>
    <Snackbar open={error.open} autoHideDuration={4000} onClose={() => setError({ ...error, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={error.severity} variant="filled" sx={{ width: '100%' }}>{error.text}</Alert>
    </Snackbar>

    {/* DIÁLOGO PROFESIONAL (Heurística #5) */}
    <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} TransitionComponent={Zoom}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>¿Confirmar baja de herramienta?</DialogTitle>
        <DialogContent>
        <DialogContentText>
            Esta acción marcará <strong>{toolToDecommission?.name}</strong> como fuera de servicio permanentemente. Esta acción no se puede deshacer.
        </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setConfirmOpen(false)} variant="outlined">Cancelar</Button>
        <Button onClick={handleDecommissionConfirm} color="error" variant="contained" autoFocus>Dar de Baja</Button>
        </DialogActions>
    </Dialog>

    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Inventario de Herramientas</Typography>
        {isAdmin && (
        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => navigate('/tools/add')} sx={{ borderRadius: 2, px: 4 }}>
            Nueva Herramienta
        </Button>
        )}
    </Box>

    <Typography variant="h6" sx={{ color: '#2e7d32', mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, bgcolor: '#2e7d32', borderRadius: '50%' }} />
        HERRAMIENTAS ACTIVAS ({activeTools.length})
    </Typography>

    <TableContainer component={Paper} elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 800 }}>
        <TableHead sx={{ bgcolor: '#f1f8e9' }}>
            <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Stock Total</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>En Reparacion</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Valor Reposición</TableCell>
            {isAdmin && <TableCell align="center" sx={{ fontWeight: 'bold' }}>Operaciones</TableCell>}
            </TableRow>
        </TableHead>
        <TableBody>
            {activeTools
            .slice()
            .sort((a, b) => {
                const statusPriority = { 'AVAILABLE': 1, 'REPAIRING': 2 };
                const priorityA = statusPriority[a.status] || 99;
                const priorityB = statusPriority[b.status] || 99;
                return priorityA !== priorityB ? priorityA - priorityB : a.id - b.id;
            })
            .map(tool => (
            <TableRow key={tool.id} hover>
                <TableCell>{tool.id}</TableCell>
                <TableCell sx={{ fontWeight: 'medium' }}>{tool.name}</TableCell>
                <TableCell><Chip label={tool.category} size="small" variant="outlined" /></TableCell>
                <TableCell>{getStatusChip(tool.status)}</TableCell>
                <TableCell align="center" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{tool.stock}</TableCell>
                <TableCell align="center">{tool.inRepair}</TableCell>
                <TableCell align="center">${tool.replacementValue}</TableCell>
                {isAdmin && (
                <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                    <Tooltip title="Editar"><IconButton size="small" color="primary" sx={{ bgcolor: '#e3f2fd' }} onClick={() => navigate(`/tools/edit/${tool.id}`)}><EditIcon /></IconButton></Tooltip>
                    
                    {adjustment.id === tool.id ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#fff', border: '2px solid #2e7d32', p: 0.8, borderRadius: 2, boxShadow: 2 }}>
                        <TextField
                        type="number" size="small" autoFocus
                        value={adjustment.quantity}
                        onChange={(e) => setAdjustment({...adjustment, quantity: parseInt(e.target.value) || 1})}
                        sx={{ width: 80 }} 
                        inputProps={{ min: 1, style: { textAlign: 'center', fontWeight: 'bold' } }}
                        />
                        <IconButton color="success" onClick={applyStockAdjustment}><CheckIcon /></IconButton>
                        <IconButton color="error" onClick={() => setAdjustment({ id: null, quantity: 1, type: null })}><CloseIcon /></IconButton>
                    </Box>
                    ) : (
                    <>
                        <Tooltip title="Añadir Stock"><IconButton color="success" sx={{ bgcolor: '#e8f5e9' }} onClick={() => setAdjustment({ id: tool.id, quantity: 1, type: 'INCREASE' })}><AddCircleIcon /></IconButton></Tooltip>
                        <Tooltip title="Retirar Stock"><IconButton color="warning" sx={{ bgcolor: '#fff3e0' }} onClick={() => setAdjustment({ id: tool.id, quantity: 1, type: 'DECREASE' })}><RemoveCircleIcon /></IconButton></Tooltip>
                    </>
                    )}

                    <Tooltip title="Eliminar/Baja">
                    <span>
                        <IconButton 
                        color="error" 
                        sx={{ bgcolor: '#ffebee' }}
                        disabled={tool.status === 'LOANED' || tool.status === 'REPAIRING'}
                        onClick={() => openDecommissionDialog(tool)}
                        >
                        <DeleteForeverIcon />
                        </IconButton>
                    </span>
                    </Tooltip>
                </Box>
                </TableCell>
                )}
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </TableContainer>

    <Divider sx={{ my: 6 }} />

    <Typography variant="h6" sx={{ color: '#d32f2f', mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, bgcolor: '#d32f2f', borderRadius: '50%' }} />
        HISTORIAL DE BAJAS ({decommissionedTools.length})
    </Typography>
    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3 }}>
        <Table>
        <TableHead sx={{ bgcolor: '#fafafa' }}>
            <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Nombre de Herramienta</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Costo de Reposición</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {decommissionedTools.map(tool => (
            <TableRow key={tool.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>{tool.id}</TableCell>
                <TableCell color="textSecondary">{tool.name}</TableCell>
                <TableCell>{tool.category}</TableCell>
                <TableCell align="center" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>${tool.replacementValue}</TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </TableContainer>
    </Box>
);
};

export default ToolList;
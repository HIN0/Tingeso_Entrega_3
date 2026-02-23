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
const [adjustment, setAdjustment] = useState({ id: null, quantity: "", type: null });
const [confirmOpen, setConfirmOpen] = useState(false);
const [toolToDecommission, setToolToDecommission] = useState(null);

const navigate = useNavigate();
const { keycloak, initialized } = useKeycloak();
const isAdmin = initialized && keycloak?.authenticated && keycloak.hasRealmRole("ADMIN");
const isUser = initialized && keycloak?.authenticated && keycloak.hasRealmRole("USER");

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
    // CORRECCIÓN SONAR: Uso de Number.parseInt y base decimal
    const parsedQty = Number.parseInt(adjustment.quantity, 10);
    if (adjustment.quantity === "" || parsedQty <= 0) return;

    const quantityChange = adjustment.type === 'INCREASE' ? parsedQty : -parsedQty;
    
    ToolService.adjustStock(adjustment.id, { quantityChange })
    .then(() => {
        const accion = adjustment.type === 'INCREASE' ? 'aumentado' : 'disminuido';
        setError({ open: true, text: `Stock ${accion} exitosamente`, severity: 'success' });
        setAdjustment({ id: null, quantity: "", type: null });
        loadTools();
    })
    .catch(() => {
        setError({ open: true, text: 'Error al ajustar stock', severity: 'error' });
    });
};

const getStatusChip = (status) => {
    const colors = { 'AVAILABLE': 'success', 'REPAIRING': 'warning', 'LOANED': 'primary' };
    return <Chip label={status} color={colors[status] || 'default'} size="small" variant="filled" sx={{ fontWeight: 'bold' }} />;
};

// CORRECCIÓN SONAR: Lógica de colores extraída para evitar ternarios anidados
const getAdjustmentColor = () => adjustment.type === 'INCREASE' ? '#2e7d32' : '#ed6c02';
const getAdjustmentLabel = () => adjustment.type === 'INCREASE' ? 'Aumentando stock' : 'Disminuyendo stock';

return (
    <Box sx={{ p: 4 }}>
    <Snackbar open={error.open} autoHideDuration={4000} onClose={() => setError({ ...error, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={error.severity} variant="filled" sx={{ width: '100%' }}>{error.text}</Alert>
    </Snackbar>

    <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} TransitionComponent={Zoom}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>¿Confirmar baja de herramienta?</DialogTitle>
        <DialogContent>
        <DialogContentText>
            Esta acción marcará <strong>{toolToDecommission?.name}</strong> como fuera de servicio permanentemente.
        </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setConfirmOpen(false)} variant="outlined">Cancelar</Button>
        <Button onClick={handleDecommissionConfirm} color="error" variant="contained">Dar de Baja</Button>
        </DialogActions>
    </Dialog>

    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a237e' }}>Inventario de Herramientas</Typography>
        {(isAdmin || isUser) && (
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
            <TableCell align='center' sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
            <TableCell align='center' sx={{ fontWeight: 'bold' }}>Estado</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Stock Total</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>En Reparación</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Valor Reposición</TableCell>
            {isAdmin && <TableCell align="center" sx={{ fontWeight: 'bold' }}>Operaciones</TableCell>}
            </TableRow>
        </TableHead>
        <TableBody>
            {activeTools
            .slice()
            .sort((a, b) => {
                // CORRECCIÓN SONAR: Lógica de ordenación aplanada
                const statusPriority = { 'AVAILABLE': 1, 'REPAIRING': 2 };
                const priorityA = statusPriority[a.status] || 99;
                const priorityB = statusPriority[b.status] || 99;
                if (priorityA !== priorityB) return priorityA - priorityB;
                return a.id - b.id;
            })
            .map(tool => (
                <TableRow key={tool.id} hover>
                <TableCell>{tool.id}</TableCell>
                <TableCell sx={{ fontWeight: 'medium' }}>{tool.name}</TableCell>
                <TableCell align="center"><Chip label={tool.category} size="small" variant="outlined" /></TableCell>
                <TableCell align="center">{getStatusChip(tool.status)}</TableCell>
                <TableCell align="center" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{tool.stock}</TableCell>
                <TableCell align="center">{tool.inRepair}</TableCell>
                <TableCell align="center">${tool.replacementValue}</TableCell>
                {isAdmin && (
                    <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                        <Tooltip title="Editar"><IconButton size="small" color="primary" sx={{ bgcolor: '#e3f2fd' }} onClick={() => navigate(`/tools/edit/${tool.id}`)}><EditIcon /></IconButton></Tooltip>
                        
                        {adjustment.id === tool.id ? (
                        <Zoom in={true}>
                            <Box sx={{ 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#fff', 
                            border: `2px solid ${getAdjustmentColor()}`, p: 1.5, borderRadius: 2, boxShadow: 3, minWidth: 160 
                            }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, textTransform: 'uppercase', color: getAdjustmentColor() }}>
                                {getAdjustmentLabel()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TextField
                                type="number" size="small" autoFocus
                                value={adjustment.quantity}
                                onChange={(e) => setAdjustment({...adjustment, quantity: e.target.value})}
                                sx={{ 
                                    width: 100,
                                    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": { display: "none" },
                                    "& input[type=number]": { MozAppearance: "textfield" }
                                }} 
                                inputProps={{ style: { textAlign: 'center', fontWeight: 'bold' } }}
                                />
                                <IconButton 
                                color="success" 
                                onClick={applyStockAdjustment}
                                disabled={adjustment.quantity === "" || Number.parseInt(adjustment.quantity, 10) <= 0}
                                >
                                <CheckIcon />
                                </IconButton>
                                <IconButton color="error" onClick={() => setAdjustment({ id: null, quantity: "", type: null })}>
                                <CloseIcon />
                                </IconButton>
                            </Box>
                            </Box>
                        </Zoom>
                        ) : (
                        <>
                            <Tooltip title="Añadir Stock"><IconButton color="success" sx={{ bgcolor: '#e8f5e9' }} onClick={() => setAdjustment({ id: tool.id, quantity: "", type: 'INCREASE' })}><AddCircleIcon /></IconButton></Tooltip>
                            <Tooltip title="Retirar Stock"><IconButton color="warning" sx={{ bgcolor: '#fff3e0' }} onClick={() => setAdjustment({ id: tool.id, quantity: "", type: 'DECREASE' })}><RemoveCircleIcon /></IconButton></Tooltip>
                        </>
                        )}

                        <Tooltip title="Dar De Baja">
                        <span>
                            <IconButton 
                            color="error" sx={{ bgcolor: '#ffebee' }}
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
            <TableRow key={tool.id}>
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
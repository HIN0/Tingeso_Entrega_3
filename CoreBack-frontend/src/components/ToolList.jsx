import React, { useEffect, useState } from 'react';
import ToolService from '../services/tool.service';
import { 
Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
Paper, Typography, Button, Chip, Box, IconButton, Tooltip, 
TextField, InputAdornment, Snackbar, Alert, Divider 
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

const navigate = useNavigate();
const { keycloak, initialized } = useKeycloak();
const isAdmin = initialized && keycloak?.authenticated && keycloak.hasRealmRole("ADMIN");

const loadTools = () => {
    ToolService.getAll()
    .then(response => {
        const allTools = response.data;
        // Clasificación según tu lógica original
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

// REPARACIÓN: Función Decommission (Dar de baja)
const handleDecommission = (id, name) => {
    if (window.confirm(`¿Seguro que desea dar de baja "${name}"? Esta acción no se puede deshacer.`)) {
    ToolService.decommission(id)
        .then(() => {
        setError({ open: true, text: 'Herramienta dada de baja con éxito', severity: 'success' });
        loadTools();
        })
        .catch(e => {
        const msg = e.response?.data?.message || "No se pudo dar de baja";
        setError({ open: true, text: `Error: ${msg}`, severity: 'error' });
        });
    }
};

// Lógica de Ajuste de Stock integrada
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
    return <Chip label={status} color={colors[status] || 'default'} size="small" variant="outlined" />;
};

return (
    <Box sx={{ p: 2 }}>
    <Snackbar open={error.open} autoHideDuration={4000} onClose={() => setError({ ...error, open: false })}>
        <Alert severity={error.severity}>{error.text}</Alert>
    </Snackbar>

    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Inventario de Herramientas</Typography>
        {isAdmin && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/tools/add')}>
            Nueva Herramienta
        </Button>
        )}
    </Box>

    {/* TABLA 1: ACTIVAS Y EN REPARACIÓN */}
    <Typography variant="h6" sx={{ color: '#2e7d32', mb: 1, fontWeight: 'bold' }}>
        HERRAMIENTAS ACTIVAS ({activeTools.length})
    </Typography>
    <TableContainer component={Paper} sx={{ mb: 6, elevation: 3 }}>
        <Table>
        <TableHead sx={{ bgcolor: '#edf7ed' }}>
            <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="center">Stock</TableCell>
            <TableCell align="center">En Reparación</TableCell>
            <TableCell align="center">Valor Rep.</TableCell>
            {isAdmin && <TableCell align="center">Acciones</TableCell>}
            </TableRow>
        </TableHead>
        <TableBody>
            {activeTools
                .slice() // Crea una copia para no mutar el estado original
                .sort((a, b) => {
                    // Definimos el orden de prioridad de los estados
                    const statusPriority = { 'AVAILABLE': 1, 'REPAIRING': 2 };
                    const priorityA = statusPriority[a.status] || 99;
                    const priorityB = statusPriority[b.status] || 99;

                    // 1. Ordenar por prioridad de Estado
                    if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                    }
                    // 2. Si el estado es el mismo, ordenar por ID (Ascendente)
                    return a.id - b.id;
                })
            .map(tool => (
            <TableRow key={tool.id} hover>
                <TableCell>{tool.id}</TableCell>
                <TableCell sx={{ fontWeight: 'medium' }}>{tool.name}</TableCell>
                <TableCell>{tool.category}</TableCell>
                <TableCell>{getStatusChip(tool.status)}</TableCell>
                <TableCell align="center">{tool.stock}</TableCell>
                <TableCell align="center">{tool.inRepair}</TableCell>
                <TableCell align="center">${tool.replacementValue}</TableCell>
                {isAdmin && (
                <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => navigate(`/tools/edit/${tool.id}`)}><EditIcon /></IconButton></Tooltip>
                    
                    {adjustment.id === tool.id ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', p: 0.5, borderRadius: 1 }}>
                        <TextField
                            type="number" size="small" value={adjustment.quantity}
                            onChange={(e) => setAdjustment({...adjustment, quantity: parseInt(e.target.value) || 1})}
                            sx={{ width: 60 }} inputProps={{ min: 1 }}
                        />
                        <IconButton color="success" onClick={applyStockAdjustment}><CheckIcon /></IconButton>
                        <IconButton onClick={() => setAdjustment({ id: null, quantity: 1, type: null })}><CloseIcon /></IconButton>
                        </Box>
                    ) : (
                        <>
                        <Tooltip title="Aumentar Stock"><IconButton color="success" onClick={() => setAdjustment({ id: tool.id, quantity: 1, type: 'INCREASE' })}><AddCircleIcon /></IconButton></Tooltip>
                        <Tooltip title="Disminuir Stock"><IconButton color="warning" onClick={() => setAdjustment({ id: tool.id, quantity: 1, type: 'DECREASE' })}><RemoveCircleIcon /></IconButton></Tooltip>
                        </>
                    )}

                    <Tooltip title="Dar de Baja">
                        <span>
                        <IconButton 
                            color="error" 
                            disabled={tool.status === 'LOANED' || tool.status === 'REPAIRING'}
                            onClick={() => handleDecommission(tool.id, tool.name)}
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

    <Divider sx={{ my: 4 }} />

    {/* TABLA 2: DADAS DE BAJA */}
    <Typography variant="h6" sx={{ color: '#d32f2f', mb: 1, fontWeight: 'bold' }}>
        HERRAMIENTAS DADAS DE BAJA ({decommissionedTools.length})
    </Typography>
    <TableContainer component={Paper}>
        <Table>
        <TableHead sx={{ bgcolor: '#fdeded' }}>
            <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell align="center">Valor de Reposición</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {decommissionedTools.map(tool => (
            <TableRow key={tool.id}>
                <TableCell>{tool.id}</TableCell>
                <TableCell>{tool.name}</TableCell>
                <TableCell>{tool.category}</TableCell>
                <TableCell align="center">${tool.replacementValue}</TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </TableContainer>
    </Box>
);
};

export default ToolList;
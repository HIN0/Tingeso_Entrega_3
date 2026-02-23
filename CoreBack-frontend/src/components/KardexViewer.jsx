import React, { useState, useEffect, useMemo } from "react";
import KardexService from "../services/kardex.service";
import ToolService from "../services/tool.service";
import { 
  Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Radio, RadioGroup, 
  FormControlLabel, FormControl, CircularProgress, Alert, Chip, Autocomplete, InputAdornment, Divider
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import ConstructionIcon from '@mui/icons-material/Construction';

function KardexViewer() {
  const [queryType, setQueryType] = useState("tool");
  const [selectedTool, setSelectedTool] = useState(null);
  const [tools, setTools] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [kardexData, setKardexData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", severity: "info" });

  // 1. Cargar herramientas para el buscador (Heurística #7)
  useEffect(() => {
    setToolsLoading(true);
    ToolService.getAll()
      .then(res => {
        // SOLUCIÓN: Ordenamos la lista de sugerencias por ID antes de guardarla
        const sortedTools = res.data.sort((a, b) => a.id - b.id);
        setTools(sortedTools);
        setToolsLoading(false);
      })
      .catch(() => {
        showMsg("Error al sincronizar herramientas desde la base de datos.", "error");
        setToolsLoading(false);
      });
  }, []);

  const showMsg = (text, severity = "info") => setMessage({ text, severity });

  // 2. Lógica de consulta al servicio
  const handleFetchKardex = () => {
    showMsg("");
    setKardexData([]); 
    setLoading(true);

    let promise;
    if (queryType === "tool") {
      if (!selectedTool) {
        showMsg("Debe seleccionar una herramienta de la lista sugerida.", "warning");
        setLoading(false);
        return;
      }
      promise = KardexService.getByToolId(selectedTool.id);
    } else { 
      if (!dateRange.start || !dateRange.end) {
        showMsg("Debe ingresar ambas fechas para realizar la consulta.", "warning");
        setLoading(false);
        return;
      }
      promise = KardexService.getByDateRange(dateRange.start, dateRange.end);
    }

    promise
      .then(response => {
        setKardexData(response.data);
        if (response.data.length === 0) {
          showMsg("No se encontraron movimientos registrados para este criterio.", "info");
        }
      })
      .catch(error => {
        showMsg(`Error: ${error.response?.data || "No se pudo conectar con el servidor."}`, "error");
      })
      .finally(() => setLoading(false));
  };

  // 3. ORDENAMIENTO DE LA TABLA DE RESULTADOS (Opcional pero recomendado)
  const sortedKardex = useMemo(() => {
    return [...kardexData].sort((a, b) => (a.tool?.id || 0) - (b.tool?.id || 0));
  }, [kardexData]);

  const getMovementChip = (type) => {
    const config = {
      'INCOME':           { color: 'success', label: 'INCOME' },
      'LOAN':             { color: 'error',   label: 'LOAN' },
      'RETURN':           { color: 'success', label: 'RETURN' },
      'REPAIR':           { color: 'warning', label: 'REPAIR' },
      'DECOMMISSION':     { color: 'error',   label: 'DECOMMISSION' },
      'MANUAL_DECREASE':  { color: 'primary', label: 'MANUAL_DECREASE' }
    };
    const { color, label } = config[type] || { color: 'default', label: type };
    return <Chip label={label} color={color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    return new Date(dateTimeString).toLocaleString();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <HistoryIcon fontSize="large" color="primary" /> Visor de Kardex
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Grid container direction="column" spacing={4}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <RadioGroup row value={queryType} onChange={(e) => setQueryType(e.target.value)}>
                <FormControlLabel value="tool" control={<Radio />} label="Consultar por Herramienta" />
                <FormControlLabel value="date" control={<Radio />} label="Consultar por Rango de Fechas" />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Divider sx={{ mx: 2 }} />

          {/* SECCIÓN 2: CELDA DE BÚSQUEDA ANCHA (REPARADO) */}
          <Grid item xs={12}>
            <Box sx={{ width: '100%' }}>
              {queryType === "tool" ? (
                <Autocomplete
                  fullWidth
                  options={tools}
                  loading={toolsLoading}
                  getOptionLabel={(option) => `[ID: ${option.id}] - ${option.name}`}
                  onChange={(e, val) => setSelectedTool(val)}
                  sx={{ width: '100%' }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth
                      label="Seleccione Herramienta para ver Historial" 
                      placeholder="Escriba el nombre o ID de la herramienta..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <ConstructionIcon color="primary" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Fecha Desde" type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Fecha Hasta" type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              )}
            </Box>
          </Grid>

          {/* SECCIÓN 3: BOTÓN DE ACCIÓN CENTRADO */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="contained" onClick={handleFetchKardex} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />} sx={{ px: 10, py: 2, fontWeight: 'bold', minWidth: '300px' }}>
                {loading ? "BUSCANDO..." : "CONSULTAR MOVIMIENTOS"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ÁREA DE MENSAJES Y RESULTADOS */}
      {message.text && (
        <Alert severity={message.severity} sx={{ mb: 3 }} variant="filled">{message.text}</Alert>
      )}

      {sortedKardex.length > 0 && (
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: '#1976d2' }}>
              <TableRow>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Fecha / Hora</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Herramienta</TableCell>
                <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>Tipo de Movimiento</TableCell>
                <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>Cantidad</TableCell>
                <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Operador Responsable</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedKardex.map((mov) => (
                <TableRow key={mov.id} hover>
                  <TableCell>{formatDateTime(mov.movementDate)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{mov.tool?.name}</Typography>
                    <Typography variant="caption" color="textSecondary">ID Herramienta: {mov.tool?.id}</Typography>
                  </TableCell>
                  <TableCell align="center">{getMovementChip(mov.type)}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{mov.quantity}</TableCell>
                  <TableCell align="center">{mov.user?.username || 'Sistema Automático'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default KardexViewer;
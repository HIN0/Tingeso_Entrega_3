import React, { useEffect, useState } from "react";
import ReportService from "../services/report.service";
import { useKeycloak } from "@react-keycloak/web";
import { 
  Box, Typography, Button, Paper, Grid, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, Checkbox, 
  FormControlLabel, CircularProgress, Alert, Divider, ButtonGroup 
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import TodayIcon from '@mui/icons-material/Today';

function ReportViewer() {
  const [reportType, setReportType] = useState("LATE_CLIENTS");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); 
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [useDateFilter, setUseDateFilter] = useState(false);

  const { keycloak } = useKeycloak();
  const isAdminOrUser = keycloak?.authenticated && (keycloak.hasRealmRole("ADMIN") || keycloak.hasRealmRole("USER"));

  const loadReport = (type, filterDates) => {
    if (!isAdminOrUser) return;
    setLoading(true);
    setReportData([]);
    setMessage("");

    const fromDate = filterDates && dateRange.from ? dateRange.from : null;
    const toDate = filterDates && dateRange.to ? dateRange.to : null;

    // Validaciones de negocio (Heurística #5)
    if (filterDates && type !== "TOP_TOOLS" && (!fromDate || !toDate)) {
        setMessage("Error: Ambas fechas son requeridas cuando el filtro está activo.");
        setLoading(false);
        return;
    }
    if (type === "TOP_TOOLS" && (!fromDate || !toDate)) {
        setMessage("Error: El rango de fechas es obligatorio para el Ranking de Herramientas.");
        setLoading(false);
        return;
    }

    let promise;
    switch (type) {
      case "ACTIVE_LOANS":
      case "LATE_LOANS":
        promise = ReportService.getLoansByStatus(type.replace('_LOANS', ''), fromDate, toDate);
        break;
      case "LATE_CLIENTS":
        promise = ReportService.getClientsWithLateLoans(fromDate, toDate);
        break;
      case "TOP_TOOLS":
        promise = ReportService.getTopTools(fromDate, toDate);
        break;
      default:
        setMessage("Error: Tipo de reporte inválido.");
        setLoading(false);
        return;
    }

    promise
      .then(response => {
        setReportData(response.data);
        if (response.data.length === 0) setMessage("No se encontraron resultados para los criterios seleccionados.");
      })
      .catch(e => {
        const errorMsg = e.response?.data?.message || e.message || 'Error desconocido';
        setMessage(`Error al cargar reporte: ${errorMsg}`);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReport(reportType, false);
  }, [isAdminOrUser]);

  const handleRunReport = (type) => {
    setReportType(type);
    loadReport(type, useDateFilter);
  };

  const renderTable = () => {
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    if (message && reportData.length === 0) return <Alert severity="warning">{message}</Alert>;
    if (reportData.length === 0) return <Alert severity="info">Seleccione un reporte para visualizar los datos.</Alert>;

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              {reportType.includes("LOANS") ? (
                <>
                  <TableCell>ID</TableCell><TableCell>Cliente</TableCell><TableCell>Herramienta</TableCell>
                  <TableCell>Inicio</TableCell><TableCell>Vencimiento</TableCell><TableCell>Estado</TableCell>
                </>
              ) : reportType === "LATE_CLIENTS" ? (
                <>
                  <TableCell>ID</TableCell><TableCell>RUT</TableCell><TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell><TableCell>Estado</TableCell>
                </>
              ) : (
                <>
                  <TableCell>Ranking</TableCell><TableCell>Herramienta</TableCell><TableCell>Total Préstamos</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.map((item, index) => (
              <TableRow key={item.id || index} hover>
                {reportType.includes("LOANS") ? (
                  <>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.client?.name} ({item.client?.rut})</TableCell>
                    <TableCell>{item.tool?.name}</TableCell>
                    <TableCell>{item.startDate}</TableCell><TableCell>{item.dueDate}</TableCell>
                    <TableCell>{item.status}</TableCell>
                  </>
                ) : reportType === "LATE_CLIENTS" ? (
                  <>
                    <TableCell>{item.id}</TableCell><TableCell>{item.rut}</TableCell>
                    <TableCell>{item.name}</TableCell><TableCell>{item.email}</TableCell>
                    <TableCell>{item.status}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell sx={{ fontWeight: 'bold' }}>#{index + 1}</TableCell>
                    <TableCell>{item[0]?.name}</TableCell><TableCell>{item[1]}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
        <AssessmentIcon fontSize="large" color="primary" /> Reportes del Sistema
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12}>
            <FormControlLabel
              control={<Checkbox checked={useDateFilter} onChange={(e) => setUseDateFilter(e.target.checked)} />}
              label="Aplicar Filtro de Fecha (Opcional en Préstamos/Clientes, Obligatorio en Ranking)"
            />
          </Grid>
          
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth label="Desde" type="date" value={dateRange.from}
              onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              disabled={!useDateFilter} InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth label="Hasta" type="date" value={dateRange.to}
              onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              disabled={!useDateFilter} InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => handleRunReport("LATE_CLIENTS")} disabled={loading} startIcon={<TodayIcon />}>
            Clientes Atrasados
          </Button>
          <Button variant="outlined" onClick={() => handleRunReport("ACTIVE_LOANS")} disabled={loading}>
            Préstamos Activos
          </Button>
          <Button variant="outlined" onClick={() => handleRunReport("LATE_LOANS")} disabled={loading}>
            Préstamos Atrasados
          </Button>
          <Button 
            variant="contained" onClick={() => handleRunReport("TOP_TOOLS")}
            disabled={loading || (useDateFilter && (!dateRange.from || !dateRange.to))}
          >
            Ranking Herramientas
          </Button>
        </Box>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium' }}>
        Resultados: {reportType.replace(/_/g, ' ')}
        {useDateFilter && dateRange.from && ` [${dateRange.from} a ${dateRange.to}]`}
      </Typography>

      {renderTable()}
    </Box>
  );
}

export default ReportViewer;
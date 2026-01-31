import http from "../http-common";

class ReportService {
  // RF6.1: Modificado para enviar fechas si existen
  getLoansByStatus(status, from, to) {
    let url = `/reports/loans?status=${status}`;
    // Añadir parámetros de fecha solo si ambos están presentes
    if (from && to) {
      url += `&from=${from}&to=${to}`;
    }
    return http.get(url);
  }

  // RF6.2: Modificado para enviar fechas si existen
  getClientsWithLateLoans(from, to) {
    let url = "/reports/clients/late";
    // Añadir parámetros de fecha solo si ambos están presentes
    if (from && to) {
      url += `?from=${from}&to=${to}`; // O usar '&' si ya hubiera otros params
    }
    return http.get(url);
  }

  // RF6.3: Sin cambios, ya enviaba fechas
  getTopTools(from, to) {
    // Validar fechas aquí o asumir que el componente lo hace
    if (!from || !to) {
        return Promise.reject(new Error("Both 'from' and 'to' dates are required for Top Tools report."));
    }
    return http.get(`/reports/tools/top?from=${from}&to=${to}`);
  }
}

export default new ReportService();
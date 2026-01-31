import http from "../http-common";

class KardexService {
  // RF5.2: Consultar historial por herramienta
  getByToolId(toolId) {
    // Validar que toolId sea un número antes de llamar
    if (isNaN(parseInt(toolId))) {
        return Promise.reject(new Error("Invalid Tool ID. Please enter a number."));
    }
    return http.get(`/kardex/tool/${toolId}`);
  }

  // RF5.3: Generar listado por rango de fechas
  getByDateRange(startDate, endDate) {
    // Validar que las fechas no estén vacías
    if (!startDate || !endDate) {
        return Promise.reject(new Error("Both start date and end date are required."));
    }
    // El backend espera LocalDateTime (YYYY-MM-DDTHH:mm:ss), ajustamos las fechas
    // Se añaden T00:00:00 al inicio y T23:59:59 al final para cubrir todo el día
    const startDateTime = `${startDate}T00:00:00`;
    const endDateTime = `${endDate}T23:59:59`;
    return http.get(`/kardex/date?start=${startDateTime}&end=${endDateTime}`);
  }
}

export default new KardexService();
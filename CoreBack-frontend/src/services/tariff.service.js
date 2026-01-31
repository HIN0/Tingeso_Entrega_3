import http from "../http-common";

class TariffService {
  getTariff() {
    return http.get("/tariffs");
  }

  // Actualiza TODAS las tarifas con el objeto de entrada
  updateTariff(data) {
    // Nota: El backend asume que solo hay una tarifa (ID=1) o usa el primer registro
    // El frontend debe enviar todos los campos (dailyRentFee, dailyLateFee, repairFee)
    return http.put("/tariffs", data);
  }
}

export default new TariffService();
import http from "../http-common";

class ClientService {
  getAll() {
    return http.get("/clients");
  }

  // --- OBTENER CLIENTE POR ID ---
  get(id) {
    return http.get(`/clients/${id}`);
  }

  create(data) {
    // data debe incluir name, rut, phone, email
    return http.post("/clients", data);
  }

  // --- ACTUALIZAR DATOS CLIENTE ---
  update(id, data) {
    // data debe incluir name, phone, email
    return http.put(`/clients/${id}`, data);
  }

  updateStatus(id, status) {
    return http.patch(`/clients/${id}/status`, { status: status });
  }

  // --- NUEVA FUNCIÓN PARA INTENTAR ACTIVAR ---
  attemptReactivation(id) {
    // Llama al nuevo endpoint del backend
    return http.patch(`/clients/${id}/activate`);
    // Espera recibir ClientEntity como respuesta
  }
}

export default new ClientService();
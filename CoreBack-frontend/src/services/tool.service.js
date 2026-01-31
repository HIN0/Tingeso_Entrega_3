import http from "../http-common";

class ToolService {
  // --- METODO GET ALL ---
  getAll() {
    return http.get("/tools");
  }

  // --- MÉTODO GET ONE ---
  get(id) {
    return http.get(`/tools/${id}`);
  }

  // --- MÉTODO CREATE ---
  create(data) {
    return http.post("/tools", data);
  }

  // --- MÉTODO UPDATE ---
  update(id, data) {
    // data debe contener name, category, replacementValue
    return http.put(`/tools/${id}`, data);
  }

  // --- MÉTODO ADJUST STOCK ---
  adjustStock(id, data) {
      // data debe ser { quantityChange: number }
      return http.patch(`/tools/${id}/stock`, data);
  }

  // --- MÉTODO DECOMMISSION ---
  decommission(id) {
    return http.put(`/tools/${id}/decommission`);
  }
}

export default new ToolService();
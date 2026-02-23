import http from "../http-common";

class ToolService {
  getAll() {
    return http.get("/tools"); 
  }

  get(id) {
    return http.get(`/tools/${id}`);
  }

  create(data) {
    return http.post("/tools", data);
  }

  update(id, data) {
    return http.put(`/tools/${id}`, data);
  }

  decommission(id) {
    return http.patch(`/tools/${id}/decommission`);
  }
  
  adjustStock(id, data) {
    return http.patch(`/tools/${id}/stock`, data);
  }
}

export default new ToolService();
import axios from "axios";
import keycloak from "./keycloak";

const API_URL = "http://localhost:8080/tools";

// Función auxiliar simple para crear la cabecera con el token
const getAuthHeaders = () => {
  return {
    headers: {
      'Authorization': `Bearer ${keycloak.token}` // Aquí va el token mágico
    }
  };
};

class ToolService {
  getAll() {
    // Le pasamos las cabeceras a Axios manualmente
    return axios.get(API_URL, getAuthHeaders());
  }

  get(id) {
    return axios.get(`${API_URL}/${id}`, getAuthHeaders());
  }

  create(data) {
    return axios.post(API_URL, data, getAuthHeaders());
  }

  update(id, data) {
    return axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
  }

  delete(id) {
    return axios.delete(`${API_URL}/${id}`, getAuthHeaders());
  }

  decommission(id) {
    return axios.patch(`${API_URL}/${id}/decommission`, {}, getAuthHeaders());
  }
  
  adjustStock(id, data) {
    return axios.patch(`${API_URL}/${id}/stock`, data, getAuthHeaders());
  }
}

export default new ToolService();
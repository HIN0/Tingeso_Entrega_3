import axios from "axios";
import keycloak from "./services/keycloak"; 

const apiClient = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(5);
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    } catch (error) {
      console.error('Error al adjuntar token:', error);
    }
  }
  return config;
});

export default apiClient;
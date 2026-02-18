import axios from "axios";
import keycloak from "./services/keycloak"; 

const apiClient = axios.create({
  baseURL: "http://localhost:8090",
  headers: {
    "Content-type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    // 2. Intentar actualizar el token si está por expirar
    try {
      await keycloak.updateToken(5);
      config.headers.Authorization = `Bearer ${keycloak.token}`;
      // AÑADE ESTO PARA DEPURAR:
      console.log("Token enviado en la petición:", keycloak.token);
    } catch (error) {
      console.error('Error al actualizar el token:', error);
    }
  } else {
      console.warn("Usuario no autenticado en Keycloak");
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
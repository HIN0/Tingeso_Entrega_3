import { createRoot } from "react-dom/client";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./services/keycloak";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={{ onLoad: "login-required" }}
    onTokens={({ token, refreshToken }) => {
      localStorage.setItem("kc_token", token || "");
      localStorage.setItem("kc_refresh", refreshToken || "");
    }}
  >
    <App />
  </ReactKeycloakProvider>
);

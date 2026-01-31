import React, { useEffect, useState } from "react";
import TariffService from "../services/tariff.service";
import { useKeycloak } from "@react-keycloak/web";

function TariffManager() {
  const [tariffs, setTariffs] = useState({
    dailyRentFee: 0,
    dailyLateFee: 0,
    repairFee: 0,
  });
  const [message, setMessage] = useState("");

  const { keycloak } = useKeycloak();
  const isAdmin = keycloak?.authenticated && keycloak.hasRealmRole("ADMIN"); 

  const loadTariffs = () => {
    TariffService.getTariff()
      .then(response => {
        // Aseguramos que los valores sean números para el formulario
        setTariffs({
          dailyRentFee: response.data.dailyRentFee || 0,
          dailyLateFee: response.data.dailyLateFee || 0,
          repairFee: response.data.repairFee || 0,
        });
        setMessage("");
      })
      .catch(e => {
        console.error("Error fetching tariffs:", e);
        setMessage("Error al cargar las tarifas.");
      });
  };

  useEffect(() => {
    if (isAdmin) {
      loadTariffs();
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    setTariffs({ ...tariffs, [e.target.name]: parseInt(e.target.value) || 0 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("Guardando...");

    TariffService.updateTariff(tariffs)
      .then(() => {
        setMessage("Tarifas actualizadas correctamente.");
        loadTariffs();
      })
      .catch((e) => {
        console.error("Error updating tariffs:", e);
        setMessage(`Error al actualizar: ${e.response?.data || e.message}`);
      });
  };

  if (!isAdmin) {
    return <h3 style={{padding:16}}>Acceso denegado. Solo Administradores pueden gestionar tarifas.</h3>;
  }

  return (
    <div style={{padding: 16}}>
      <h2>Gestión de Tarifas y Montos (ADMIN)</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Tarifa Diaria de Arriendo: </label>
          <input
            type="number"
            name="dailyRentFee"
            value={tariffs.dailyRentFee}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Tarifa Diaria de Multa por Atraso: </label>
          <input
            type="number"
            name="dailyLateFee"
            value={tariffs.dailyLateFee}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Cargo por Reparación Leve: </label>
          <input
            type="number"
            name="repairFee"
            value={tariffs.repairFee}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" style={{marginTop: '15px'}}>Actualizar Tarifas</button>
      </form>
      {message && <p style={{ color: message.startsWith("Error") ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}

export default TariffManager;
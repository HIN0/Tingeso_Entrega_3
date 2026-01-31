import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import ToolService from "../services/tool.service";
import { Link } from "react-router-dom";

// --- FUNCIÓN DE CLASIFICACIÓN AVANZADA ---
const sortTools = (a, b) => {
    // Definimos el orden para los estados ACTIVOS/EN REPARACIÓN
    const statusOrder = {
        'AVAILABLE': 1,
        'REPAIRING': 2,
        'LOANED': 4,
    };
    
    const orderA = statusOrder[a.status] || 99;
    const orderB = statusOrder[b.status] || 99;

    // Clasificar por el orden definido
    if (orderA !== orderB) {
        return orderA - orderB;
    }

    // Desempate: Ordenar por ID ascendente 
    return a.id - b.id;
};
// ------------------------------------------

function ToolList() {
  const [tools, setTools] = useState([]);
  const [activeTools, setActiveTools] = useState([]); // Nueva lista para herramientas activas
  const [decommissionedTools, setDecommissionedTools] = useState([]); // Nueva lista para herramientas de baja
  
  const { keycloak } = useKeycloak();
  const isAuth = !!keycloak?.authenticated;
  const isAdmin = isAuth && keycloak.hasRealmRole("ADMIN");
  const [error, setError] = useState('');

  // --- ESTADO PARA EL AJUSTE INLINE (Se mantiene la lógica) ---
  const [adjustment, setAdjustment] = useState({
      id: null,
      quantity: 1,
      type: null
  });


  const loadTools = () => {
    setError('');
    ToolService.getAll()
      .then(response => {
          const allTools = response.data;
          
          // 1. Filtrar las herramientas
          const decommissioned = allTools.filter(t => t.status === 'DECOMMISSIONED');
          const active = allTools.filter(t => t.status !== 'DECOMMISSIONED');
          
          // 2. Ordenar las herramientas activas con la lógica compleja
          const sortedActive = active.sort(sortTools);
          
          setActiveTools(sortedActive);
          // Las herramientas de baja se ordenan solo por ID (el filtro de React no requiere .sort() extra)
          setDecommissionedTools(decommissioned.sort((a, b) => a.id - b.id)); 
          
      })
      .catch(e => {
          console.error("Error fetching tools:", e);
          setError('Failed to load tools.');
      });
  };

  useEffect(() => {
    loadTools();
  }, []);

  // --- Funciones de Stock y Decommission se mantienen sin cambios ---
  const handleDecommission = (id) => {
    setError('');
    if (window.confirm("Are you sure you want to decommission this tool? This action cannot be undone.")) {
      ToolService.decommission(id)
        .then(loadTools)
        .catch(e => {
            console.error("Error decommissioning tool:", e);
            const errorMsg = e.response?.data?.message || e.response?.data || "Failed to decommission tool.";
            setError(`Error decommissioning tool ${id}: ${errorMsg}`);
        });
    }
  };

  const startStockAdjustment = (id, type) => {
      setError('');
      setAdjustment({ id, quantity: 1, type });
  };

  const handleAdjustmentChange = (e) => {
      const value = parseInt(e.target.value);
      setAdjustment(prev => ({ 
          ...prev, 
          quantity: (isNaN(value) || value < 1) ? 1 : value 
      }));
  };

  const applyStockAdjustment = () => {
      if (!adjustment.id || adjustment.quantity < 1) {
          setError("Invalid quantity or tool selected.");
          return;
      }
      
      const isIncrease = adjustment.type === 'INCREASE';
      const actionText = isIncrease ? "increase" : "decrease";
      const quantityChange = isIncrease ? adjustment.quantity : -adjustment.quantity;
      
      setError('');
      ToolService.adjustStock(adjustment.id, { quantityChange }) 
          .then(() => {
              setAdjustment({ id: null, quantity: 1, type: null });
              loadTools(); 
          })
          .catch(e => {
              console.error(`Error ${actionText}ing stock:`, e);
              const errorMsg = e.response?.data?.message || e.response?.data || `Failed to ${actionText} stock.`;
              setError(`Error adjusting stock for tool ${adjustment.id}: ${errorMsg}`);
          });
  };


  return (
    <div style={{ padding: 16 }}>
      <h2>Tool Inventory</h2>
      {isAdmin && <Link to="/tools/add" style={{ marginRight: '10px' }}>➕ Add New Tool</Link>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* ========================================================================================================
          TABLA 1: INVENTARIO ACTIVO (AVAILABLE, REPAIRING) 
          ======================================================================================================== */}
      <table border="1" style={{ width: '95%', marginTop: '15px',marginLeft: 'auto', marginRight: 'auto', borderCollapse: 'collapse'}}>
        
        {/* --- COLGROUP DE 8 COLUMNAS (TABLA 1) --- */}
        <colgroup>
            <col style={{ width: '5%' }} />    {/* 1. ID */}
            <col style={{ width: '20%' }} />   {/* 2. Name */}
            <col style={{ width: '15%' }} />   {/* 3. Category */}
            <col style={{ width: '10%' }} />   {/* 4. Status */}
            <col style={{ width: '5%' }} />    {/* 5. Stock */}
            <col style={{ width: '10%' }} />   {/* 6. In Repair */}
            <col style={{ width: '15%' }} />   {/* 7. Repl. Value */}
            <col style={{ width: '20%' }} />   {/* 8. Actions */}
        </colgroup>
        
      {/* --- NUEVA FILA DE TÍTULO VERDE --- */}
        <thead>
          <tr>
            <th colSpan="8" style={{ backgroundColor: '#65e10cff', color: 'white', textAlign: 'center', padding: '8px' }}>
                ACTIVE ({activeTools.length - activeTools.filter(t => t.status === 'REPAIRING').length}) AND REPAIRING ({activeTools.filter(t => t.status === 'REPAIRING').length})
            </th>
          </tr>
        </thead>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Stock</th>
            <th>In Repair</th>
            <th>Repl. Value</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {activeTools.map(tool => (
            <tr key={tool.id}>
              <th>{tool.id}</th>
              <td>{tool.name}</td>
              <td>{tool.category}</td>
              <td>{tool.status}</td>
              <td>{tool.stock}</td>
              <td>{tool.inRepair}</td>
              <td>${tool.replacementValue}</td>
              {isAdmin && (
                <td>
                  <Link to={`/tools/edit/${tool.id}`} style={{ marginRight: '5px' }}>Edit</Link>

                  {/* LÓGICA CONDICIONAL DE AJUSTE */}
                  {adjustment.id === tool.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input
                            type="number"
                            value={adjustment.quantity}
                            onChange={handleAdjustmentChange}
                            min="1"
                            style={{ width: '50px', padding: '2px', textAlign: 'center' }}
                          />
                          <button
                            onClick={applyStockAdjustment}
                            style={{ backgroundColor: adjustment.type === 'INCREASE' ? 'darkgreen' : 'darkorange', color: 'white', padding: '2px 8px' }}
                          >
                            Apply {adjustment.type === 'INCREASE' ? '+' : '-'}
                          </button>
                          <button
                            onClick={() => setAdjustment({ id: null, quantity: 1, type: null })}
                            style={{ backgroundColor: 'grey', color: 'white', padding: '2px 8px' }}
                          >
                            X
                          </button>
                      </div>
                  ) : (
                      <>
                        <button
                          onClick={() => startStockAdjustment(tool.id, 'INCREASE')}
                          style={{ marginRight: '5px', backgroundColor: 'darkgreen', color: 'white' }}
                          disabled={tool.status === 'DECOMMISSIONED'} 
                        >
                          + Stock
                        </button>
                        <button
                          onClick={() => startStockAdjustment(tool.id, 'DECREASE')}
                          style={{ marginRight: '5px', backgroundColor: 'darkorange', color: 'white' }}
                          disabled={tool.status === 'DECOMMISSIONED'} 
                        >
                          - Stock
                        </button>
                      </>
                  )}

                  {/* Lógica de Decommission */}
                  {tool.status !== "DECOMMISSIONED" && (
                    <button onClick={() => handleDecommission(tool.id)} disabled={tool.status === 'LOANED' || tool.status === 'REPAIRING'}>
                      Decommission
                    </button>
                  )}
                  {(tool.status === 'LOANED' || tool.status === 'REPAIRING') && (
                      <span style={{ fontSize: '0.8em', marginLeft: '5px' }}>(Cannot decommission while {tool.status})</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <h1></h1>

      {/* ========================================================================================================
        TABLA 2: INVENTARIO DE BAJA (DECOMMISSIONED) - Se eliminan Status, Stock, In Repair, y Actions
        ======================================================================================================== */}
      <table border="1" style={{ width: '95%', marginTop: '15px',marginLeft: 'auto', marginRight: 'auto', borderCollapse: 'collapse' }}>
        
        {/* --- COLGROUP DE 8 COLUMNAS (TABLA 2: REPLICAR ESTRUCTURA) --- */}
        <colgroup>
            <col style={{ width: '5%' }} />    {/* 1. ID */}
            <col style={{ width: '20%' }} />   {/* 2. Name */}
            <col style={{ width: '30%' }} />   {/* 3. Category */}
            <col style={{ width: '30%' }} />   {/* 7. Repl. Value */}
        </colgroup>
        
        {/* --- NUEVA FILA DE TÍTULO ROJO --- */}
        <thead>
          <tr>
            <th colSpan="4" style={{ backgroundColor: '#cc0000', color: 'white', textAlign: 'center', padding: '8px' }}>
                TOOLS DECOMMISSIONED ({decommissionedTools.length})
            </th>
          </tr>
        </thead>
        
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Replacement Value</th>
          </tr>
        </thead>
        <tbody>
          {decommissionedTools.map(tool => (
            <tr key={tool.id}>
              <th>{tool.id}</th>
              <td>{tool.name}</td>
              <td>{tool.category}</td>
              <td>${tool.replacementValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
    </div>
  );
}

export default ToolList;
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHoursByDepartment } from "../../features/datEvents/datEventsSlice";
import { clearWorkedHours } from "../../features/datEvents/datEventsSlice";

import "./styles/LogDetail.css";

const ResumenPorDepartamento = () => {
  const dispatch = useDispatch();

  // Local state for user input
  const [departmentId, setDepartmentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  
  // Global state from Redux
  const { workedHours, status, error } = useSelector((state) => state.datEvents);

  // Calculate total hours whenever workedHours changes
  useEffect(() => {
    if (workedHours && workedHours.length > 0) {
      const sum = workedHours.reduce((acc, curr) => acc + parseFloat(curr.total_hours || 0), 0);
      setTotalHours(sum.toFixed(2));
    } else {
      setTotalHours(0);
    }
  }, [workedHours]);

    useEffect(() => {
    dispatch(clearWorkedHours());
  }, []);

  const handleBuscar = () => {
    if (!departmentId || !from || !to) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    dispatch(getWorkedHoursByDepartment({ department_id: departmentId, from, to }));
  };

  // Set default dates for yesterday and today
  const setDefaultDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    setFrom(yesterday.toISOString().split('T')[0]);
    setTo(today.toISOString().split('T')[0]);
  };

  return (
    <div className="resumen-container">
      <h2 className="resumen-title">Resumen por Departamento</h2>

      <div className="input-container">
        <div className="input-grid">
          <div className="input-group">
            <label className="input-label">
              ID Departamento:
            </label>
            <input
              type="text"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="input-field"
              placeholder="Ej: DEPT01"
            />
          </div>
          <div className="input-group">
            <label className="input-label">
              Desde:
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="input-group">
            <label className="input-label">
              Hasta:
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="button-group">
            <button onClick={handleBuscar} className="btn btn-primary">
              {status === "loading" ? "Buscando..." : "Buscar"}
            </button>
            <button onClick={setDefaultDates} className="btn btn-secondary">
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* Results table - contains all data states */}
      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th colSpan="2" className="table-header">
                <div className="header-content">
                  <h3 className="results-title">Resultados</h3>
                  {status === "succeeded" && workedHours.length > 0 && (
                    <div className="results-summary">
                      <p className="total-records">Total registros: {workedHours.length}</p>
                      <p className="total-hours">Total horas: {totalHours}</p>
                    </div>
                  )}
                </div>
              </th>
            </tr>
            {status === "succeeded" && workedHours.length > 0 && (
              <tr>
                <th className="column-header">Número de Empleado</th>
                <th className="column-header">Horas Trabajadas</th>
              </tr>
            )}
          </thead>
          <tbody>
            {/* Loading state */}
            {status === "loading" && (
              <tr>
                <td colSpan="2" className="status-cell">
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p className="loading-text">Cargando datos...</p>
                  </div>
                </td>
              </tr>
            )}
            
            {/* Error state */}
            {status === "failed" && (
              <tr>
                <td colSpan="2" className="status-cell">
                  <div className="error-message">
                    <div className="error-icon">!</div>
                    <div className="error-text">{error}</div>
                  </div>
                </td>
              </tr>
            )}
            
            {/* No results state */}
            {status === "succeeded" && workedHours.length === 0 && (
              <tr>
                <td colSpan="2" className="status-cell">
                  <div className="warning-message">
                    <div className="warning-icon">⚠</div>
                    <div className="warning-text">
                      No se encontraron resultados para los parámetros de búsqueda indicados.
                    </div>
                  </div>
                </td>
              </tr>
            )}
            
            {/* Results data */}
            {status === "succeeded" && workedHours.length > 0 && 
              workedHours.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td className="data-cell">{item.employee_number}</td>
                  <td className="data-cell">{parseFloat(item.total_hours).toFixed(2)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResumenPorDepartamento;
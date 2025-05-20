// src/components/logs/LogList.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHours } from "../../features/datEvents/datEventsSlice";
import { ChevronLeft, ChevronRight, Clock, Users, AlertCircle } from "lucide-react";
import AsideResumen from "../../components/common/AsideResumen";
import "./styles/LogList.css";

const LogList = () => {
  const dispatch = useDispatch();
  const { workedHours, status, error } = useSelector((state) => state.datEvents);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    dispatch(getWorkedHours({ page, limit }));
  }, [dispatch, page, limit]);

  const calculateWorkedHours = (entryDate, entryTime, exitDate, exitTime) => {
    const start = new Date(`${entryDate}T${entryTime}`);
    const end = new Date(`${exitDate}T${exitTime}`);
    const diffMs = end - start;
    if (diffMs < 0) return "0.00";
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(2);
  };

  if (status === "loading") {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p className="loading-text">Cargando registros de asistencia...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="error-container">
        <div className="error-box">
          <div className="error-content">
            <AlertCircle className="error-icon" />
            <div>
              <h3 className="error-title">Error al cargar datos</h3>
              <p className="error-message">{error}</p>
              <button 
                className="retry-button"
                onClick={() => dispatch(getWorkedHours({ page, limit }))}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine if data has rows
  const hasData = workedHours.length > 0;

  // Get current date for the header
  const currentDate = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="log-list-container">
      <div className="log-list-main-content">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-info">
            <h2 className="header-title">
              <Clock className="header-icon" />
              Control de Asistencia
            </h2>
            <p className="header-department">
              <Users className="department-icon" />
              Departamento de Recursos Humanos
            </p>
            <p className="header-date">
              {currentDate}
            </p>
          </div>

          <div className="records-selector">
            <span className="selector-label">
              Registros por página:
            </span>
            <select
              className="selector-dropdown"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5 registros</option>
              <option value={10}>10 registros</option>
              <option value={20}>20 registros</option>
              <option value={50}>50 registros</option>
            </select>
          </div>
        </div>

        {/* Custom Table Card */}
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">Registros de Asistencia</h3>
          </div>
          
          <div className="table-wrapper">
            <table className="custom-table">
              <caption className="custom-table-caption">Lista de registros de asistencia</caption>
              <thead className="custom-table-header">
                <tr className="header-row">
                  <th className="custom-table-head">N° Empleado</th>
                  <th className="custom-table-head">Fecha Entrada</th>
                  <th className="custom-table-head">Hora Entrada</th>
                  <th className="custom-table-head">Fecha Salida</th>
                  <th className="custom-table-head">Hora Salida</th>
                  <th className="custom-table-head text-right">Horas Trabajadas</th>
                </tr>
              </thead>
              <tbody className="custom-table-body">
                {workedHours.map((log, index) => {
                  const hours = parseFloat(calculateWorkedHours(
                    log.entry_date,
                    log.entry_time,
                    log.exit_date,
                    log.exit_time
                  ));

                  let rowClassName = "";
                  let hoursClassName = "";
                  
                  if (hours < 4) {
                    hoursClassName = "hours-low";
                    rowClassName = "row-low";
                  } else if (hours >= 8) {
                    hoursClassName = "hours-high";
                    rowClassName = "row-high";
                  } else {
                    hoursClassName = "hours-medium";
                    rowClassName = "row-medium";
                  }

                  const baseRowClass = index % 2 === 0 ? "row-even" : "row-odd";

                  return (
                    <tr 
                      key={index} 
                      className={`custom-table-row ${baseRowClass} ${rowClassName}`}
                    >
                      <td className="custom-table-cell">{log.employee_number}</td>
                      <td className="custom-table-cell">{log.entry_date}</td>
                      <td className="custom-table-cell">{log.entry_time}</td>
                      <td className="custom-table-cell">{log.exit_date}</td>
                      <td className="custom-table-cell">{log.exit_time}</td>
                      <td className={`custom-table-cell text-right ${hoursClassName}`}>
                        {hours.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {hasData && (
            <div className="table-legend">
              <div className="legend-content">
                <div className="legend-item">
                  <div className="legend-mark legend-low"></div>
                  <span>Menos de 4 horas</span>
                </div>
                <div className="legend-item">
                  <div className="legend-mark legend-medium"></div>
                  <span>Entre 4 y 8 horas</span>
                </div>
                <div className="legend-item">
                  <div className="legend-mark legend-high"></div>
                  <span>8 horas o más</span>
                </div>
              </div>
              <div className="legend-hint">Pase el cursor sobre una fila para destacarla</div>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="pagination">
          <div className="pagination-info">
            <span className="page-indicator">Página {page}</span>
            <span className="pagination-separator">•</span>
            <span>{limit} registros por página</span>
          </div>

          <div className="pagination-buttons">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`pagination-button ${page === 1 ? "button-disabled" : ""}`}
            >
              <ChevronLeft className="button-icon" />
              <span>Anterior</span>
            </button>

            <button
              onClick={() => setPage((p) => p + 1)}
              className="pagination-button"
            >
              <span>Siguiente</span>
              <ChevronRight className="button-icon" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Integrate AsideResumen component */}
      <AsideResumen workedHours={workedHours} />
    </div>
  );
};

export default LogList;
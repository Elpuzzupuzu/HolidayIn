// src/components/common/AsideResumen.jsx
import React, { useMemo } from "react";
import { CalendarCheck, Clock, AlertTriangle, ChartBar } from "lucide-react";
import "./styles/AsideResume.css";

const AsideResumen = ({ workedHours }) => {
  const statistics = useMemo(() => {
    if (!workedHours || workedHours.length === 0) {
      return {
        totalHours: 0,
        averageHours: 0,
        lowHoursCount: 0,
        mediumHoursCount: 0,
        highHoursCount: 0,
        latestDate: "Sin datos"
      };
    }

    let totalHours = 0;
    let lowHoursCount = 0;
    let mediumHoursCount = 0;
    let highHoursCount = 0;
    let latestDate = new Date(0);

    workedHours.forEach(log => {
      // Calculate hours
      const start = new Date(`${log.entry_date}T${log.entry_time}`);
      const end = new Date(`${log.exit_date}T${log.exit_time}`);
      const diffMs = end - start;
      
      if (diffMs > 0) {
        const hours = diffMs / (1000 * 60 * 60);
        totalHours += hours;
        
        // Count by hour ranges
        if (hours < 4) {
          lowHoursCount++;
        } else if (hours >= 8) {
          highHoursCount++;
        } else {
          mediumHoursCount++;
        }
      }

      // Track latest date
      const entryDate = new Date(log.entry_date);
      if (entryDate > latestDate) {
        latestDate = entryDate;
      }
    });

    const averageHours = totalHours / workedHours.length;
    
    return {
      totalHours: totalHours.toFixed(2),
      averageHours: averageHours.toFixed(2),
      lowHoursCount,
      mediumHoursCount,
      highHoursCount,
      latestDate: latestDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  }, [workedHours]);

  // Calculate progress percentages for the chart
  const total = statistics.lowHoursCount + statistics.mediumHoursCount + statistics.highHoursCount;
  const lowPercentage = total ? (statistics.lowHoursCount / total) * 100 : 0;
  const mediumPercentage = total ? (statistics.mediumHoursCount / total) * 100 : 0;
  const highPercentage = total ? (statistics.highHoursCount / total) * 100 : 0;

  return (
    <aside className="aside-resumen">
      <div className="resumen-header">
        <h3 className="resumen-title">Resumen de Asistencia</h3>
        <p className="resumen-subtitle">Estadísticas generales</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon-container">
            <Clock className="stat-icon" />
          </div>
          <div className="stat-content">
            <h4 className="stat-title">Total Horas</h4>
            <p className="stat-value">{statistics.totalHours} hrs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-container">
            <ChartBar className="stat-icon" />
          </div>
          <div className="stat-content">
            <h4 className="stat-title">Promedio</h4>
            <p className="stat-value">{statistics.averageHours} hrs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-container">
            <CalendarCheck className="stat-icon" />
          </div>
          <div className="stat-content">
            <h4 className="stat-title">Última Fecha</h4>
            <p className="stat-value">{statistics.latestDate}</p>
          </div>
        </div>
      </div>

      <div className="distribution-section">
        <h4 className="distribution-title">
          <AlertTriangle className="distribution-icon" />
          Distribución de Horas
        </h4>
        
        <div className="distribution-chart">
          <div className="chart-bar">
            <div className="bar-segment low-hours" style={{ width: `${lowPercentage}%` }}></div>
            <div className="bar-segment medium-hours" style={{ width: `${mediumPercentage}%` }}></div>
            <div className="bar-segment high-hours" style={{ width: `${highPercentage}%` }}></div>
          </div>
          
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color low-color"></span>
              <span className="legend-label">Menos de 4h</span>
              <span className="legend-value">{statistics.lowHoursCount}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color medium-color"></span>
              <span className="legend-label">4h - 8h</span>
              <span className="legend-value">{statistics.mediumHoursCount}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color high-color"></span>
              <span className="legend-label">8h o más</span>
              <span className="legend-value">{statistics.highHoursCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="observations-section">
        <h4 className="observations-title">Observaciones</h4>
        <ul className="observations-list">
          {statistics.lowHoursCount > 0 && (
            <li className="observation-item low-observation">
              <span className="observation-dot"></span>
              <span>Hay {statistics.lowHoursCount} registros con menos de 4 horas</span>
            </li>
          )}
          {statistics.highHoursCount > 0 && (
            <li className="observation-item high-observation">
              <span className="observation-dot"></span>
              <span>Hay {statistics.highHoursCount} registros con 8 horas o más</span>
            </li>
          )}
          {!workedHours || workedHours.length === 0 && (
            <li className="observation-item">
              <span>No hay datos para mostrar actualmente</span>
            </li>
          )}
        </ul>
      </div>
      
      <div className="report-section">
        <button className="report-button">
          Generar Reporte Completo
        </button>
      </div>
    </aside>
  );
};

export default AsideResumen;
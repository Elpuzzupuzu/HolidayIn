import React from "react";
import { useDispatch } from "react-redux";

import { X, Clock, User, Calendar, List } from "lucide-react";
import "./styles/EmployeeResume.css";
import WorkedHoursSummary from "./WorkedHoursSummary";
import { downloadWorkedHoursCSV } from "../../features/datEvents/datEventsSlice"; // Ajusta esta ruta
import EmployeeSearchComponent from "../horarios/SearchEmplooye";


const EmployeeResume = ({ resumen, workedHours = [], onClose }) => {
  const dispatch = useDispatch();
  if (!resumen) return null;



  const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  // Añade una hora para asegurar que la fecha se interprete correctamente en la zona horaria local
  // al mediodía del día especificado, evitando desbordamientos por zonas horarias.
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};


    console.log("📋 RESUMEN DEL EMPLEADO:", resumen);


  const formatHours = (hours) => {
    if (!hours) return "0h 0m";
    const numHours = parseFloat(hours);
    const wholeHours = Math.floor(numHours);
    const minutes = Math.round((numHours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  // Usamos la longitud del array workedHours para contar los días trabajados
  const totalDays = workedHours.length;

  const calculateAverageHours = () => {
    if (totalDays === 0) return "0.00";
    const avgHours = parseFloat(resumen.total_hours || 0) / totalDays;
    return avgHours.toFixed(2);
  };

  ///

    const csv = () => {
    dispatch(
      downloadWorkedHoursCSV({
        startDate: resumen.from,
        endDate: resumen.to,
        employeeNumber: resumen.employee_number,
      })
    );
  };

  return (
    <div className="employee-resume-overlay">
      <div className="employee-resume-modal">
        {/* Header */}
        <div className="employee-resume-header">
          <div className="header-decoration-1"></div>
          <div className="header-decoration-2"></div>

          <div className="header-content">
            <div className="header-info">
              <div className="header-icon">
                <User size={24} />
              </div>
              <div className="header-text">
                <h3 className="header-title">Resumen del Empleado</h3>
                <p className="header-subtitle">#{resumen.employee_number}</p>
               <EmployeeSearchComponent employeeNumber={resumen.employee_number} />

              </div>
            </div>
            <button onClick={onClose} className="header-close-btn">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="employee-resume-body">
          {/* Date Range Section */}
          <div className="date-section">
            <div className="section-header">
              <Calendar size={18} />
              <h4 className="section-title">Período de Consulta</h4>
            </div>
            <div className="date-info">
              <div className="date-row">
                <span className="date-label">Desde:</span>
                <span className="date-value">{formatDate(resumen.from)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">Hasta:</span>
                <span className="date-value">{formatDate(resumen.to)}</span>
              </div>
            </div>
          </div>

          {/* Hours Summary Section */}
          <div className="hours-section">
            {/* <div className="hours-content">
              <div className="hours-icon">
                <Clock size={24} />
              </div>
              <div className="hours-info">
                <h4 className="hours-title">Total de Horas Trabajadas</h4>
                <div className="hours-main">
                  <span className="hours-number">
                    {parseFloat(resumen.total_hours || 0).toFixed(2)}
                  </span>
                  <span className="hours-unit">horas</span>
                </div>
                <p className="hours-equivalent">
                  Equivalente a {formatHours(resumen.total_hours)}
                </p>
              </div>
            </div> */}
          </div>

          {/* Days Worked Section */}
          <div className="days-worked-section">
            <div className="section-header">
              <List size={18} />
              <h4 className="section-title">Días con Registros</h4>
            </div>
            <div className="days-info">
              <p className="days-number">{totalDays} días</p>
            </div>
          </div>

          {/* Average Section */}
          {/* <div className="average-section">
            <div className="average-content">
              <div className="average-label">Promedio Diario</div>
              <div className="average-value">{calculateAverageHours()} h/día</div>
            </div>
          </div> */}

          {/* Aquí envolvemos WorkedHoursSummary con el div para scroll */}
          <div className="results-wrapper">
            <WorkedHoursSummary
              employeeNumber={resumen.employee_number}
              from={resumen.from}
              to={resumen.to}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="employee-resume-footer">
           <button onClick={csv} className="footer-espera-btn">
            Descargar CSV
          </button>
          <button onClick={onClose} className="footer-close-btn">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeResume;

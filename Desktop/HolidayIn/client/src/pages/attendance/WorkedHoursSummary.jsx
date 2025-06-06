import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHoursBetweenDates } from "../../features/datEvents/datEventsSlice";
import "./styles/WorkedHoursSummary.css"; // Asegúrate de que este archivo CSS exista y esté enlazado

const WorkedHoursSummary = ({ employeeNumber, from, to }) => {
  const dispatch = useDispatch();
  const { workedHours, anomalies, status, error } = useSelector((state) => state.datEvents);

  useEffect(() => {
    if (from && to) {
      dispatch(getWorkedHoursBetweenDates({
        employeeNumber,
        startDate: from,
        endDate: to,
      }));
    }
  }, [employeeNumber, from, to, dispatch]);

  // esta función para devolver un objeto con el icono y la fecha
  const getDiaConLetraIconoYFecha = (fechaStr) => {
    if (!fechaStr) {
      return { icon: <strong className="icono-dia">N/A</strong>, date: "", dayLetter: "N/A" };
    }

    // Asegurarse de que sea una cadena, en caso de que venga como objeto Date (ej. de MySQL)
    const dateOnlyString = String(fechaStr).substring(0, 10);

    const letras = ["D", "L", "M", "Mi", "J", "V", "S"];
    const clases = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

    // Crear la fecha, importante incluir una hora para evitar problemas de zona horaria que puedan
    // mover la fecha al día anterior si solo se usa 'YYYY-MM-DD' y la zona horaria es diferente.
    const fecha = new Date(`${dateOnlyString}T12:00:00`);

    if (isNaN(fecha.getTime())) {
      // Para fechas inválidas, devolver un objeto consistente
      return { icon: <strong className="icono-dia">Inv</strong>, date: "Fecha inválida", dayLetter: "Inv" };
    }

    const letraDia = letras[fecha.getDay()];
    const claseDia = clases[fecha.getDay()];

    // Formatear la fecha a DD-MM-YYYY
    const day = fecha.getDate().toString().padStart(2, '0');
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0'); // getMonth() es 0-indexed
    const year = fecha.getFullYear();
    const formattedDate = `${day}-${month}-${year}`; // <-- ¡Aquí está el cambio a DD-MM-YYYY!

    return {
      icon: <strong className={`icono-dia ${claseDia}`}>{letraDia}</strong>, // El elemento React para el icono
      date: formattedDate, // La fecha en formato DD-MM-YYYY
      dayLetter: letraDia // La letra del día de la semana (texto puro)
    };
  };

  // Función para ordenar las anomalías
  const sortedAnomalies = [...anomalies].sort((a, b) => {
    // Ordenar por número de empleado
    if (a.employee_number !== b.employee_number) {
      return String(a.employee_number).localeCompare(String(b.employee_number));
    }

    // Luego, ordenar por la fecha más temprana del evento (entrada o salida)
    const dateA = a.entry_event?.event_date || a.exit_event?.event_date;
    const dateB = b.entry_event?.event_date || b.exit_event?.event_date;

    if (dateA && dateB) {
      return dateA.localeCompare(dateB);
    }
    return 0;
  });

  return (
    <div className="worked-hours-summary">
      <h2>Consultar Horas Trabajadas</h2>

      {status === "loading" && <p className="loading-message">Cargando datos...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {status !== "loading" && (!workedHours || workedHours.length === 0) && anomalies.length === 0 && (
        <p className="no-results-message">No se encontraron resultados para los criterios ingresados.</p>
      )}

      {workedHours && workedHours.length > 0 && (
        <div className="results-section">
          <h3>Detalle de Horas Calculadas:</h3>
          <table>
            <thead>
              <tr>
                <th>Nº Empleado</th>
                <th></th> {/* Columna para el icono de la fecha de entrada */}
                <th>Fecha Entrada</th>
                <th>Entrada</th>
                <th></th> {/* Columna para el icono de la fecha de salida */}
                <th>Fecha Salida</th>
                <th>Salida</th>
                <th>Horas Trabajadas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {workedHours.map((item, index) => {
                const entryDateInfo = getDiaConLetraIconoYFecha(item.entry_date);
                const exitDateInfo = getDiaConLetraIconoYFecha(item.exit_date);
                return (
                  <tr key={index} className={item.is_anomaly ? 'row-anomaly' : ''}>
                    <td>{item.employee_number}</td>
                    <td className="icon-column">{entryDateInfo.icon}</td> {/* Icono de entrada */}
                    <td className="date-column">{entryDateInfo.date}</td> {/* Fecha de entrada */}
                    <td>{item.entry_time}</td>
                    <td className="icon-column">{exitDateInfo.icon}</td> {/* Icono de salida */}
                    <td className="date-column">{exitDateInfo.date}</td> {/* Fecha de salida */}
                    <td>{item.exit_time}</td>
                    <td>{item.hours_worked ? item.hours_worked.toFixed(2) : "-"}</td>
                    {/* CAMBIO CLAVE AQUÍ: Usar item.anomaly_reason */}
                    <td>{item.is_anomaly ? <span className="text-warning">{item.anomaly_reason}</span> : "Normal"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {sortedAnomalies && sortedAnomalies.length > 0 && (
        <div className="anomalies-section">
          <h3><i className="fas fa-exclamation-triangle"></i> Eventos Anómalos Detectados:</h3>
          <p className="anomalies-intro">Se encontraron inconsistencias en los registros que no pudieron ser procesados como turnos válidos o que superan los límites. Por favor, revise los detalles a continuación:</p>
          <ul className="anomaly-list">
            {sortedAnomalies.map((anomaly, index) => {
              const anomalyEntryDateInfo = anomaly.entry_event
                ? getDiaConLetraIconoYFecha(anomaly.entry_event.event_date)
                : null;
              const anomalyExitDateInfo = anomaly.exit_event
                ? getDiaConLetraIconoYFecha(anomaly.exit_event.event_date)
                : null;

              const entryTime = anomaly.entry_event ? anomaly.entry_event.event_time : '';
              const exitTime = anomaly.exit_event ? anomaly.exit_event.event_time : '';

              let displayMessage = anomaly.message; // Inicialmente, usa el mensaje del backend

              // *** APLICAR FORMATO DD-MM-YYYY Y LA LETRA DEL DÍA AL MENSAJE DE LA ANOMALÍA ***
              if (anomaly.type === 'Entrada Duplicada (Sin Salida Previa)' && anomaly.entry_event) {
                displayMessage = `La entrada previa en ${anomalyEntryDateInfo.dayLetter} ${anomalyEntryDateInfo.date} ${entryTime} fue sobrescrita por una nueva entrada sin una salida intermedia.`;
              } else if (anomaly.type === 'Salida sin Entrada Previa' && anomaly.exit_event) {
                displayMessage = `Salida en ${anomalyExitDateInfo.dayLetter} ${anomalyExitDateInfo.date} ${exitTime} no tiene una entrada previa emparejable.`;
              } else if (anomaly.type === 'Entrada Final sin Salida' && anomaly.entry_event) {
                displayMessage = `La última entrada para ${anomaly.employee_number} en ${anomalyEntryDateInfo.dayLetter} ${anomalyEntryDateInfo.date} ${entryTime} no tuvo una salida.`;
              } else if (anomaly.hours_worked !== undefined && anomaly.entry_event && anomaly.exit_event) {
                // Para Turno Muy Corto, Turno Demasiado Corto, Turno Excesivo, etc.
                // Intentar extraer la parte final del mensaje original si existe
                const originalMessagePart = anomaly.message.split('horas (')[1] || '';
                displayMessage = `${anomaly.type} de ${anomaly.hours_worked.toFixed(2)} horas (${anomalyEntryDateInfo.dayLetter} ${anomalyEntryDateInfo.date} ${entryTime} a ${anomalyExitDateInfo.dayLetter} ${anomalyExitDateInfo.date} ${exitTime}) ${originalMessagePart}`;
              }
              // Si hay otros tipos de anomalías que no encajan en estas categorías y necesitan formateo,
              // puedes añadir más `else if` aquí.

              return (
                <li key={index} className="anomaly-item">
                  <div className="anomaly-header">
                    <strong>Tipo de Anomalía:</strong> <span className="anomaly-type">{anomaly.type}</span>
                    <strong>Empleado:</strong> <span className="anomaly-employee">{anomaly.employee_number}</span>
                  </div>
                  <p className="anomaly-message">{displayMessage}</p> {/* Usar el mensaje formateado */}
                  <div className="anomaly-details">
                    {anomaly.entry_event && (
                      <span className="anomaly-event-detail">
                        <span className="event-label">Entrada:</span>
                        <span className="icon-column">{anomalyEntryDateInfo.icon}</span>
                        <span className="date-column">{anomalyEntryDateInfo.date}</span> {anomaly.entry_event.event_time}
                      </span>
                    )}
                    {anomaly.exit_event && (
                      <span className="anomaly-event-detail">
                        <span className="event-label">Salida:</span>
                        <span className="icon-column">{anomalyExitDateInfo.icon}</span>
                        <span className="date-column">{anomalyExitDateInfo.date}</span> {anomaly.exit_event.event_time}
                      </span>
                    )}
                    {anomaly.hours_worked !== undefined && (
                      <span className="anomaly-hours-detail">
                        <span className="event-label">Horas Anómalas:</span> {anomaly.hours_worked.toFixed(2)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="anomalies-note">Estos registros no se incluyen en el cálculo total de horas trabajadas *válidas*, pero se informan para su revisión.</p>
        </div>
      )}
    </div>
  );
};

export default WorkedHoursSummary;
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

  // Función para devolver un objeto con el icono del día de la semana y la fecha formateada
  const getDiaConLetraIconoYFecha = (fechaStr) => {
    // Manejo de valores nulos o indefinidos para 'fechaStr'
    if (!fechaStr) {
      return { icon: <strong className="icono-dia icono-dia-na">N/A</strong>, date: "N/A", dayLetter: "N/A" };
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
      return { icon: <strong className="icono-dia icono-dia-invalid">Inv</strong>, date: "Fecha inválida", dayLetter: "Inv" };
    }

    const letraDia = letras[fecha.getDay()];
    const claseDia = clases[fecha.getDay()];

    // Formatear la fecha a DD-MM-YYYY
    const day = fecha.getDate().toString().padStart(2, '0');
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0'); // getMonth() es 0-indexed
    const year = fecha.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    return {
      icon: <strong className={`icono-dia ${claseDia}`}>{letraDia}</strong>, // El elemento React para el icono
      date: formattedDate, // La fecha en formato DD-MM-YYYY
      dayLetter: letraDia // La letra del día de la semana (texto puro)
    };
  };

  // Función para ordenar las anomalías (mantenemos la lógica de ordenamiento por empleado y fecha)
  const sortedAnomalies = [...anomalies].sort((a, b) => {
    // Ordenar por número de empleado
    if (a.employee_number !== b.employee_number) {
      return String(a.employee_number).localeCompare(String(b.employee_number));
    }

    // Luego, ordenar por la fecha más temprana del evento (entrada o salida)
    // Usamos el 'message' o los eventos para extraer la fecha si están disponibles
    let dateA = null;
    if (a.entry_event?.event_date) dateA = a.entry_event.event_date;
    else if (a.exit_event?.event_date) dateA = a.exit_event.event_date;
    else if (a.event?.event_date) dateA = a.event.event_date; // Para 'Evento con Fecha/Hora Inválida'

    let dateB = null;
    if (b.entry_event?.event_date) dateB = b.entry_event.event_date;
    else if (b.exit_event?.event_date) dateB = b.exit_event.event_date;
    else if (b.event?.event_date) dateB = b.event.event_date;

    if (dateA && dateB) {
      // Convertir a objetos Date para una comparación cronológica precisa
      const timestampA = new Date(String(dateA).substring(0,10) + 'T' + (a.entry_event?.event_time || a.exit_event?.event_time || '00:00:00')).getTime();
      const timestampB = new Date(String(dateB).substring(0,10) + 'T' + (b.entry_event?.event_time || b.exit_event?.event_time || '00:00:00')).getTime();
      return timestampA - timestampB;
    }
    return 0;
  });

  // Función para obtener el icono de FontAwesome para cada tipo de anomalía
  const getAnomalyIcon = (type) => {
    switch (type) {
      case "Turno Muy Corto (Descartado)":
        return <i className="fas fa-arrows-alt-h anomaly-icon short-shift-icon" title="Turno muy corto"></i>;
      case "Turno Excede Límite (Descartado)":
        return <i className="fas fa-clock anomaly-icon excessive-shift-icon" title="Turno excede límite"></i>;
      case "Turno Demasiado Corto":
        return <i className="fas fa-hourglass-half anomaly-icon warning-icon" title="Turno más corto de lo normal"></i>;
      case "Turno Excesivo":
        return <i className="fas fa-hourglass-end anomaly-icon warning-icon" title="Turno más largo de lo normal"></i>;
      case "Evento Fuera de Secuencia / Entrada Duplicada / Salida Retroactiva":
        return <i className="fas fa-exchange-alt anomaly-icon sequence-error-icon" title="Evento fuera de secuencia"></i>;
      case "Entrada Previa con Fecha/Hora Inválida":
      case "Evento con Fecha/Hora Inválida":
        return <i className="fas fa-calendar-times anomaly-icon invalid-date-icon" title="Fecha/hora inválida"></i>;
      case "Entrada Sin Salida Detectada (Fin de Rango)":
        return <i className="fas fa-sign-in-alt anomaly-icon missing-exit-icon" title="Entrada sin salida"></i>;
      default:
        return <i className="fas fa-exclamation-circle anomaly-icon unknown-icon" title="Anomalía desconocida"></i>;
    }
  };

  // Función para construir el mensaje de la anomalía de forma más amigable
  const buildAnomalyMessage = (anomaly) => {
    const entryInfo = anomaly.entry_event ? getDiaConLetraIconoYFecha(anomaly.entry_event.event_date) : null;
    const exitInfo = anomaly.exit_event ? getDiaConLetraIconoYFecha(anomaly.exit_event.event_date) : null;
    const eventInfo = anomaly.event ? getDiaConLetraIconoYFecha(anomaly.event.event_date) : null; // Para 'Evento con Fecha/Hora Inválida'

    const entryTime = anomaly.entry_event?.event_time || 'N/A';
    const exitTime = anomaly.exit_event?.event_time || 'N/A';
    const eventTime = anomaly.event?.event_time || 'N/A';

    switch (anomaly.type) {
      case "Turno Muy Corto (Descartado)":
        return `Turno de ${anomaly.hours_worked?.toFixed(2) || 'N/A'} horas (${entryInfo?.dayLetter} ${entryInfo?.date} ${entryTime} a ${exitInfo?.dayLetter} ${exitInfo?.date} ${exitTime}) es extremadamente corto y se descarta.`;
      case "Turno Excede Límite (Descartado)":
        return `Turno de ${anomaly.hours_worked?.toFixed(2) || 'N/A'} horas (${entryInfo?.dayLetter} ${entryInfo?.date} ${entryTime} a ${exitInfo?.dayLetter} ${exitInfo?.date} ${exitTime}) excede el límite de 12 horas y se descarta.`;
      case "Turno Demasiado Corto":
        return `Turno de ${anomaly.hours_worked?.toFixed(2) || 'N/A'} horas (${entryInfo?.dayLetter} ${entryInfo?.date} ${entryTime} a ${exitInfo?.dayLetter} ${exitInfo?.date} ${exitTime}) es más corto de lo esperado pero se contabiliza.`;
      case "Turno Excesivo":
        return `Turno de ${anomaly.hours_worked?.toFixed(2) || 'N/A'} horas (${entryInfo?.dayLetter} ${entryInfo?.date} ${entryTime} a ${exitInfo?.dayLetter} ${exitInfo?.date} ${exitTime}) es más largo de lo esperado pero se contabiliza.`;
      case "Evento Fuera de Secuencia / Entrada Duplicada / Salida Retroactiva":
        return `Evento en ${entryInfo?.dayLetter} ${entryInfo?.date} ${entryTime} está fuera de secuencia. La entrada previa fue sobrescrita.`;
      case "Entrada Previa con Fecha/Hora Inválida":
        return `La entrada previa en ${entryInfo?.dayLetter} ${entryInfo?.date} ${entryTime} tenía fecha/hora inválida y fue descartada.`;
      case "Evento con Fecha/Hora Inválida":
        return `Evento en ${eventInfo?.dayLetter} ${eventInfo?.date} ${eventTime} tiene fecha/hora inválida y no pudo ser procesado.`;
      case "Entrada Sin Salida Detectada (Fin de Rango)":
        return `La entrada en ${entryInfo?.dayLetter} ${entryInfo?.date} ${entryTime} no tuvo una salida emparejada en el rango seleccionado.`;
      default:
        return anomaly.message || `Anomalía desconocida para el empleado ${anomaly.employee_number}.`;
    }
  };

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
          <p className="anomalies-intro">Se encontraron inconsistencias en los registros. Por favor, revise los detalles:</p>
          <ul className="anomaly-list">
            {sortedAnomalies.map((anomaly, index) => {
              const entryInfo = anomaly.entry_event ? getDiaConLetraIconoYFecha(anomaly.entry_event.event_date) : null;
              const exitInfo = anomaly.exit_event ? getDiaConLetraIconoYFecha(anomaly.exit_event.event_date) : null;
              const generalEventInfo = anomaly.event ? getDiaConLetraIconoYFecha(anomaly.event.event_date) : null; // Para Evento con Fecha/Hora Inválida

              return (
                <li key={index} className={`anomaly-item anomaly-type-${anomaly.type.replace(/[^a-zA-Z0-9]/g, '-')}`}>
                  <div className="anomaly-header">
                    {getAnomalyIcon(anomaly.type)} {/* Icono de FontAwesome para el tipo */}
                    <strong>Tipo:</strong> <span className="anomaly-type">{anomaly.type}</span>
                    <strong>Empleado:</strong> <span className="anomaly-employee">{anomaly.employee_number}</span>
                  </div>
                  <p className="anomaly-message">{buildAnomalyMessage(anomaly)}</p> {/* Mensaje formateado */}
                  <div className="anomaly-details">
                    {/* Detalles específicos del evento */}
                    {(anomaly.entry_event || anomaly.exit_event || anomaly.event) && (
                      <div className="event-info-wrapper">
                        {anomaly.entry_event && (
                          <span className="anomaly-event-detail">
                            <span className="event-label">Entrada:</span>
                            {entryInfo?.icon}
                            <span className="date-time-display">{entryInfo?.date} {anomaly.entry_event.event_time}</span>
                          </span>
                        )}
                        {anomaly.exit_event && (
                          <span className="anomaly-event-detail">
                            <span className="event-label">Salida:</span>
                            {exitInfo?.icon}
                            <span className="date-time-display">{exitInfo?.date} {anomaly.exit_event.event_time}</span>
                          </span>
                        )}
                        {/* Esto es para el caso de 'Evento con Fecha/Hora Inválida' donde solo hay un 'event' */}
                        {anomaly.type === "Evento con Fecha/Hora Inválida" && anomaly.event && (
                           <span className="anomaly-event-detail">
                             <span className="event-label">Evento Afectado:</span>
                             {generalEventInfo?.icon}
                             <span className="date-time-display">{generalEventInfo?.date} {anomaly.event.event_time}</span>
                           </span>
                        )}
                      </div>
                    )}
                    {anomaly.hours_worked !== undefined && (
                      <span className="anomaly-hours-detail">
                        <span className="event-label">Duración:</span> {anomaly.hours_worked.toFixed(2)} hrs.
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="anomalies-note">Las anomalías de tipo "(Descartado)" no se incluyen en el cálculo total de horas trabajadas válidas. Las demás se informan para su revisión.</p>
        </div>
      )}
    </div>
  );
};

export default WorkedHoursSummary;
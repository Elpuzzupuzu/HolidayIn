// src/components/modals/HorarioModal.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWorkedHoursBetweenDates } from "../../features/datEvents/datEventsSlice";
import './styles/HorarioModal.css';

// Helper function to format time strings (e.g., "8:00" -> "08:00")
const formatTimeForDateParsing = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const formattedHours = hours.padStart(2, '0');
  return `${formattedHours}:${minutes}`;
};

// Función para determinar el rango de fechas con el número de la semana y el año (lunes a domingo)
function obtenerRangoFechasSemana(numeroSemana, anio) {
  if (typeof numeroSemana !== 'number' || typeof anio !== 'number' || isNaN(numeroSemana) || isNaN(anio)) {
      console.error("❌ obtenerRangoFechasSemana: numeroSemana o anio no son números válidos.", { numeroSemana, anio });
      return { lunes: null, domingo: null, lunesUI: 'N/A', domingoUI: 'N/A' };
  }

  const fechaReferencia = new Date(anio, 0, 4);
  const diaSemanaReferencia = (fechaReferencia.getDay() + 6) % 7;
  const inicioSemana1 = new Date(fechaReferencia);
  inicioSemana1.setDate(fechaReferencia.getDate() - diaSemanaReferencia);

  const inicioSemanaDeseada = new Date(inicioSemana1);
  inicioSemanaDeseada.setDate(inicioSemana1.getDate() + (numeroSemana - 1) * 7);

  const finSemanaDeseada = new Date(inicioSemanaDeseada);
  finSemanaDeseada.setDate(inicioSemanaDeseada.getDate() + 6);

  const formatoSQL = (date) => {
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const opcionesFormatoUI = { year: 'numeric', month: '2-digit', day: '2-digit' };

  const lunesSQL = formatoSQL(inicioSemanaDeseada);
  const domingoSQL = formatoSQL(finSemanaDeseada);

  const lunesUI = !isNaN(inicioSemanaDeseada.getTime()) ? inicioSemanaDeseada.toLocaleDateString('es-ES', opcionesFormatoUI) : 'Fecha Inválida';
  const domingoUI = !isNaN(finSemanaDeseada.getTime()) ? finSemanaDeseada.toLocaleDateString('es-ES', opcionesFormatoUI) : 'Fecha Inválida';

  return {
    lunes: lunesSQL,
    domingo: domingoSQL,
    lunesUI: lunesUI,
    domingoUI: domingoUI,
  };
}

const HorarioModal = ({ colaborador, onClose }) => {
  const dispatch = useDispatch();
  const workedHours = useSelector(state => state.datEvents.workedHours || []);
  const anomalies = useSelector(state => state.datEvents.anomalies || []);

  console.log("📍 HorarioModal: Renderizando con colaborador:", colaborador);

  if (!colaborador) {
    console.log("❌ HorarioModal: Colaborador es nulo, no se renderiza el contenido.");
    return null;
  }

  console.log("ℹ️ HorarioModal: Colaborador recibido para mostrar en la modal:", colaborador);
  console.log("en pruebas id (colaborador.id):", colaborador.id);
  console.log("en pruebas numeroSemana:", colaborador.numeroSemana);
  console.log("en pruebas anioSemana:", colaborador.anioSemana);
  console.log("en pruebas semana (horario planificado):", colaborador.semana);

  const rangoFechas = obtenerRangoFechasSemana(Number(colaborador.numeroSemana), Number(colaborador.anioSemana));
  console.log("📅 HorarioModal: Rango de fechas calculado:", rangoFechas);

  useEffect(() => {
    console.log("🔄 HorarioModal: useEffect se ha ejecutado.");

    if (colaborador && colaborador.id && colaborador.numeroSemana && colaborador.anioSemana &&
        rangoFechas.lunes && rangoFechas.domingo) {
      const payload = {
        employeeNumber: colaborador.id,
        startDate: rangoFechas.lunes,
        endDate: rangoFechas.domingo,
      };
      console.log("✅ HorarioModal: Condición de despacho cumplida. Despachando getWorkedHoursBetweenDates con payload:", payload);
      dispatch(getWorkedHoursBetweenDates(payload));
    } else {
      console.warn("⚠️ HorarioModal: No se despacha la acción. Faltan datos requeridos:", {
        idColaborador: colaborador?.id,
        numeroSemana: colaborador?.numeroSemana,
        anioSemana: colaborador?.anioSemana,
        rangoFechasValido: !!(rangoFechas.lunes && rangoFechas.domingo)
      });
    }
  }, [colaborador, dispatch, rangoFechas.lunes, rangoFechas.domingo]);

  // --- LÓGICA PARA PROCESAR HORARIOS Y COMPARAR ---
  const processedWorkedHours = workedHours.map(event => {
    const eventDate = new Date(event.entry_date + 'T00:00:00');
    const dayOfWeek = (eventDate.getDay() + 6) % 7; // 0=Lunes, 1=Martes, ..., 6=Domingo

    const plannedScheduleStr = colaborador.semana[dayOfWeek];
    let entryStatusMessage = '';
    let entryStatusColor = '';
    let exitStatusMessage = '';
    let exitStatusColor = '';

    let plannedEntryTime = null;
    let plannedExitTime = null;

    if (plannedScheduleStr && typeof plannedScheduleStr === 'string' && plannedScheduleStr.includes('-')) {
      const [plannedStart, plannedEnd] = plannedScheduleStr.split('-');

      const formattedPlannedStart = formatTimeForDateParsing(plannedStart);
      const formattedPlannedEnd = formatTimeForDateParsing(plannedEnd);

      plannedEntryTime = new Date(`${event.entry_date}T${formattedPlannedStart}:00`);
      plannedExitTime = new Date(`${event.entry_date}T${formattedPlannedEnd}:00`);

      const actualEntryTime = new Date(`${event.entry_date}T${event.entry_time}`);
      const actualExitTime = new Date(`${event.exit_date}T${event.exit_time}`);

      if (!isNaN(actualEntryTime.getTime()) && !isNaN(actualExitTime.getTime()) &&
          !isNaN(plannedEntryTime.getTime()) && !isNaN(plannedExitTime.getTime())) {

          const TOLERANCE_MINUTES = 10;
          const ANTICIPATED_MINUTES = 30;

          const toleranceMs = TOLERANCE_MINUTES * 60 * 1000;
          const anticipatedMs = ANTICIPATED_MINUTES * 60 * 1000;

          const plannedEntryTimeWithTolerance = new Date(plannedEntryTime.getTime() - toleranceMs);
          const entryTimeDifference = plannedEntryTime.getTime() - actualEntryTime.getTime();

          // --- Lógica para la entrada ---
          if (actualEntryTime <= plannedEntryTime && actualEntryTime >= plannedEntryTimeWithTolerance) {
              entryStatusMessage = '✅ Entrada a tiempo (con tolerancia)';
              entryStatusColor = 'green';
          } else if (actualEntryTime < plannedEntryTimeWithTolerance && entryTimeDifference >= anticipatedMs) {
              entryStatusMessage = '🟠 Entrada Anticipada (más de 30 min antes)';
              entryStatusColor = 'orange';
          } else if (actualEntryTime < plannedEntryTimeWithTolerance) {
              entryStatusMessage = '🟡 Entrada Temprana';
              entryStatusColor = 'goldenrod';
          } else if (actualEntryTime > plannedEntryTime) {
              entryStatusMessage = '🔴 Entrada Tarde';
              entryStatusColor = 'red';
          } else {
              entryStatusMessage = 'Estado de entrada desconocido';
              entryStatusColor = 'gray';
          }

          // --- Lógica para la salida ---
          if (actualExitTime <= plannedExitTime) {
              exitStatusMessage = '✅ Salida a tiempo o antes de lo planificado';
              exitStatusColor = 'green';
          } else {
              exitStatusMessage = '🔴 Salida Tarde';
              exitStatusColor = 'red';
          }

      } else {
          console.warn(`⚠️ HorarioModal: Error al parsear fechas/horas para comparación del evento ${event.employee_number} en ${event.entry_date}.`);
          entryStatusMessage = 'Error al procesar horas de entrada';
          entryStatusColor = 'gray';
          exitStatusMessage = 'Error al procesar horas de salida';
          exitStatusColor = 'gray';
      }
    } else {
        console.warn(`⚠️ Horario planificado inválido o no definido para el día ${dayOfWeek} (${event.entry_date}):`, plannedScheduleStr);
        entryStatusMessage = 'Horario planificado de entrada no disponible';
        entryStatusColor = 'gray';
        exitStatusMessage = 'Horario planificado de salida no disponible';
        exitStatusColor = 'gray';
    }

    return {
      ...event,
      dayOfWeek: dayOfWeek,
      plannedSchedule: plannedScheduleStr,
      entryStatus: { message: entryStatusMessage, color: entryStatusColor },
      exitStatus: { message: exitStatusMessage, color: exitStatusColor },
      plannedEntryTime: plannedEntryTime?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      plannedExitTime: plannedExitTime?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };
  });

  console.log("📊 Horarios procesados (con verificación de rango y tolerancias):", processedWorkedHours);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Función para obtener la clase CSS según el color del estado
  const getStatusClass = (color) => {
    switch (color) {
      case 'green': return 'status-green';
      case 'red': return 'status-red';
      case 'orange': return 'status-orange';
      case 'goldenrod': return 'status-goldenrod';
      default: return 'status-gray';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>
          Detalles del Colaborador
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </h3>
        
        <div className="modal-body">
          {/* Información del colaborador */}
          <div className="colaborador-info">
            <div className="info-item">
              <span className="info-label">ID Colaborador</span>
              <span className="info-value">{colaborador.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Departamento</span>
              <span className="info-value">{colaborador.deptoId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Año</span>
              <span className="info-value">{colaborador.anioSemana}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Semana</span>
              <span className="info-value">{colaborador.numeroSemana}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Rango de Fechas</span>
              <span className="info-value">{rangoFechas.lunesUI} - {rangoFechas.domingoUI}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Estado</span>
              <span className={`info-value ${colaborador.activo ? 'active-yes' : 'active-no'}`}>
                {colaborador.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {/* Horarios planificados */}
          <div className="section">
            <h4>📅 Horarios Planificados de la Semana</h4>
            <div className="scheduled-hours">
              {colaborador.semana.map((horario, index) => (
                <div key={index} className="day-schedule">
                  <div className="day-name">{diasSemana[index]}</div>
                  <div className={`day-time ${!horario ? 'no-schedule' : ''}`}>
                    {horario || 'Sin horario'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="section-divider"/>

          {/* Registros trabajados */}
          <div className="section">
            <h4>⏰ Horarios Registrados y Verificación</h4>
            {processedWorkedHours && processedWorkedHours.length > 0 ? (
              <div className="worked-entries">
                {processedWorkedHours.map((entry, index) => (
                  <div key={index} className="worked-entry">
                    <div className="entry-header">
                      <div className="entry-date">
                        📅 {new Date(entry.entry_date).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="entry-hours">
                        {entry.hours_worked}h trabajadas
                      </div>
                    </div>
                    
                    <div className="entry-times">
                      <div className="time-block">
                        <div className="time-label">Entrada Real</div>
                        <div className="time-value">{entry.entry_time}</div>
                        <div className="time-planned">
                          Planificado: {entry.plannedEntryTime || 'N/A'}
                        </div>
                      </div>
                      <div className="time-block">
                        <div className="time-label">Salida Real</div>
                        <div className="time-value">{entry.exit_time}</div>
                        <div className="time-planned">
                          Planificado: {entry.plannedExitTime || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="entry-status">
                      <div className={`status-item ${getStatusClass(entry.entryStatus.color)}`}>
                        {entry.entryStatus.message}
                      </div>
                      <div className={`status-item ${getStatusClass(entry.exitStatus.color)}`}>
                        {entry.exitStatus.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                📭 No se encontraron eventos de entrada/salida emparejados para esta semana.
              </div>
            )}
          </div>

          {/* Anomalías */}
          {anomalies && anomalies.length > 0 && (
            <div className="section">
              <h4>⚠️ Anomalías de Registros</h4>
              <div className="anomalies-section">
                {anomalies.map((anomaly, idx) => (
                  <div key={idx} className="anomaly-item">
                    <div className="anomaly-type">{anomaly.type}</div>
                    <div className="anomaly-message">{anomaly.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HorarioModal;
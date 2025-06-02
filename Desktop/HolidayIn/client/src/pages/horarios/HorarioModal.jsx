// src/components/modals/HorarioModal.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getWorkedHoursBetweenDates } from "../../features/datEvents/datEventsSlice";


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

      // **FIX:** Format plannedStart and plannedEnd to ensure two-digit hours for Date parsing
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
          const entryTimeDifference = plannedEntryTime.getTime() - actualEntryTime.getTime(); // Positivo si llegó antes, negativo si llegó tarde

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
          } else if (actualEntryTime > plannedEntryTime) { // If entry is after planned time
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h3>Detalles del Colaborador</h3>
        <p><strong>ID Colaborador:</strong> {colaborador.id}</p>
        <p><strong>ID Departamento:</strong> {colaborador.deptoId}</p>
        <p><strong>Año Semana:</strong> {colaborador.anioSemana}</p>
        <p><strong>Número de Semana:</strong> {colaborador.numeroSemana}</p>
        <p>
          <strong>Rango de Fechas:</strong> {rangoFechas.lunesUI} - {rangoFechas.domingoUI}
        </p>
        <p><strong>Activo:</strong> {colaborador.activo ? 'Sí' : 'No'}</p>

        <h4>Horarios Planificados de la Semana:</h4>
        <ul>
          {colaborador.semana.map((horario, index) => (
            <li key={index}>
              <strong>Día {index + 1} ({['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][index]}):</strong> {horario || 'Sin horario'}
            </li>
          ))}
        </ul>

        <hr/>

        <h4>Horarios Registrados y Verificación:</h4>
        {processedWorkedHours && processedWorkedHours.length > 0 ? (
          <ul>
            {processedWorkedHours.map((entry, index) => (
              <li key={index}>
                <strong>Día {entry.entry_date}:</strong> Entrada {entry.entry_time}, Salida {entry.exit_time} ({entry.hours_worked}h)
                <br />
                Planificado: {entry.plannedSchedule || 'N/A'} (Entrada: {entry.plannedEntryTime || 'N/A'}, Salida: {entry.plannedExitTime || 'N/A'})
                <br />
                <strong style={{ color: entry.entryStatus.color }}>
                  {entry.entryStatus.message}
                </strong>
                <br />
                <strong style={{ color: entry.exitStatus.color }}>
                  {entry.exitStatus.message}
                </strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>No se encontraron eventos de entrada/salida emparejados para esta semana.</p>
        )}

        {anomalies && anomalies.length > 0 && (
          <>
            <h4>Anomalías de Registros:</h4>
            <ul>
              {anomalies.map((anomaly, idx) => (
                <li key={idx} style={{ color: 'orange' }}>
                  <strong>{anomaly.type}:</strong> {anomaly.message}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default HorarioModal;
const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

class DatEvent {

  //procesa el archivo .dat
  
 static async processDatFile(filePath) {
  const connection = await supabase.getConnection(); // 
  try {
    const raw = fs.readFileSync(path.resolve(filePath), "utf-8");
    const lines = raw.split("\n").filter(Boolean);

    const events = lines.map((line) => {
      const parts = line.trim().split(/\s+/);

      if (parts.length < 5) {
        throw new Error(`Línea mal formada: ${line}`);
      }

      const employee_number = parts[0];
      const event_date = parts[1];
      const event_time = parts[2];
      const event_type_raw = parts[4];

      if (!employee_number || !event_date || !event_time || !event_type_raw) {
        throw new Error(`Línea mal formada: ${line}`);
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date) || !/^\d{2}:\d{2}:\d{2}$/.test(event_time)) {
        throw new Error(`Fecha/hora mal formadas en la línea: ${line}`);
      }

      // Cambiar a string para el ENUM
      const event_type = event_type_raw === "0" ? "0" : "1";

      return [employee_number, event_type, event_date, event_time];
    });

    await connection.beginTransaction();

    const sql = `
      INSERT INTO dat_events (employee_number, event_type, event_date, event_time)
      VALUES ?
    `;

    await connection.query(sql, [events]);

    await connection.commit();
    connection.release();

    return { message: `${events.length} eventos insertados` };

  } catch (err) {
    try { 
      await connection.rollback();
      connection.release();
    } catch {}

    throw new Error(`Error procesando el archivo .dat: ${err.message}`);
  }
}




static async getWorkedHoursPerDay(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const connection = await supabase.getConnection();

  try {
    // 1. Fetch all events for the current page's employees within the range
    // We can't filter by date range directly in the main query for accurate pagination
    // unless we also fetch all events first and then paginate.
    // For simplicity, we'll fetch all events, then process and paginate.
    // In a very large dataset, this might need optimization (e.g., cursor-based pagination).

    // First, get the employee_numbers that will be part of this page to limit the event fetch.
    // This is a more complex approach if you truly need pagination *before* processing.
    // For now, let's assume 'limit' applies to the *final calculated shifts*.
    // If 'limit' applies to raw events, the logic would be different.
    // We'll fetch all events, process them, and then paginate the results.

    const [allEvents] = await connection.query(`
      SELECT
          employee_number,
          event_date,
          event_time
      FROM dat_events
      ORDER BY employee_number, event_date ASC, event_time ASC
    `);

    // 2. Group events by employee and apply the pairing logic
    const eventsByEmployee = {};
    for (const ev of allEvents) {
      if (!eventsByEmployee[ev.employee_number]) {
        eventsByEmployee[ev.employee_number] = [];
      }
      eventsByEmployee[ev.employee_number].push(ev);
    }

    const allCalculatedShifts = [];
    const allAnomalies = []; // To capture anomalies across all employees for debugging/reporting

    // --- REGLAS DE UMBRALES (consistentes con los otros métodos) ---
    const SHORT_SHIFT_THRESHOLD_HOURS = 0.1;
    const MAX_ALLOWED_SHIFT_HOURS = 24;

    const formatEventDateForMessage = (event) => {
      if (!event || !event.event_date) return 'Fecha desconocida';
      if (event.event_date instanceof Date) {
        if (isNaN(event.event_date.getTime())) {
          return 'Fecha inválida';
        }
        return event.event_date.toISOString().substring(0, 10);
      }
      return String(event.event_date).substring(0, 10);
    };

    for (const [employee_number, empEvents] of Object.entries(eventsByEmployee)) {
      let lastEntry = null;

      for (let i = 0; i < empEvents.length; i++) {
        const currentEvent = empEvents[i];
        const currentEventDate = currentEvent.event_date instanceof Date ? currentEvent.event_date : new Date(currentEvent.event_date);
        const eventTimestamp = new Date(`${currentEventDate.toISOString().slice(0, 10)}T${currentEvent.event_time}`);

        if (isNaN(eventTimestamp.getTime())) {
          allAnomalies.push({
            type: "Evento con Fecha/Hora Inválida",
            employee_number: employee_number,
            event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
            message: `Evento en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} tiene fecha/hora inválida y no puede ser procesado.`,
          });
          continue;
        }

        if (lastEntry === null) {
          lastEntry = currentEvent;
        } else {
          const entryDate = lastEntry.event_date instanceof Date ? lastEntry.event_date : new Date(lastEntry.event_date);
          const entryTimestamp = new Date(`${entryDate.toISOString().slice(0, 10)}T${lastEntry.event_time}`);

          if (isNaN(entryTimestamp.getTime())) {
             allAnomalies.push({
                type: "Entrada Previa con Fecha/Hora Inválida",
                employee_number: employee_number,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                message: `La entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} tiene fecha/hora inválida. Se buscará una nueva entrada.`,
            });
            lastEntry = null;
            lastEntry = currentEvent;
            continue;
          }

          if (eventTimestamp <= entryTimestamp) {
            allAnomalies.push({
              type: "Evento Fuera de Secuencia (Posible Entrada Duplicada o Salida Retroactiva)",
              employee_number: employee_number,
              entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
              current_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
              message: `El evento en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} es anterior o igual a la entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time}. Se asumirá que esta entrada previa fue sobrescrita y el evento actual es una nueva entrada.`,
            });
            lastEntry = currentEvent;
            continue;
          }

          const diffMs = eventTimestamp - entryTimestamp;
          let hoursWorked = diffMs / (1000 * 60 * 60);
          hoursWorked = Math.round(hoursWorked * 100) / 100;

          if (hoursWorked > MAX_ALLOWED_SHIFT_HOURS) {
            allAnomalies.push({
              type: "Turno Excede 24 Horas (Descartado)",
              employee_number: employee_number,
              entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
              exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
              hours_worked: hoursWorked,
              message: `El turno de ${hoursWorked} horas (de ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} a ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time}) excede el límite de ${MAX_ALLOWED_SHIFT_HOURS} horas.`,
            });
            lastEntry = currentEvent;
            continue;
          }

          if (hoursWorked >= SHORT_SHIFT_THRESHOLD_HOURS) {
            allCalculatedShifts.push({
              employee_number: employee_number,
              entry_date: formatEventDateForMessage(lastEntry),
              entry_time: lastEntry.event_time,
              exit_date: formatEventDateForMessage(currentEvent),
              exit_time: currentEvent.event_time,
              hours_worked: hoursWorked,
              // Optionally, you might add is_anomaly and anomaly_reason here if needed
              // for shifts that are normal but were flagged as too short/too long previously.
            });
          } else {
             allAnomalies.push({
                type: "Turno Demasiado Corto (No Contabilizado)",
                employee_number: employee_number,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
                hours_worked: hoursWorked,
                message: `Turno de ${hoursWorked} horas es extremadamente corto (< ${SHORT_SHIFT_THRESHOLD_HOURS}h) y no se contabiliza.`,
              });
          }

          lastEntry = null;
        }
      }

      if (lastEntry !== null) {
        allAnomalies.push({
          type: "Entrada Final sin Salida en Rango",
          employee_number: employee_number,
          entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
          message: `La última entrada para ${employee_number} en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} no tuvo una salida emparejada.`,
        });
      }
    }

    connection.release();

    // 3. Apply pagination to the calculated shifts
    const startIndex = offset;
    const endIndex = offset + limit;
    const paginatedShifts = allCalculatedShifts.slice(startIndex, endIndex);

    return {
      page,
      limit,
      total_shifts: allCalculatedShifts.length, // Total number of valid shifts found
      data: paginatedShifts,
      anomalies: allAnomalies // Optional: include all anomalies for full context
    };
  } catch (err) {
    connection.release();
    throw new Error(`Error obteniendo las horas trabajadas por día: ${err.message}`);
  }
}

/// esto busca por departamento y filtra por un rango de fechas A






static async getTotalWorkedHoursByDepartment(department_id, from, to) {
  if (!from || !to) throw new Error("Se requieren fechas 'from' y 'to'.");
  const connection = await supabase.getConnection();

  try {
    // 1) Get the department name
    const [deptRows] = await connection.query(
      "SELECT name FROM departments WHERE id = ?",
      [department_id]
    );
    if (!deptRows.length) throw new Error("Departamento no encontrado.");
    const departmentName = deptRows[0].name;

    // 2) Get employees from the department
    const [empRows] = await connection.query(
      "SELECT employee_number, name FROM employees WHERE department_id = ?",
      [department_id]
    );
    if (!empRows.length) {
      connection.release();
      return { department_id, department: departmentName, from, to, data: [] };
    }

    const employeeNumbers = empRows.map((e) => e.employee_number);

    // 3) Get events for the date range for these employees
    // IMPORTANT: 'event_type' is removed from the SELECT statement
    const [eventRows] = await connection.query(
      `
      SELECT employee_number, event_date, event_time
      FROM dat_events
      WHERE employee_number IN (?)
        AND event_date BETWEEN ? AND ?
      ORDER BY employee_number, event_date ASC, event_time ASC
    `,
      [employeeNumbers, from, to]
    );

    // 4) Group events by employee
    const groupedEvents = {};
    for (const ev of eventRows) {
      if (!groupedEvents[ev.employee_number]) {
        groupedEvents[ev.employee_number] = [];
      }
      groupedEvents[ev.employee_number].push(ev);
    }

    // --- THRESHOLD RULES (must be consistent across all functions) ---
    const SHORT_SHIFT_THRESHOLD_HOURS = 0.1;
    const MAX_ALLOWED_SHIFT_HOURS = 24; // Strict limit for a single shift

    // Helper to format dates for messages (consistent with other functions)
    const formatEventDateForMessage = (event) => {
      if (!event || !event.event_date) return 'Fecha desconocida';
      if (event.event_date instanceof Date) {
        if (isNaN(event.event_date.getTime())) {
          return 'Fecha inválida';
        }
        return event.event_date.toISOString().substring(0, 10);
      }
      // Assuming event_date is already a string like 'YYYY-MM-DD' if not a Date object
      return String(event.event_date).substring(0, 10);
    };

    // 5) Pair events and calculate hours using the new inferred logic
    const totalsByEmp = {};
    const departmentAnomalies = []; // Collect anomalies for the entire department

    for (const empNum in groupedEvents) {
      const empEvents = groupedEvents[empNum];
      let lastEntry = null; // Stores the last assumed "entry" event for pairing

      for (let i = 0; i < empEvents.length; i++) {
        const currentEvent = empEvents[i];
        // Ensure event_date is a Date object if it comes from MySQL as a string
        const currentEventDate = currentEvent.event_date instanceof Date ? currentEvent.event_date : new Date(currentEvent.event_date);
        const eventTimestamp = new Date(`${currentEventDate.toISOString().slice(0, 10)}T${currentEvent.event_time}`);

        // Validate event timestamp
        if (isNaN(eventTimestamp.getTime())) {
          departmentAnomalies.push({
            type: "Evento con Fecha/Hora Inválida",
            employee_number: empNum,
            event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
            message: `Evento en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} tiene fecha/hora inválida y no puede ser procesado.`,
          });
          continue; // Skip this invalid event
        }

        if (lastEntry === null) {
          // No pending entry, this is the start of a potential shift
          lastEntry = currentEvent;
        } else {
          // There's a pending entry (lastEntry), this is a potential shift end (exit)
          const entryDate = lastEntry.event_date instanceof Date ? lastEntry.event_date : new Date(lastEntry.event_date);
          const entryTimestamp = new Date(`${entryDate.toISOString().slice(0, 10)}T${lastEntry.event_time}`);

          // Validate the timestamp of the pending entry (though already validated when assigned)
          if (isNaN(entryTimestamp.getTime())) {
             departmentAnomalies.push({
                type: "Entrada Previa con Fecha/Hora Inválida",
                employee_number: empNum,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                message: `La entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} tiene fecha/hora inválida. Se buscará una nueva entrada.`,
            });
            lastEntry = null; // Discard this invalid entry
            // Re-process the currentEvent, assuming it's a new entry
            lastEntry = currentEvent;
            continue; // Go to the next event
          }

          // Check if currentEvent is chronologically before or at the same time as the entry
          if (eventTimestamp <= entryTimestamp) {
            departmentAnomalies.push({
              type: "Evento Fuera de Secuencia (Posible Entrada Duplicada o Salida Retroactiva)",
              employee_number: empNum,
              entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
              current_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
              message: `El evento en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} es anterior o igual a la entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time}. Se asumirá que esta entrada previa fue sobrescrita y el evento actual es una nueva entrada.`,
            });
            lastEntry = currentEvent; // This event becomes the new "entry"
            continue; // Move to the next event to find its exit
          }

          const diffMs = eventTimestamp - entryTimestamp;
          let hoursWorked = diffMs / (1000 * 60 * 60);
          hoursWorked = Math.round(hoursWorked * 100) / 100; // Round to two decimal places

          // --- RULE: Shifts cannot exceed 24 hours ---
          if (hoursWorked > MAX_ALLOWED_SHIFT_HOURS) {
            departmentAnomalies.push({
              type: "Turno Excede 24 Horas (Descartado)",
              employee_number: empNum,
              entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
              exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
              hours_worked: hoursWorked,
              message: `El turno de ${hoursWorked} horas (de ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} a ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time}) excede el límite de ${MAX_ALLOWED_SHIFT_HOURS} horas.`,
            });
            lastEntry = currentEvent; // The current event is assumed as a new entry, discarding the previous one.
            continue; // Move to the next event to find its exit
          }

          // If the shift is valid (didn't exceed 24h and is chronological)
          if (hoursWorked >= SHORT_SHIFT_THRESHOLD_HOURS) { // Only sum if the shift isn't extremely short
            totalsByEmp[empNum] = (totalsByEmp[empNum] || 0) + hoursWorked;
          } else {
             departmentAnomalies.push({
                type: "Turno Demasiado Corto (No Contabilizado)",
                employee_number: empNum,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
                hours_worked: hoursWorked,
                message: `Turno de ${hoursWorked} horas es extremadamente corto (< ${SHORT_SHIFT_THRESHOLD_HOURS}h) y no se contabiliza.`,
              });
          }

          lastEntry = null; // The pair is complete, look for a new entry
        }
      }

      // At the end of the employee's events loop, if an entry remains without an exit
      if (lastEntry !== null) {
        departmentAnomalies.push({
          type: "Entrada Final sin Salida en Rango",
          employee_number: empNum,
          entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
          message: `La última entrada para ${empNum} en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} no tuvo una salida emparejada dentro del rango de fechas.`,
        });
      }
    }

    // 6) Build the final response
    const data = empRows.map((e) => ({
      employee_number: e.employee_number,
      name: e.name,
      department: departmentName,
      total_hours: Math.round((totalsByEmp[e.employee_number] || 0) * 100) / 100,
    }));

    connection.release();
    // Optionally, you can return department anomalies if the frontend needs them
    return { department_id, department: departmentName, from, to, data, departmentAnomalies };
  } catch (err) {
    connection.release();
    throw new Error(`Error obteniendo horas por departamento: ${err.message}`);
  }
}






///// revisando ////


// static async getTotalWorkedHoursByEmployee(employee_number, from, to) {
//   if (!from || !to) throw new Error("Se requieren fechas 'from' y 'to'.");

//   try {
//     // console.log(`[MONITOR] Buscando eventos para el empleado: ${employee_number} desde: ${from} hasta: ${to}`);
//     const [rows] = await supabase.query(
//       `
//       SELECT *
//       FROM dat_events
//       WHERE employee_number = ?
//         AND event_date BETWEEN ? AND ?
//       ORDER BY event_date ASC, event_time ASC
//       `,
//       [employee_number, from, to]
//     );

//     // console.log(`[MONITOR] Eventos encontrados: ${rows.length}`);

//     if (!rows.length) {
//       // console.log(`[MONITOR] No se encontraron eventos para el empleado ${employee_number} en el rango de fechas. Total de horas: 0`);
//       return { employee_number, from, to, total_hours: 0 };
//     }

//     let totalHours = 0;
//     // console.log("[MONITOR] Iniciando cálculo de horas...");

//     for (let i = 0; i < rows.length - 1; i++) {
//       const curr = rows[i];
//       const next = rows[i + 1];

    

//       if (curr.event_type === "0" && next.event_type === "1") {
//         // --- CAMBIO CLAVE AQUÍ ---
//         // Asegúrate de que event_date sea un string en formato YYYY-MM-DD
//         // Si curr.event_date ya es un objeto Date, usa .toISOString().split('T')[0]
//         const currDateStr = curr.event_date instanceof Date ? curr.event_date.toISOString().split('T')[0] : curr.event_date;
//         const nextDateStr = next.event_date instanceof Date ? next.event_date.toISOString().split('T')[0] : next.event_date;

//         const start = new Date(`${currDateStr}T${curr.event_time}`);
//         const end = new Date(`${nextDateStr}T${next.event_time}`);
//         // --- FIN DEL CAMBIO CLAVE ---

//         const diffHours = (end - start) / 3600000; // 3600000 milisegundos en una hora

//         console.log(`[MONITOR] Par de entrada/salida encontrado:`);
//         console.log(`[MONITOR]   Entrada: ${start.toLocaleString()}`);
//         console.log(`[MONITOR]   Salida: ${end.toLocaleString()}`);
//         console.log(`[MONITOR]   Horas calculadas para este par: ${diffHours.toFixed(2)}`);

//         totalHours += diffHours;
//         // console.log(`[MONITOR]   Total de horas acumuladas hasta ahora: ${totalHours.toFixed(2)}`);
//         i++; // Saltar el siguiente evento, ya emparejado
//       } else {
//         // console.log(`[MONITOR] Saltando par de eventos no válido (curr.event_type: ${curr.event_type}, next.event_type: ${next.event_type})`);
//       }
//     }

//     const roundedTotalHours = Math.round(totalHours * 100) / 100;
//     // console.log(`[MONITOR] Cálculo de horas finalizado. Total de horas brutas: ${totalHours.toFixed(2)}`);
//     // console.log(`[MONITOR] Total de horas redondeadas: ${roundedTotalHours}`);


//     return {
//       employee_number,
//       from,
//       to,
//       total_hours: roundedTotalHours,
//     };
//   } catch (error) {
//     // console.error(`[ERROR] Error al obtener eventos del empleado ${employee_number}: ${error.message}`);
//     throw new Error(`Error al obtener eventos del empleado: ${error.message}`);
//   }
// }

static async getTotalWorkedHoursByEmployee(employee_number, from, to) {
  if (!from || !to) throw new Error("Se requieren fechas 'from' y 'to'.");

  try {
    const [rows] = await supabase.query(
      `
      SELECT employee_number, event_date, event_time
      FROM dat_events
      WHERE employee_number = ?
        AND event_date BETWEEN ? AND ?
      ORDER BY event_date ASC, event_time ASC
      `,
      [employee_number, from, to]
    );

    if (!rows.length) {
      return { employee_number, from, to, total_hours: 0, anomalies: [] }; // Incluimos 'anomalies'
    }

    let totalHours = 0;
    const anomalies = []; // Capturaremos las anomalías específicas para este empleado

    // --- REGLAS DE UMBRALES (consistentes con los otros métodos) ---
    const SHORT_SHIFT_THRESHOLD_HOURS = 0.1;
    const MAX_ALLOWED_SHIFT_HOURS = 24;

    const formatEventDateForMessage = (event) => {
      if (!event || !event.event_date) return 'Fecha desconocida';
      if (event.event_date instanceof Date) {
        if (isNaN(event.event_date.getTime())) {
          return 'Fecha inválida';
        }
        return event.event_date.toISOString().substring(0, 10);
      }
      return String(event.event_date).substring(0, 10);
    };

    let lastEntry = null; // Almacena la última "entrada" asumida para emparejar

    for (let i = 0; i < rows.length; i++) {
      const currentEvent = rows[i];
      // Asegúrate de que event_date sea un Date si viene de MySQL como string
      const currentEventDate = currentEvent.event_date instanceof Date ? currentEvent.event_date : new Date(currentEvent.event_date);
      const eventTimestamp = new Date(`${currentEventDate.toISOString().slice(0, 10)}T${currentEvent.event_time}`);

      if (isNaN(eventTimestamp.getTime())) {
        anomalies.push({
          type: "Evento con Fecha/Hora Inválida",
          employee_number: employee_number,
          event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
          message: `Evento en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} tiene fecha/hora inválida y no puede ser procesado.`,
        });
        continue; // Saltar este evento inválido
      }

      if (lastEntry === null) {
        // No hay entrada pendiente, este es el inicio de un posible turno
        lastEntry = currentEvent;
      } else {
        // Hay una entrada pendiente (lastEntry), este es un posible cierre de turno (salida)
        const entryDate = lastEntry.event_date instanceof Date ? lastEntry.event_date : new Date(lastEntry.event_date);
        const entryTimestamp = new Date(`${entryDate.toISOString().slice(0, 10)}T${lastEntry.event_time}`);

        // Validación de la fecha/hora de la entrada pendiente (aunque ya se validó al asignarla)
        if (isNaN(entryTimestamp.getTime())) {
             anomalies.push({
                type: "Entrada Previa con Fecha/Hora Inválida",
                employee_number: employee_number,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                message: `La entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} tiene fecha/hora inválida. Se buscará una nueva entrada.`,
            });
            lastEntry = null; // Descartar esta entrada inválida
            // Volver a procesar el currentEvent, asumiéndolo como una nueva entrada
            lastEntry = currentEvent;
            continue; // Ir al siguiente evento
        }

        // Comprobación de si el currentEvent es cronológicamente anterior o igual a la entrada
        if (eventTimestamp <= entryTimestamp) {
          anomalies.push({
            type: "Evento Fuera de Secuencia (Posible Entrada Duplicada o Salida Retroactiva)",
            employee_number: employee_number,
            entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
            current_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
            message: `El evento en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} es anterior o igual a la entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time}. Se asumirá que esta entrada previa fue sobrescrita y el evento actual es una nueva entrada.`,
          });
          lastEntry = currentEvent; // Este evento se convierte en la nueva "entrada"
          continue; // Pasar al siguiente evento para buscar su salida
        }

        const diffMs = eventTimestamp - entryTimestamp;
        let hoursWorked = diffMs / (1000 * 60 * 60);
        hoursWorked = Math.round(hoursWorked * 100) / 100; // Redondear a dos decimales

        // --- REGLA: Los turnos no pueden exceder 24 horas ---
        if (hoursWorked > MAX_ALLOWED_SHIFT_HOURS) {
          anomalies.push({
            type: "Turno Excede 24 Horas (Descartado)",
            employee_number: employee_number,
            entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
            exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
            hours_worked: hoursWorked,
            message: `El turno de ${hoursWorked} horas (de ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} a ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time}) excede el límite de ${MAX_ALLOWED_SHIFT_HOURS} horas. Este par no se considera un turno válido. Se buscará una nueva entrada.`,
          });
          lastEntry = currentEvent; // El evento actual se asume como una nueva entrada, descartando la anterior.
          continue; // Pasar al siguiente evento para buscar su salida
        }

        // Si el turno es válido (no excedió 24h y es cronológico)
        if (hoursWorked >= SHORT_SHIFT_THRESHOLD_HOURS) { // Solo sumar si el turno no es extremadamente corto
          totalHours += hoursWorked;
        } else {
           anomalies.push({
              type: "Turno Demasiado Corto (No Contabilizado)",
              employee_number: employee_number,
              entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
              exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
              hours_worked: hoursWorked,
              message: `Turno de ${hoursWorked} horas es extremadamente corto (< ${SHORT_SHIFT_THRESHOLD_HOURS}h) y no se contabiliza.`,
            });
        }

        lastEntry = null; // El par se ha completado, buscar una nueva entrada
      }
    }

    // Al final del bucle, si queda una entrada sin salida
    if (lastEntry !== null) {
      anomalies.push({
        type: "Entrada Final sin Salida en Rango",
        employee_number: employee_number,
        entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
        message: `La última entrada para ${employee_number} en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} no tuvo una salida emparejada dentro del rango de fechas.`,
      });
    }

    const roundedTotalHours = Math.round(totalHours * 100) / 100;

    return {
      employee_number,
      from,
      to,
      total_hours: roundedTotalHours,
      anomalies: anomalies // Devolver las anomalías encontradas
    };
  } catch (error) {
    throw new Error(`Error al obtener eventos del empleado: ${error.message}`);
  }
}



static async getWorkedHoursBetweenDates(startDate, endDate, employeeNumber = null) {
  let sql = `
    SELECT *
    FROM dat_events
    WHERE event_date BETWEEN ? AND ?
  `;
  const params = [startDate, endDate];

  if (employeeNumber) {
    sql += ` AND employee_number = ?`;
    params.push(employeeNumber);
  }

  // Ordenar es CRUCIAL para inferir el tipo de evento
  sql += ` ORDER BY employee_number, event_date ASC, event_time ASC`;

  const [events] = await supabase.execute(sql, params);

  if (events && events.length > 0) {
    console.log("🐛 DEBUG - event_date desde MySQL:", events[0]?.event_date, "Tipo:", typeof events[0]?.event_date);
  } else {
    console.log("🐛 DEBUG - No se encontraron eventos para depurar event_date.");
  }

  const workedHours = [];
  const anomalies = [];

  const formatEventDateForMessage = (event) => {
    if (!event || !event.event_date) return 'Fecha desconocida';
    if (event.event_date instanceof Date) {
      if (isNaN(event.event_date.getTime())) {
        return 'Fecha inválida';
      }
      return event.event_date.toISOString().substring(0, 10);
    }
    return String(event.event_date).substring(0, 10);
  };

  const eventsByEmployee = {};
  for (const event of events) {
    if (!eventsByEmployee[event.employee_number]) {
      eventsByEmployee[event.employee_number] = [];
    }
    eventsByEmployee[event.employee_number].push(event);
  }

  // Definición de umbrales para las anomalías de duración
  const SHORT_SHIFT_THRESHOLD_HOURS = 0.1; // Turnos extremadamente cortos (ej. < 6 minutos)
  const NORMAL_SHIFT_MIN_HOURS = 7.5; // Mínimo para un turno considerado normal
  const NORMAL_SHIFT_MAX_HOURS = 9.5; // Máximo para un turno considerado normal
  const MAX_ALLOWED_SHIFT_HOURS = 24; // Límite estricto para un solo turno

  for (const [employee, empEvents] of Object.entries(eventsByEmployee)) {
    let lastEntry = null; // Almacena la última "entrada" asumida para emparejar

    for (let i = 0; i < empEvents.length; i++) {
      const currentEvent = empEvents[i];
      const eventTimestamp = new Date(`${formatEventDateForMessage(currentEvent)}T${currentEvent.event_time}`);

      if (isNaN(eventTimestamp.getTime())) {
        anomalies.push({
          type: "Evento con Fecha/Hora Inválida",
          employee_number: employee,
          event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
          message: `Evento en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} tiene fecha/hora inválida y no puede ser procesado.`,
        });
        continue; // Saltar este evento inválido
      }

      if (lastEntry === null) {
        // No hay entrada pendiente, este es el inicio de un posible turno
        lastEntry = currentEvent;
      } else {
        // Hay una entrada pendiente (lastEntry), este es un posible cierre de turno (salida)
        const entryTimestamp = new Date(`${formatEventDateForMessage(lastEntry)}T${lastEntry.event_time}`);

        // Validación de la fecha/hora de la entrada pendiente (aunque ya se validó al asignarla)
        if (isNaN(entryTimestamp.getTime())) {
             anomalies.push({
                type: "Entrada Previa con Fecha/Hora Inválida",
                employee_number: employee,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                message: `La entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} tiene fecha/hora inválida. Se buscará una nueva entrada.`,
            });
            lastEntry = null; // Descartar esta entrada inválida
            // Volver a procesar el currentEvent, asumiéndolo como una nueva entrada
            lastEntry = currentEvent;
            continue; // Ir al siguiente evento
        }


        // Comprobación de si el currentEvent es cronológicamente anterior o igual a la entrada
        if (eventTimestamp <= entryTimestamp) {
          anomalies.push({
            type: "Evento Fuera de Secuencia (Posible Entrada Duplicada o Salida Retroactiva)",
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
            current_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
            message: `El evento en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} es anterior o igual a la entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time}. Se asumirá que esta entrada previa fue sobrescrita y el evento actual es una nueva entrada.`,
          });
          lastEntry = currentEvent; // Este evento se convierte en la nueva "entrada"
          continue; // Pasar al siguiente evento para buscar su salida
        }

        const diffMs = eventTimestamp - entryTimestamp;
        let hoursWorked = diffMs / (1000 * 60 * 60);
        hoursWorked = Math.round(hoursWorked * 100) / 100; // Redondear a dos decimales

        // --- REGLA: Los turnos no pueden exceder 24 horas ---
        if (hoursWorked > MAX_ALLOWED_SHIFT_HOURS) {
          anomalies.push({
            type: "Turno Excede 24 Horas (Descartado)",
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
            exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
            hours_worked: hoursWorked,
            message: `El turno de ${hoursWorked} horas (de ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} a ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time}) excede el límite de ${MAX_ALLOWED_SHIFT_HOURS} horas. Este par no se considera un turno válido. Se buscará una nueva entrada.`,
          });
          lastEntry = currentEvent; // El evento actual se asume como una nueva entrada, descartando la anterior.
          continue; // Pasar al siguiente evento para buscar su salida
        }

        // Si llegamos aquí, tenemos un par de eventos válido (entrada -> salida) dentro de 24h
        let isAnomaly = false;
        let anomalyReason = null;

        if (hoursWorked < SHORT_SHIFT_THRESHOLD_HOURS) {
          isAnomaly = true;
          anomalyReason = "Turno Muy Corto";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
            exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
            hours_worked: hoursWorked,
            message: `Turno de ${hoursWorked} horas es extremadamente corto (< ${SHORT_SHIFT_THRESHOLD_HOURS}h).`,
          });
        } else if (hoursWorked < NORMAL_SHIFT_MIN_HOURS) {
          isAnomaly = true;
          anomalyReason = "Turno Demasiado Corto";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
            exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
            hours_worked: hoursWorked,
            message: `Turno de ${hoursWorked} horas es inferior al mínimo de ${NORMAL_SHIFT_MIN_HOURS}h.`,
          });
        } else if (hoursWorked > NORMAL_SHIFT_MAX_HOURS) {
          isAnomaly = true;
          anomalyReason = "Turno Excesivo";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
            exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
            hours_worked: hoursWorked,
            message: `Turno de ${hoursWorked} horas excede el máximo de ${NORMAL_SHIFT_MAX_HOURS}h.`,
          });
        }

        workedHours.push({
          employee_number: employee,
          entry_date: formatEventDateForMessage(lastEntry),
          entry_time: lastEntry.event_time,
          exit_date: formatEventDateForMessage(currentEvent),
          exit_time: currentEvent.event_time,
          hours_worked: hoursWorked,
          is_anomaly: isAnomaly,
          anomaly_reason: anomalyReason,
        });

        lastEntry = null; // El par se ha completado, buscar una nueva entrada
      }
    }

    // Al final del bucle, si queda una entrada sin salida
    if (lastEntry !== null) {
      anomalies.push({
        type: "Entrada Final sin Salida",
        employee_number: employee,
        entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
        message: `La última entrada para ${employee} en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} no tuvo una salida emparejada en el rango de fechas.`,
      });
    }
  }

  if (anomalies.length > 0) {
    console.warn("Se encontraron anomalías en el registro de eventos:");
    anomalies.forEach(anomaly => console.warn(anomaly));
  }

  console.log("📊 DEBUG BACKEND: Resultado final de getWorkedHoursBetweenDates:");
  console.log("   Worked Hours:", workedHours);
  console.log("   Anomalies:", anomalies);

  return { workedHours, anomalies };
}








static async getWorkedHoursBetweenDatesCSV(startDate, endDate, employeeNumber = null) {
  if (!startDate || !endDate) {
    throw new Error("Debe proporcionar ambas fechas: startDate y endDate.");
  }

  try {
    let query = `
      SELECT *
      FROM dat_events
      WHERE event_date BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];

    // Aplicar filtro por empleado si se proporciona
    if (employeeNumber) {
      query += ` AND employee_number = ?`;
      params.push(employeeNumber);
    }

    query += `
      ORDER BY employee_number ASC, event_date ASC, event_time ASC;
    `;

    // Ejecutar la consulta. Asumimos que 'supabase' es tu pool de conexión MySQL
    // y que su método 'query' devuelve un array de filas (o similar) y maneja errores.
    const [events] = await supabase.query(query, params);

    // console.log("Eventos obtenidos de MySQL:", events); // Para depuración

    if (!events.length) {
      return []; // No se encontraron eventos, devuelve un array vacío
    }

    const workedHours = [];

    // Agrupar eventos por empleado
    const eventsByEmployee = {};
    for (const event of events) {
      if (!eventsByEmployee[event.employee_number]) {
        eventsByEmployee[event.employee_number] = [];
      }
      eventsByEmployee[event.employee_number].push(event);
    }

    // Emparejar entrada y salida para cada empleado
    for (const [employee, empEvents] of Object.entries(eventsByEmployee)) {
      for (let i = 0; i < empEvents.length - 1; i++) {
        const current = empEvents[i];
        const next = empEvents[i + 1];

        if (current.event_type === "0" && next.event_type === "1") {
          // MySQL debería devolver event_date como una cadena 'YYYY-MM-DD'
          // o un objeto Date. La lógica actual maneja ambos casos.
          const entryDateStr = current.event_date instanceof Date ? current.event_date.toISOString().split('T')[0] : current.event_date;
          const exitDateStr = next.event_date instanceof Date ? next.event_date.toISOString().split('T')[0] : next.event_date;

          const entryTime = current.event_time;
          const exitTime = next.event_time;

          const entryTimestamp = new Date(`${entryDateStr}T${entryTime}`);
          const exitTimestamp = new Date(`${exitDateStr}T${exitTime}`);

          const diffMs = exitTimestamp - entryTimestamp;
          const hoursWorked = diffMs / (1000 * 60 * 60); // horas

          workedHours.push({
            numero_empleado: employee,
            fecha_entrada: entryDateStr,
            hora_entrada: entryTime,
            fecha_salida: exitDateStr,
            hora_salida: exitTime,
            horas_trabajadas: Math.round(hoursWorked * 100) / 100,
          });

          i++; // saltar siguiente evento ya emparejado
        }
      }
    }

    return workedHours;

  } catch (error) {
    // Es crucial registrar el error para depuración en el servidor
    console.error(`Error en getWorkedHoursBetweenDatesCSV (MySQL): ${error.message}`);
    throw new Error(`Error al obtener datos para CSV: ${error.message}`);
  }
}


}




module.exports = DatEvent;

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
  // --- 1. Robust Input Validation ---
  if (!startDate || !endDate) {
    throw new Error("Fechas de inicio y fin son requeridas.");
  }

  // Intenta parsear las fechas para validar su formato.
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
    throw new Error("Fechas de inicio o fin inválidas. Use un formato de fecha reconocido (ej. 'YYYY-MM-DD').");
  }

  if (parsedStartDate > parsedEndDate) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin.");
  }

  // Validación opcional para employeeNumber
  if (employeeNumber !== null && (typeof employeeNumber !== 'string' && typeof employeeNumber !== 'number')) {
    throw new Error("El número de empleado debe ser una cadena o un número, o nulo.");
  }

  // --- 2. Database Query with Error Handling ---
  // Selecciona solo las columnas necesarias para mayor eficiencia.
  let sql = `
    SELECT employee_number, event_date, event_time
    FROM dat_events
    WHERE event_date BETWEEN ? AND ?
  `;
  const params = [startDate, endDate];

  if (employeeNumber) {
    sql += ` AND employee_number = ?`;
    params.push(employeeNumber);
  }

  // El ORDEN es CRUCIAL para inferir el tipo de evento (entrada/salida) por secuencia.
  // Asegura que los eventos estén ordenados por empleado, luego por fecha y hora.
  sql += ` ORDER BY employee_number, event_date ASC, event_time ASC`;

  let events;
  try {
    [events] = await supabase.execute(sql, params); // Asumo que `supabase` es tu cliente de DB.
    if (!events || events.length === 0) {
      console.log("🐛 DEBUG - No se encontraron eventos para los criterios de búsqueda.");
      return { workedHours: [], anomalies: [] }; // Retorna temprano si no hay eventos.
    }
  } catch (dbError) {
    console.error("❌ ERROR - Error al consultar la base de datos:", dbError.message);
    throw new Error("No se pudieron recuperar los eventos de la base de datos. Intente de nuevo más tarde.");
  }

  // --- 3. Centralized Date Formatting (Helper Function) ---
  // Esta función asegura que las fechas se formateen consistentemente y maneja valores inválidos.
  const safeFormatDate = (dateLike) => {
    try {
      if (dateLike instanceof Date) {
        if (isNaN(dateLike.getTime())) {
          return 'Fecha inválida';
        }
        return dateLike.toISOString().substring(0, 10); // Formato YYYY-MM-DD
      }
      // Intenta convertir la cadena a Date y luego formatear.
      const d = new Date(dateLike);
      if (isNaN(d.getTime())) {
        return String(dateLike).substring(0, 10); // Fallback para cadenas no parseables
      }
      return d.toISOString().substring(0, 10);
    } catch (error) {
      console.warn(`⚠️ ADVERTENCIA: Error al formatear la fecha "${dateLike}": ${error.message}`);
      return 'Fecha con error de formato';
    }
  };

  // --- 4. Anomaly and Result Initialization ---
  const workedHours = [];
  const anomalies = [];

  // --- 5. Group Events by Employee ---
  // Agrupa todos los eventos por número de empleado para procesarlos individualmente.
  const eventsByEmployee = events.reduce((acc, event) => {
    if (!acc[event.employee_number]) {
      acc[event.employee_number] = [];
    }
    acc[event.employee_number].push(event);
    return acc;
  }, {});

  // --- 6. Define Anomaly Thresholds (Constants for Clarity and Easy Adjustment) ---
  const SHORT_SHIFT_THRESHOLD_HOURS = 0.1; // Turnos extremadamente cortos (ej. < 6 minutos)
  const NORMAL_SHIFT_MIN_HOURS = 7.5;     // Mínimo para un turno considerado "normal"
  const NORMAL_SHIFT_MAX_HOURS = 9.5;     // Máximo para un turno considerado "normal"

  // ¡¡¡AJUSTE CRUCIAL BASADO EN TU ACLARACIÓN!!!
  // Si los turnos NO exceden las 12 horas (ni los nocturnos), este es el límite absoluto
  // para considerar un par Entrada-Salida como un turno VÁLIDO para el cómputo de horas.
  const MAX_ALLOWED_SHIFT_HOURS = 12.5; // Un pequeño margen sobre 12 horas.

  // --- 7. Process Events for Each Employee ---
  for (const [employee, empEvents] of Object.entries(eventsByEmployee)) {
    let lastEntry = null; // Almacena la última "entrada" asumida para emparejar.

    for (let i = 0; i < empEvents.length; i++) {
      const currentEvent = empEvents[i];
      const formattedCurrentDate = safeFormatDate(currentEvent.event_date);
      const currentTimestamp = new Date(`${formattedCurrentDate}T${currentEvent.event_time}`);

      // Validación básica para la fecha/hora del evento actual.
      if (isNaN(currentTimestamp.getTime())) {
        anomalies.push({
          type: "Evento con Fecha/Hora Inválida",
          employee_number: employee,
          event: { ...currentEvent, event_date: formattedCurrentDate },
          message: `Evento en ${formattedCurrentDate} ${currentEvent.event_time} tiene fecha/hora inválida y no puede ser procesado.`,
        });
        continue; // Saltar este evento inválido.
      }

      if (lastEntry === null) {
        // No hay una entrada pendiente, este evento es la primera "entrada" de un posible turno.
        lastEntry = currentEvent;
      } else {
        // Hay una entrada pendiente (lastEntry), este currentEvent es una posible "salida".
        const formattedLastEntryDate = safeFormatDate(lastEntry.event_date);
        const entryTimestamp = new Date(`${formattedLastEntryDate}T${lastEntry.event_time}`);

        // Validación de la fecha/hora de la entrada pendiente (aunque ya debería haber sido validada al asignarla).
        if (isNaN(entryTimestamp.getTime())) {
            anomalies.push({
                type: "Entrada Previa con Fecha/Hora Inválida",
                employee_number: employee,
                entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
                message: `La entrada previa en ${formattedLastEntryDate} ${lastEntry.event_time} tiene fecha/hora inválida. Se descartará y el evento actual (${formattedCurrentDate} ${currentEvent.event_time}) se considerará una nueva entrada.`,
            });
            lastEntry = currentEvent; // Descarta la entrada inválida, el evento actual se convierte en la nueva entrada.
            continue;
        }

        // --- Manejo de Eventos Fuera de Secuencia ---
        // Si el evento actual es cronológicamente anterior o igual a la entrada previa,
        // se asume un error (ej. doble picado, registro retroactivo).
        // Se descarta la entrada previa y el evento actual se toma como la nueva entrada.
        if (currentTimestamp <= entryTimestamp) {
          anomalies.push({
            type: "Evento Fuera de Secuencia / Entrada Duplicada / Salida Retroactiva",
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            current_event: { ...currentEvent, event_date: formattedCurrentDate },
            message: `El evento actual (${formattedCurrentDate} ${currentEvent.event_time}) es anterior o igual a la entrada previa (${formattedLastEntryDate} ${lastEntry.event_time}). Se asumirá que la entrada previa fue sobrescrita y el evento actual es una nueva entrada.`,
          });
          lastEntry = currentEvent; // Este evento se convierte en la nueva "entrada".
          continue; // Pasa al siguiente evento para buscar su salida.
        }

        // Calcula las horas trabajadas para el par (Entrada -> Salida).
        const diffMs = currentTimestamp - entryTimestamp;
        let hoursWorked = diffMs / (1000 * 60 * 60);
        hoursWorked = Math.round(hoursWorked * 100) / 100; // Redondea a dos decimales.

        let isAnomaly = false;
        let anomalyReason = null;

        // --- REGLAS DE ANOMALÍAS Y DESCARTE DE TURNOS ---

        if (hoursWorked < SHORT_SHIFT_THRESHOLD_HOURS) {
          // --- Caso 1: Turno Extremadamente Corto (Error de Registro) ---
          // Esto sugiere un error como un doble picado muy rápido.
          // Este par NO se considera un turno válido y se descarta completamente.
          // La secuencia se "resetea" para buscar una nueva entrada.
          isAnomaly = true;
          anomalyReason = "Turno Muy Corto (Descartado)";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            exit_event: { ...currentEvent, event_date: formattedCurrentDate },
            hours_worked: hoursWorked,
            message: `Turno de ${hoursWorked} horas es extremadamente corto (< ${SHORT_SHIFT_THRESHOLD_HOURS}h). Este par se considera un error de registro y se descarta. La entrada previa se marca como sin salida.`,
          });
          lastEntry = null; // Reinicia 'lastEntry' para que el siguiente evento sea una nueva entrada.
          continue; // Pasa al siguiente evento.
        } else if (hoursWorked > MAX_ALLOWED_SHIFT_HOURS) {
          // --- Caso 2: Turno Excede Límite Máximo Permitido (NO ES UN TURNO VÁLIDO) ---
          // Este es el punto crítico para el ejemplo del 10 de marzo con el turno de 15.23h.
          // Si el turno supera el límite de 12.5 horas, no es un turno válido según las reglas de negocio.
          // NO se cuenta en 'workedHours', pero se registra la anomalía.
          // El 'currentEvent' se convierte en la nueva 'lastEntry' para corregir la secuencia.
          isAnomaly = true;
          anomalyReason = "Turno Excede Límite (Descartado)";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            exit_event: { ...currentEvent, event_date: formattedCurrentDate },
            hours_worked: hoursWorked,
            message: `El turno de ${hoursWorked} horas (de ${formattedLastEntryDate} ${lastEntry.event_time} a ${formattedCurrentDate} ${currentEvent.event_time}) excede el límite de ${MAX_ALLOWED_SHIFT_HOURS} horas. Este par NO se considera un turno válido. La entrada previa (${formattedLastEntryDate} ${lastEntry.event_time}) se marca como sin salida.`,
          });
          lastEntry = currentEvent; // El evento actual se toma como la nueva "entrada" para la siguiente secuencia.
          continue; // Pasa al siguiente evento para buscar su salida.
        }

        // --- Casos de Turnos Válidos (No Descartados), pero con Anomalías de Duración ---
        // Si llegamos aquí, el turno está dentro de los límites de SHORT_SHIFT_THRESHOLD_HOURS y MAX_ALLOWED_SHIFT_HOURS.
        // Se calcula y se agrega a workedHours, pero puede tener una anomalía de duración "normal".
        if (hoursWorked < NORMAL_SHIFT_MIN_HOURS) {
          isAnomaly = true;
          anomalyReason = "Turno Demasiado Corto";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            exit_event: { ...currentEvent, event_date: formattedCurrentDate },
            hours_worked: hoursWorked,
            message: `Turno de ${hoursWorked} horas es inferior al mínimo de ${NORMAL_SHIFT_MIN_HOURS}h.`,
          });
        } else if (hoursWorked > NORMAL_SHIFT_MAX_HOURS) {
          isAnomaly = true;
          anomalyReason = "Turno Excesivo";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            exit_event: { ...currentEvent, event_date: formattedCurrentDate },
            hours_worked: hoursWorked,
            message: `Turno de ${hoursWorked} horas excede el máximo de ${NORMAL_SHIFT_MAX_HOURS}h.`,
          });
        }

        // Si el turno no fue descartado en los casos anteriores, se añade a la lista de horas trabajadas.
        workedHours.push({
          employee_number: employee,
          entry_date: formattedLastEntryDate,
          entry_time: lastEntry.event_time,
          exit_date: formattedCurrentDate,
          exit_time: currentEvent.event_time,
          hours_worked: hoursWorked,
          is_anomaly: isAnomaly,
          anomaly_reason: anomalyReason,
        });

        lastEntry = null; // El par (entrada -> salida) se ha completado, se resetea para buscar una nueva entrada.
      }
    }

    // --- 8. Manejo de Entradas Sin Salida al Final del Procesamiento del Empleado ---
    // Si queda una 'lastEntry' al final de los eventos de un empleado, significa que no encontró una salida emparejada.
    if (lastEntry !== null) {
      anomalies.push({
        type: "Entrada Sin Salida Detectada (Fin de Rango)",
        employee_number: employee,
        entry_event: { ...lastEntry, event_date: safeFormatDate(lastEntry.event_date) },
        message: `La última entrada para ${employee} en ${safeFormatDate(lastEntry.event_date)} ${lastEntry.event_time} no tuvo una salida emparejada en el rango de fechas o antes del final de los eventos del empleado.`,
      });
    }
  }

  // --- 9. Consolidar Reporte de Anomalías ---
  // Muestra todas las anomalías encontradas al final del proceso.
  if (anomalies.length > 0) {
    console.warn("⚠️ ADVERTENCIA: Se encontraron anomalías en el registro de eventos:");
    anomalies.forEach(anomaly => console.warn(anomaly));
  }

  console.log("✅ PROCESO COMPLETADO: Cálculo de horas trabajadas.");
  console.log("   Horas Trabajadas Calculadas:", workedHours);
  console.log("   Anomalías Detectadas:", anomalies);

  return { workedHours, anomalies };
}







static async getWorkedHoursBetweenDatesCSV(startDate, endDate, employeeNumber = null) {
  // --- 1. Robust Input Validation ---
  if (!startDate || !endDate) {
    throw new Error("Fechas de inicio y fin son requeridas.");
  }

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
    throw new Error("Fechas de inicio o fin inválidas. Use un formato de fecha reconocido (ej. 'YYYY-MM-DD').");
  }

  if (parsedStartDate > parsedEndDate) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin.");
  }

  if (employeeNumber !== null && (typeof employeeNumber !== 'string' && typeof employeeNumber !== 'number')) {
    throw new Error("El número de empleado debe ser una cadena o un número, o nulo.");
  }

  // --- 2. Database Query with Error Handling ---
  let sql = `
    SELECT employee_number, event_date, event_time
    FROM dat_events
    WHERE event_date BETWEEN ? AND ?
  `;
  const params = [startDate, endDate];

  if (employeeNumber) {
    sql += ` AND employee_number = ?`;
    params.push(employeeNumber);
  }

  // Ordering is CRUCIAL for inferring event types based on sequence
  sql += ` ORDER BY employee_number, event_date ASC, event_time ASC`;

  let events;
  try {
    // Asumo que `supabase.query` es equivalente a `supabase.execute` o la forma correcta de ejecutar la consulta.
    [events] = await supabase.query(sql, params);
    if (!events || events.length === 0) {
      console.log("🐛 DEBUG - No se encontraron eventos para los criterios de búsqueda para CSV.");
      return []; // Retorna un array vacío para CSV si no hay eventos.
    }
  } catch (dbError) {
    console.error("❌ ERROR - Error al consultar la base de datos para CSV:", dbError.message);
    throw new Error("No se pudieron recuperar los eventos de la base de datos para CSV. Intente de nuevo más tarde.");
  }

  // --- 3. Centralized Date Formatting (Helper Function) ---
  // Esta función asegura que las fechas se formateen consistentemente y maneja valores inválidos.
  const safeFormatDate = (dateLike) => {
    try {
      if (dateLike instanceof Date) {
        if (isNaN(dateLike.getTime())) {
          return 'Fecha inválida';
        }
        return dateLike.toISOString().substring(0, 10); // Formato YYYY-MM-DD
      }
      // Intenta convertir la cadena a Date y luego formatear.
      const d = new Date(dateLike);
      if (isNaN(d.getTime())) {
        return String(dateLike).substring(0, 10); // Fallback para cadenas no parseables
      }
      return d.toISOString().substring(0, 10);
    } catch (error) {
      console.warn(`⚠️ ADVERTENCIA: Error al formatear la fecha "${dateLike}" para CSV: ${error.message}`);
      return 'Fecha con error de formato';
    }
  };

  // --- 4. Anomaly and Result Initialization ---
  const workedHoursForCSV = [];
  const anomalies = []; // Sigue siendo útil para registro interno/depuración.

  // --- 5. Define Anomaly Thresholds (Constants for Clarity and Easy Adjustment) ---
  const SHORT_SHIFT_THRESHOLD_HOURS = 0.1; // Turnos extremadamente cortos (ej. < 6 minutos)
  const NORMAL_SHIFT_MIN_HOURS = 7.5;     // Mínimo para un turno considerado "normal"
  const NORMAL_SHIFT_MAX_HOURS = 9.5;     // Máximo para un turno considerado "normal"

  // ¡¡¡AJUSTE CRUCIAL BASADO EN TU ACLARACIÓN!!!
  // Si los turnos NO exceden las 12 horas (ni los nocturnos), este es el límite absoluto
  // para considerar un par Entrada-Salida como un turno VÁLIDO para el cómputo de horas.
  const MAX_ALLOWED_SHIFT_HOURS = 12.5; // Un pequeño margen sobre 12 horas.

  // --- 6. Group Events by Employee ---
  const eventsByEmployee = events.reduce((acc, event) => {
    if (!acc[event.employee_number]) {
      acc[event.employee_number] = [];
    }
    acc[event.employee_number].push(event);
    return acc;
  }, {});

  // --- 7. Process Events for Each Employee ---
  for (const [employee, empEvents] of Object.entries(eventsByEmployee)) {
    let lastEntry = null; // Almacena la última "entrada" asumida para emparejar.

    for (let i = 0; i < empEvents.length; i++) {
      const currentEvent = empEvents[i];
      const formattedCurrentDate = safeFormatDate(currentEvent.event_date);
      const currentTimestamp = new Date(`${formattedCurrentDate}T${currentEvent.event_time}`);

      // Validación básica para la fecha/hora del evento actual.
      if (isNaN(currentTimestamp.getTime())) {
        anomalies.push({
          type: "Evento con Fecha/Hora Inválida",
          employee_number: employee,
          event: { ...currentEvent, event_date: formattedCurrentDate },
          message: `Evento en ${formattedCurrentDate} ${currentEvent.event_time} tiene fecha/hora inválida y no puede ser procesado.`,
        });
        continue; // Saltar este evento inválido.
      }

      if (lastEntry === null) {
        // No hay una entrada pendiente, este evento es la primera "entrada" de un posible turno.
        lastEntry = currentEvent;
      } else {
        // Hay una entrada pendiente (lastEntry), este currentEvent es una posible "salida".
        const formattedLastEntryDate = safeFormatDate(lastEntry.event_date);
        const entryTimestamp = new Date(`${formattedLastEntryDate}T${lastEntry.event_time}`);

        // Validación de la fecha/hora de la entrada pendiente.
        if (isNaN(entryTimestamp.getTime())) {
            anomalies.push({
                type: "Entrada Previa con Fecha/Hora Inválida",
                employee_number: employee,
                entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
                message: `La entrada previa en ${formattedLastEntryDate} ${lastEntry.event_time} tiene fecha/hora inválida. Se descartará y el evento actual (${formattedCurrentDate} ${currentEvent.event_time}) se considerará una nueva entrada.`,
            });
            lastEntry = currentEvent; // Descarta la entrada inválida, el evento actual se convierte en la nueva entrada.
            continue;
        }

        // --- Manejo de Eventos Fuera de Secuencia ---
        // Si el evento actual es cronológicamente anterior o igual a la entrada previa,
        // se asume un error (ej. doble picado, registro retroactivo).
        // Se descarta la entrada previa y el evento actual se toma como la nueva entrada.
        if (currentTimestamp <= entryTimestamp) {
          anomalies.push({
            type: "Evento Fuera de Secuencia / Entrada Duplicada / Salida Retroactiva",
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            current_event: { ...currentEvent, event_date: formattedCurrentDate },
            message: `El evento actual (${formattedCurrentDate} ${currentEvent.event_time}) es anterior o igual a la entrada previa (${formattedLastEntryDate} ${lastEntry.event_time}). Se asumirá que la entrada previa fue sobrescrita y el evento actual es una nueva entrada.`,
          });
          lastEntry = currentEvent; // Este evento se convierte en la nueva "entrada".
          continue; // Pasa al siguiente evento para buscar su salida.
        }

        // Calcula las horas trabajadas para el par (Entrada -> Salida).
        const diffMs = currentTimestamp - entryTimestamp;
        let hoursWorked = diffMs / (1000 * 60 * 60);
        hoursWorked = Math.round(hoursWorked * 100) / 100; // Redondea a dos decimales.

        let isAnomaly = false; // Se usará internamente para el reporte de anomalías detallado.
        let anomalyReason = null;

        // --- REGLAS DE ANOMALÍAS Y DESCARTE DE TURNOS ---

        if (hoursWorked < SHORT_SHIFT_THRESHOLD_HOURS) {
          // --- Caso 1: Turno Extremadamente Corto (Error de Registro) ---
          // Este par NO se considera un turno válido y se descarta completamente.
          // La secuencia se "resetea" para buscar una nueva entrada.
          isAnomaly = true;
          anomalyReason = "Turno Muy Corto (Descartado)";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            exit_event: { ...currentEvent, event_date: formattedCurrentDate },
            hours_worked: hoursWorked,
            message: `Turno de ${hoursWorked} horas es extremadamente corto (< ${SHORT_SHIFT_THRESHOLD_HOURS}h). Este par se considera un error de registro y se descarta. La entrada previa se marca como sin salida.`,
          });
          lastEntry = null; // Reinicia 'lastEntry' para que el siguiente evento sea una nueva entrada.
          continue; // Pasa al siguiente evento.
        } else if (hoursWorked > MAX_ALLOWED_SHIFT_HOURS) {
          // --- Caso 2: Turno Excede Límite Máximo Permitido (NO ES UN TURNO VÁLIDO) ---
          // Si el turno supera el límite de 12.5 horas, no es un turno válido para el cómputo de horas.
          // NO se cuenta en 'workedHoursForCSV', pero se registra la anomalía.
          // El 'currentEvent' se convierte en la nueva 'lastEntry' para corregir la secuencia.
          isAnomaly = true;
          anomalyReason = "Turno Excede Límite (Descartado)";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            exit_event: { ...currentEvent, event_date: formattedCurrentDate },
            hours_worked: hoursWorked,
            message: `El turno de ${hoursWorked} horas (de ${formattedLastEntryDate} ${lastEntry.event_time} a ${formattedCurrentDate} ${currentEvent.event_time}) excede el límite de ${MAX_ALLOWED_SHIFT_HOURS} horas. Este par NO se considera un turno válido. La entrada previa (${formattedLastEntryDate} ${lastEntry.event_time}) se marca como sin salida.`,
          });
          lastEntry = currentEvent; // El evento actual se toma como la nueva "entrada" para la siguiente secuencia.
          continue; // Pasa al siguiente evento para buscar su salida.
        }

        // --- Casos de Turnos Válidos (No Descartados), pero con Posibles Anomalías de Duración ---
        // Si llegamos aquí, el turno está dentro de los límites de SHORT_SHIFT_THRESHOLD_HOURS y MAX_ALLOWED_SHIFT_HOURS.
        // Se calcula y se agrega a workedHoursForCSV, pero puede tener una anomalía de duración "normal".
        if (hoursWorked < NORMAL_SHIFT_MIN_HOURS) {
          isAnomaly = true;
          anomalyReason = "Turno Demasiado Corto";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            exit_event: { ...currentEvent, event_date: formattedCurrentDate },
            hours_worked: hoursWorked,
            message: `Turno de ${hoursWorked} horas es inferior al mínimo de ${NORMAL_SHIFT_MIN_HOURS}h.`,
          });
        } else if (hoursWorked > NORMAL_SHIFT_MAX_HOURS) {
          isAnomaly = true;
          anomalyReason = "Turno Excesivo";
          anomalies.push({
            type: anomalyReason,
            employee_number: employee,
            entry_event: { ...lastEntry, event_date: formattedLastEntryDate },
            exit_event: { ...currentEvent, event_date: formattedCurrentDate },
            hours_worked: hoursWorked,
            message: `Turno de ${hoursWorked} horas excede el máximo de ${NORMAL_SHIFT_MAX_HOURS}h.`,
          });
        }

        // Si el turno no fue descartado en los casos anteriores (muy corto o excesivo), se añade al CSV.
        workedHoursForCSV.push({
          numero_empleado: employee,
          fecha_entrada: formattedLastEntryDate,
          hora_entrada: lastEntry.event_time,
          fecha_salida: formattedCurrentDate,
          hora_salida: currentEvent.event_time,
          horas_trabajadas: hoursWorked,
          // Las columnas 'is_anomaly' y 'anomaly_reason' no suelen ir en CSV directo,
          // pero si se necesitan, se pueden añadir aquí. Por ahora, se omiten para un CSV más limpio.
        });

        lastEntry = null; // El par (entrada -> salida) se ha completado, se resetea para buscar una nueva entrada.
      }
    }

    // --- 8. Manejo de Entradas Sin Salida al Final del Procesamiento del Empleado ---
    // Si queda una 'lastEntry' al final de los eventos de un empleado, significa que no encontró una salida emparejada.
    if (lastEntry !== null) {
      anomalies.push({
        type: "Entrada Sin Salida Detectada (Fin de Rango)",
        employee_number: employee,
        entry_event: { ...lastEntry, event_date: safeFormatDate(lastEntry.event_date) },
        message: `La última entrada para ${employee} en ${safeFormatDate(lastEntry.event_date)} ${lastEntry.event_time} no tuvo una salida emparejada en el rango de fechas o antes del final de los eventos del empleado.`,
      });
    }
  }

  // --- 9. Consolidar Reporte de Anomalías ---
  if (anomalies.length > 0) {
      console.warn("⚠️ ADVERTENCIA: Se encontraron anomalías durante la generación del CSV:", anomalies);
  } else {
      console.log("✅ PROCESO COMPLETADO: Generación de datos para CSV sin anomalías.");
  }

  return workedHoursForCSV;
}


}




module.exports = DatEvent;

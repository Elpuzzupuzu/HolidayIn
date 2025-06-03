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
    const [rows] = await connection.query(`
      SELECT
          employee_number,
          event_date AS entry_date,
          event_time AS entry_time,
          next_event_date AS exit_date,
          next_event_time AS exit_time,
          ROUND(
              TIMESTAMPDIFF(SECOND,
                  CONCAT(event_date, ' ', event_time),
                  CONCAT(next_event_date, ' ', next_event_time)
              ) / 3600, 2
          ) AS hours_worked
      FROM (
          SELECT
              employee_number,
              event_date,
              event_time,
              event_type,
              LEAD(event_type) OVER (PARTITION BY employee_number ORDER BY event_date, event_time) AS next_event_type,
              LEAD(event_date) OVER (PARTITION BY employee_number ORDER BY event_date, event_time) AS next_event_date,
              LEAD(event_time) OVER (PARTITION BY employee_number ORDER BY event_date, event_time) AS next_event_time
          FROM dat_events
      ) AS sequenced
      WHERE event_type = '0' AND next_event_type = '1'
      ORDER BY employee_number, entry_date, entry_time
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    connection.release();

    // 🔄 Formateo de fechas y conversión de horas trabajadas
    const formattedRows = rows.map(row => ({
      ...row,
      entry_date: new Date(row.entry_date).toISOString().split("T")[0],
      exit_date: new Date(row.exit_date).toISOString().split("T")[0],
      hours_worked: parseFloat(row.hours_worked)
    }));

    return {
      page,
      limit,
      data: formattedRows,
    };
  } catch (err) {
    connection.release();
    throw new Error(`Error obteniendo las horas trabajadas: ${err.message}`);
  }
}


/// esto busca por departamento y filtra por un rango de fechas A



static async getTotalWorkedHoursByDepartment(department_id, from, to) {
  if (!from || !to) throw new Error("Se requieren fechas 'from' y 'to'.");
  const connection = await supabase.getConnection();

  try {
    // 1) Obtener el nombre del departamento
    const [deptRows] = await connection.query(
      "SELECT name FROM departments WHERE id = ?",
      [department_id]
    );
    if (!deptRows.length) throw new Error("Departamento no encontrado.");
    const departmentName = deptRows[0].name;

    // 2) Obtener empleados del departamento
    const [empRows] = await connection.query(
      "SELECT employee_number, name FROM employees WHERE department_id = ?",
      [department_id]
    );
    if (!empRows.length) {
      connection.release();
      return { department_id, department: departmentName, from, to, data: [] };
    }

    const employeeNumbers = empRows.map((e) => e.employee_number);

    // 3) Obtener eventos del rango de fechas para esos empleados
    const [eventRows] = await connection.query(
      `
      SELECT employee_number, event_type, event_date, event_time
      FROM dat_events
      WHERE employee_number IN (?)
        AND event_date BETWEEN ? AND ?
      ORDER BY employee_number, event_date, event_time
    `,
      [employeeNumbers, from, to]
    );

    // 4) Agrupar eventos por empleado
    const groupedEvents = {};
    for (const ev of eventRows) {
      if (!groupedEvents[ev.employee_number]) {
        groupedEvents[ev.employee_number] = [];
      }
      groupedEvents[ev.employee_number].push(ev);
    }

    // 5) Emparejar entradas/salidas y calcular horas
    const totalsByEmp = {};
    for (const empNum in groupedEvents) {
      const empEvents = groupedEvents[empNum];
      let i = 0;
      while (i < empEvents.length) {
        const entry = empEvents[i];

        if (entry.event_type === '0') {
          let j = i + 1;
          while (j < empEvents.length) {
            const exit = empEvents[j];
            if (exit.event_type === '1') {
              // Construir fechas en formato ISO correctamente (YYYY-MM-DD)
              const dateStr = entry.event_date.toISOString().slice(0, 10);
              const start = new Date(`${dateStr}T${entry.event_time}`);

              const exitDateStr = exit.event_date.toISOString().slice(0, 10);
              const end = new Date(`${exitDateStr}T${exit.event_time}`);

              const diffH = (end - start) / 3600000;

              if (diffH > 0 && diffH < 24) {
                totalsByEmp[empNum] = (totalsByEmp[empNum] || 0) + diffH;
              }

              i = j; // Avanzar al evento de salida
              break;
            }
            j++;
          }
        }
        i++;
      }
    }

    // 6) Armar respuesta final
    const data = empRows.map((e) => ({
      employee_number: e.employee_number,
      name: e.name,
      department: departmentName,
      total_hours: Math.round((totalsByEmp[e.employee_number] || 0) * 100) / 100,
    }));

    connection.release();
    return { department_id, department: departmentName, from, to, data };
  } catch (err) {
    connection.release();
    throw new Error(`Error obteniendo horas por departamento: ${err.message}`);
  }
}





///// revisando ////


static async getTotalWorkedHoursByEmployee(employee_number, from, to) {
  if (!from || !to) throw new Error("Se requieren fechas 'from' y 'to'.");

  try {
    // console.log(`[MONITOR] Buscando eventos para el empleado: ${employee_number} desde: ${from} hasta: ${to}`);
    const [rows] = await supabase.query(
      `
      SELECT *
      FROM dat_events
      WHERE employee_number = ?
        AND event_date BETWEEN ? AND ?
      ORDER BY event_date ASC, event_time ASC
      `,
      [employee_number, from, to]
    );

    // console.log(`[MONITOR] Eventos encontrados: ${rows.length}`);

    if (!rows.length) {
      // console.log(`[MONITOR] No se encontraron eventos para el empleado ${employee_number} en el rango de fechas. Total de horas: 0`);
      return { employee_number, from, to, total_hours: 0 };
    }

    let totalHours = 0;
    // console.log("[MONITOR] Iniciando cálculo de horas...");

    for (let i = 0; i < rows.length - 1; i++) {
      const curr = rows[i];
      const next = rows[i + 1];

    

      if (curr.event_type === "0" && next.event_type === "1") {
        // --- CAMBIO CLAVE AQUÍ ---
        // Asegúrate de que event_date sea un string en formato YYYY-MM-DD
        // Si curr.event_date ya es un objeto Date, usa .toISOString().split('T')[0]
        const currDateStr = curr.event_date instanceof Date ? curr.event_date.toISOString().split('T')[0] : curr.event_date;
        const nextDateStr = next.event_date instanceof Date ? next.event_date.toISOString().split('T')[0] : next.event_date;

        const start = new Date(`${currDateStr}T${curr.event_time}`);
        const end = new Date(`${nextDateStr}T${next.event_time}`);
        // --- FIN DEL CAMBIO CLAVE ---

        const diffHours = (end - start) / 3600000; // 3600000 milisegundos en una hora

        console.log(`[MONITOR] Par de entrada/salida encontrado:`);
        console.log(`[MONITOR]   Entrada: ${start.toLocaleString()}`);
        console.log(`[MONITOR]   Salida: ${end.toLocaleString()}`);
        console.log(`[MONITOR]   Horas calculadas para este par: ${diffHours.toFixed(2)}`);

        totalHours += diffHours;
        // console.log(`[MONITOR]   Total de horas acumuladas hasta ahora: ${totalHours.toFixed(2)}`);
        i++; // Saltar el siguiente evento, ya emparejado
      } else {
        // console.log(`[MONITOR] Saltando par de eventos no válido (curr.event_type: ${curr.event_type}, next.event_type: ${next.event_type})`);
      }
    }

    const roundedTotalHours = Math.round(totalHours * 100) / 100;
    // console.log(`[MONITOR] Cálculo de horas finalizado. Total de horas brutas: ${totalHours.toFixed(2)}`);
    // console.log(`[MONITOR] Total de horas redondeadas: ${roundedTotalHours}`);


    return {
      employee_number,
      from,
      to,
      total_hours: roundedTotalHours,
    };
  } catch (error) {
    // console.error(`[ERROR] Error al obtener eventos del empleado ${employee_number}: ${error.message}`);
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
    const SHORT_SHIFT_THRESHOLD_HOURS = 0.1;
    // --- UMBRALES AJUSTADOS AQUÍ ---
    const NORMAL_SHIFT_MIN_HOURS = 7.5; // Ajustado para incluir turnos como 8.88h como normales
    const NORMAL_SHIFT_MAX_HOURS = 9.5; // Ajustado para incluir turnos como 8.88h como normales
    // --- FIN UMBRALES AJUSTADOS ---
    const MAX_SHIFT_CONSIDERED_VALID_HOURS = 20;

    for (const [employee, empEvents] of Object.entries(eventsByEmployee)) {
      let lastEntry = null;

      for (let i = 0; i < empEvents.length; i++) {
        const currentEvent = empEvents[i];

        if (currentEvent.event_type === "0") { // ENTRADA
          if (lastEntry !== null) {
            anomalies.push({
              type: "Entrada Duplicada (Sin Salida Previa)",
              employee_number: employee,
              entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
              message: `La entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} fue sobrescrita por una nueva entrada sin una salida intermedia.`,
            });
          }
          lastEntry = currentEvent;

        } else if (currentEvent.event_type === "1") { // SALIDA
          if (lastEntry !== null) {
            const entryDate = formatEventDateForMessage(lastEntry);
            const exitDate = formatEventDateForMessage(currentEvent);

            const entryTimestamp = new Date(`${entryDate}T${lastEntry.event_time}`);
            const exitTimestamp = new Date(`${exitDate}T${currentEvent.event_time}`);

            if (isNaN(entryTimestamp.getTime()) || isNaN(exitTimestamp.getTime())) {
              anomalies.push({
                type: "Fecha/Hora Inválida",
                employee_number: employee,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
                message: `Fechas/horas inválidas para el emparejamiento: Entrada ${entryDate} ${lastEntry.event_time}, Salida ${exitDate} ${currentEvent.event_time}.`,
              });
              lastEntry = null;
              continue;
            }

            if (exitTimestamp <= entryTimestamp) {
              anomalies.push({
                type: "Salida Antes/Igual a Entrada",
                employee_number: employee,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
                message: `Salida en ${exitDate} ${currentEvent.event_time} es anterior o igual a la entrada en ${entryDate} ${lastEntry.event_time}.`,
              });
              lastEntry = null;
              continue;
            }

            const diffMs = exitTimestamp - entryTimestamp;
            let hoursWorked = diffMs / (1000 * 60 * 60);

            // REDONDEAR LAS HORAS TRABAJADAS PARA LA COMPARACIÓN TAMBIÉN
            hoursWorked = Math.round(hoursWorked * 100) / 100;

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
                message: `Turno de ${hoursWorked} horas (${entryDate} a ${exitDate}) es extremadamente corto.`,
              });
            } else if (hoursWorked > MAX_SHIFT_CONSIDERED_VALID_HOURS) {
              anomalies.push({
                type: "Turno Excesivamente Largo (Descartado)",
                employee_number: employee,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
                hours_worked: hoursWorked,
                message: `Turno de ${hoursWorked} horas (${entryDate} a ${exitDate}) es demasiado largo y se considera un error de registro.`,
              });
              lastEntry = null;
              continue; // <--- SEGUIR DESCARTANDO Y AVANZANDO
            } else if (hoursWorked < NORMAL_SHIFT_MIN_HOURS) {
              isAnomaly = true;
              anomalyReason = "Turno Demasiado Corto";
              anomalies.push({
                type: anomalyReason,
                employee_number: employee,
                entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
                exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
                hours_worked: hoursWorked,
                message: `Turno de ${hoursWorked} horas (${entryDate} a ${exitDate}) es inferior al mínimo de ${NORMAL_SHIFT_MIN_HOURS}h.`,
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
                message: `Turno de ${hoursWorked} horas (${entryDate} a ${exitDate}) excede el máximo de ${NORMAL_SHIFT_MAX_HOURS}h.`,
              });
            }

            // Solo añadir a workedHours si NO es una anomalía de las que se excluyen (con continue)
            // O si es una anomalía de "advertencia" (ej. corto/excesivo pero aún válido para mostrar).
            if (!isAnomaly || (isAnomaly && anomalyReason !== "Turno Excesivamente Largo (Descartado)")) {
                workedHours.push({
                    employee_number: employee,
                    entry_date: entryDate,
                    entry_time: lastEntry.event_time,
                    exit_date: exitDate,
                    exit_time: currentEvent.event_time,
                    hours_worked: hoursWorked,
                    is_anomaly: isAnomaly, // Esto indicará al frontend si es una anomalía
                    anomaly_reason: anomalyReason,
                });
            }

            lastEntry = null; // Reiniciar para el siguiente par
          } else {
            anomalies.push({
              type: "Salida sin Entrada Previa",
              employee_number: employee,
              exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
              message: `Salida en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} no tiene una entrada previa emparejable.`,
            });
          }
        }
      }

      if (lastEntry !== null) {
        anomalies.push({
          type: "Entrada Final sin Salida",
          employee_number: employee,
          entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
          message: `La última entrada para ${employee} en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} no tuvo una salida.`,
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



// static async getWorkedHoursBetweenDates(startDate, endDate, employeeNumber = null) {
//   let sql = `
//     SELECT *
//     FROM dat_events
//     WHERE event_date BETWEEN ? AND ?
//   `;
//   const params = [startDate, endDate];

//   if (employeeNumber) {
//     sql += ` AND employee_number = ?`;
//     params.push(employeeNumber);
//   }

//   sql += ` ORDER BY employee_number, event_date ASC, event_time ASC`;

//   const [events] = await supabase.execute(sql, params);

//   // --- LOG DEPURACIÓN (sin cambios) ---
//   if (events && events.length > 0) {
//     console.log("🐛 DEBUG - event_date desde MySQL:", events[0]?.event_date, "Tipo:", typeof events[0]?.event_date);
//   } else {
//     console.log("🐛 DEBUG - No se encontraron eventos para depurar event_date.");
//   }
//   // --- FIN DEL LOG ---

//   const workedHours = [];
//   const anomalies = [];

//   // Función auxiliar para formatear cadenas de fecha (sin cambios)
//   const formatEventDateForMessage = (event) => {
//     if (!event || !event.event_date) return 'Fecha desconocida';
//     if (event.event_date instanceof Date) {
//       if (isNaN(event.event_date.getTime())) {
//         return 'Fecha inválida';
//       }
//       return event.event_date.toISOString().substring(0, 10);
//     }
//     return String(event.event_date).substring(0, 10);
//   };

//   const eventsByEmployee = {};
//   for (const event of events) {
//     if (!eventsByEmployee[event.employee_number]) {
//       eventsByEmployee[event.employee_number] = [];
//     }
//     eventsByEmployee[event.employee_number].push(event);
//   }

//   // Definición de umbrales para las anomalías de duración
//   const SHORT_SHIFT_THRESHOLD_HOURS = 0.1; // Menos de 6 minutos, probablemente un error (Ej. Marcaje accidental)
//   const NORMAL_SHIFT_MIN_HOURS = 8;
//   const NORMAL_SHIFT_MAX_HOURS = 12; // Rango normal de turnos
//   const MAX_SHIFT_CONSIDERED_VALID_HOURS = 20; // Un turno máximo que se consideraría válido para cálculo, aunque sea anómalo.

//   for (const [employee, empEvents] of Object.entries(eventsByEmployee)) {
//     let lastEntry = null;

//     for (let i = 0; i < empEvents.length; i++) {
//       const currentEvent = empEvents[i];

//       if (currentEvent.event_type === "0") { // ENTRADA
//         if (lastEntry !== null) {
//           anomalies.push({
//             type: "Entrada Duplicada (Sin Salida Previa)",
//             employee_number: employee,
//             entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
//             message: `La entrada previa en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} fue sobrescrita por una nueva entrada sin una salida intermedia.`,
//           });
//         }
//         lastEntry = currentEvent;

//       } else if (currentEvent.event_type === "1") { // SALIDA
//         if (lastEntry !== null) {
//           const entryDate = formatEventDateForMessage(lastEntry);
//           const exitDate = formatEventDateForMessage(currentEvent);

//           const entryTimestamp = new Date(`${entryDate}T${lastEntry.event_time}`);
//           const exitTimestamp = new Date(`${exitDate}T${currentEvent.event_time}`);

//           // Validación de fechas/horas inválidas
//           if (isNaN(entryTimestamp.getTime()) || isNaN(exitTimestamp.getTime())) {
//             anomalies.push({
//               type: "Fecha/Hora Inválida",
//               employee_number: employee,
//               entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
//               exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
//               message: `Fechas/horas inválidas para el emparejamiento: Entrada ${entryDate} ${lastEntry.event_time}, Salida ${exitDate} ${currentEvent.event_time}.`,
//             });
//             lastEntry = null;
//             continue;
//           }

//           // Validación: Salida anterior o igual a la entrada
//           if (exitTimestamp <= entryTimestamp) {
//             anomalies.push({
//               type: "Salida Antes/Igual a Entrada",
//               employee_number: employee,
//               entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
//               exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
//               message: `Salida en ${exitDate} ${currentEvent.event_time} es anterior o igual a la entrada en ${entryDate} ${lastEntry.event_time}.`,
//             });
//             lastEntry = null;
//             continue;
//           }

//           const diffMs = exitTimestamp - entryTimestamp;
//           const hoursWorked = diffMs / (1000 * 60 * 60);

//           let isAnomaly = false;
//           let anomalyReason = null;

//           // **CAMBIO APLICADO AQUÍ**
//           if (hoursWorked < SHORT_SHIFT_THRESHOLD_HOURS) {
//             isAnomaly = true;
//             anomalyReason = "Turno Muy Corto";
//             anomalies.push({
//               type: anomalyReason,
//               employee_number: employee,
//               entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
//               exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
//               hours_worked: Math.round(hoursWorked * 100) / 100,
//               message: `Turno de ${Math.round(hoursWorked * 100) / 100} horas (${entryDate} a ${exitDate}) es extremadamente corto.`,
//             });
//           } else if (hoursWorked > MAX_SHIFT_CONSIDERED_VALID_HOURS) {
//             // Este caso descarta el turno de las horas trabajadas
//             anomalies.push({
//               type: "Turno Excesivamente Largo (Descartado)",
//               employee_number: employee,
//               entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
//               exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
//               hours_worked: Math.round(hoursWorked * 100) / 100,
//               message: `Turno de ${Math.round(hoursWorked * 100) / 100} horas (${entryDate} a ${exitDate}) es demasiado largo y se considera un error de registro.`,
//             });
//             lastEntry = null;
//             continue;
//           } else if (hoursWorked < NORMAL_SHIFT_MIN_HOURS) {
//             isAnomaly = true;
//             anomalyReason = "Turno Demasiado Corto";
//             anomalies.push({
//               type: anomalyReason,
//               employee_number: employee,
//               entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
//               exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
//               hours_worked: Math.round(hoursWorked * 100) / 100,
//               message: `Turno de ${Math.round(hoursWorked * 100) / 100} horas (${entryDate} a ${exitDate}) es inferior al mínimo de ${NORMAL_SHIFT_MIN_HOURS}h.`,
//             });
//           } else if (hoursWorked > NORMAL_SHIFT_MAX_HOURS) {
//             isAnomaly = true;
//             anomalyReason = "Turno Excesivo"; // Este es el único lugar donde se usa "Turno Excesivo"
//             anomalies.push({
//               type: anomalyReason,
//               employee_number: employee,
//               entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
//               exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
//               hours_worked: Math.round(hoursWorked * 100) / 100,
//               message: `Turno de ${Math.round(hoursWorked * 100) / 100} horas (${entryDate} a ${exitDate}) excede el máximo de ${NORMAL_SHIFT_MAX_HOURS}h.`,
//             });
//           }
//           // FIN DEL CAMBIO

//           workedHours.push({
//             employee_number: employee,
//             entry_date: entryDate,
//             entry_time: lastEntry.event_time,
//             exit_date: exitDate,
//             exit_time: currentEvent.event_time,
//             hours_worked: Math.round(hoursWorked * 100) / 100,
//             is_anomaly: isAnomaly,
//             anomaly_reason: anomalyReason,
//           });

//           lastEntry = null;
//         } else {
//           anomalies.push({
//             type: "Salida sin Entrada Previa",
//             employee_number: employee,
//             exit_event: { ...currentEvent, event_date: formatEventDateForMessage(currentEvent) },
//             message: `Salida en ${formatEventDateForMessage(currentEvent)} ${currentEvent.event_time} no tiene una entrada previa emparejable.`,
//           });
//         }
//       }
//     }

//     if (lastEntry !== null) {
//       anomalies.push({
//         type: "Entrada Final sin Salida",
//         employee_number: employee,
//         entry_event: { ...lastEntry, event_date: formatEventDateForMessage(lastEntry) },
//         message: `La última entrada para ${employee} en ${formatEventDateForMessage(lastEntry)} ${lastEntry.event_time} no tuvo una salida.`,
//       });
//     }
//   }

//   if (anomalies.length > 0) {
//     console.warn("Se encontraron anomalías en el registro de eventos:");
//     anomalies.forEach(anomaly => console.warn(anomaly));
//   }

//   return { workedHours, anomalies };
// }





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

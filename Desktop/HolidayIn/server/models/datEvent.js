const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

class DatEvent {

  //procesa el archivo .dat
  
 static async processDatFile(filePath) {
  const connection = await supabase.getConnection(); // aquí supongo que es tu pool MySQL, renombra si quieres

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

// static async getTotalWorkedHoursByDepartment(department_id, from, to) {
//   if (!from || !to) throw new Error("Se requieren fechas 'from' y 'to'.");

//   // 1) Obtener el nombre del departamento
//   const { data: depts, error: deptErr } = await supabase
//     .from("departments")
//     .select("name")
//     .eq("id", department_id)
//     .single();
//   if (deptErr) throw new Error(deptErr.message);
//   const departmentName = depts.name;

//   // 2) Obtener empleados del departamento
//   const { data: emps, error: empErr } = await supabase
//     .from("employees")
//     .select("employee_number, name")
//     .eq("department_id", department_id);
//   if (empErr) throw new Error(empErr.message);
//   if (!emps.length) {
//     return { department_id, department: departmentName, from, to, data: [] };
//   }

//   // 3) Obtener eventos en el rango
//   const employeeNumbers = emps.map((e) => e.employee_number);
//   const { data: events, error: evErr } = await supabase
//     .from("dat_events")
//     .select("*")
//     .in("employee_number", employeeNumbers)
//     .gte("event_date", from)
//     .lte("event_date", to)
//     .order("employee_number", { ascending: true })
//     .order("event_date", { ascending: true })
//     .order("event_time", { ascending: true });
//   if (evErr) throw new Error(evErr.message);

//   // 4) Agrupar eventos por empleado
//   const groupedEvents = {};
//   for (const ev of events) {
//     if (!groupedEvents[ev.employee_number]) {
//       groupedEvents[ev.employee_number] = [];
//     }
//     groupedEvents[ev.employee_number].push(ev);
//   }

//   // 5) Emparejar entradas/salidas secuenciales y calcular horas
//   const totalsByEmp = {};

//   for (const empNum in groupedEvents) {
//     const empEvents = groupedEvents[empNum];

//     let i = 0;
//     while (i < empEvents.length) {
//       const entry = empEvents[i];

//       if (entry.event_type === "0") {
//         // Buscar la siguiente salida
//         let j = i + 1;
//         while (j < empEvents.length) {
//           const exit = empEvents[j];
//           if (exit.event_type === "1") {
//             const start = new Date(`${entry.event_date}T${entry.event_time}`);
//             const end = new Date(`${exit.event_date}T${exit.event_time}`);
//             const diffH = (end - start) / 3600000;

//             if (diffH > 0 && diffH < 24) {
//               totalsByEmp[empNum] = (totalsByEmp[empNum] || 0) + diffH;
//             }

//             i = j; // saltamos al evento de salida
//             break;
//           }
//           j++;
//         }
//       }

//       i++;
//     }
//   }

//   // 6) Armar respuesta
//   const data = emps.map((e) => ({
//     employee_number: e.employee_number,
//     name: e.name,
//     department: departmentName,
//     total_hours: Math.round((totalsByEmp[e.employee_number] || 0) * 100) / 100,
//   }));

//   return { department_id, department: departmentName, from, to, data };
// }

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

      // console.log(`[MONITOR] Procesando evento actual (curr):`, curr);
      // console.log(`[MONITOR] Procesando siguiente evento (next):`, next);

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

        // console.log(`[MONITOR] Par de entrada/salida encontrado:`);
        // console.log(`[MONITOR]   Entrada: ${start.toLocaleString()}`);
        // console.log(`[MONITOR]   Salida: ${end.toLocaleString()}`);
        // console.log(`[MONITOR]   Horas calculadas para este par: ${diffHours.toFixed(2)}`);

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

  sql += ` ORDER BY employee_number, event_date, event_time`;

  const [events] = await supabase.execute(sql, params);

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
        const entryDate = current.event_date instanceof Date 
          ? current.event_date.toISOString().substring(0, 10) 
          : current.event_date.toString().substring(0, 10);

        const exitDate = next.event_date instanceof Date 
          ? next.event_date.toISOString().substring(0, 10) 
          : next.event_date.toString().substring(0, 10);

        const entryTimestamp = new Date(`${entryDate}T${current.event_time}`);
        const exitTimestamp = new Date(`${exitDate}T${next.event_time}`);

        if (!isNaN(entryTimestamp) && !isNaN(exitTimestamp) && exitTimestamp > entryTimestamp) {
          const diffMs = exitTimestamp - entryTimestamp;
          const hoursWorked = diffMs / (1000 * 60 * 60);

          workedHours.push({
            employee_number: employee,
            entry_date: entryDate,
            entry_time: current.event_time,
            exit_date: exitDate,
            exit_time: next.event_time,
            hours_worked: Math.round(hoursWorked * 100) / 100,
          });

          i++; // saltar siguiente evento ya emparejado
        } else {
          console.warn(`Fechas inválidas o fuera de orden: ${entryTimestamp} -> ${exitTimestamp}`);
        }
      }
    }
  }

  return workedHours;
}



///testing




// static async getWorkedHoursBetweenDatesCSV(startDate, endDate, employeeNumber = null) {
//   if (!startDate || !endDate) {
//     throw new Error("Debe proporcionar ambas fechas: startDate y endDate");
//   }

//   // Construir consulta base
//   let query = supabase
//     .from("dat_events")
//     .select("*")
//     .gte("event_date", startDate)
//     .lte("event_date", endDate)
//     .order("employee_number", { ascending: true })
//     .order("event_date", { ascending: true })
//     .order("event_time", { ascending: true });

//   // Aplicar filtro por empleado si se proporciona
//   if (employeeNumber) {
//     query = query.eq("employee_number", employeeNumber);
//   }

//   const { data: events, error } = await query;

//   if (error) throw new Error(`Error fetching events: ${error.message}`);

//   const workedHours = [];

//   // Agrupar eventos por empleado
//   const eventsByEmployee = {};
//   for (const event of events) {
//     if (!eventsByEmployee[event.employee_number]) {
//       eventsByEmployee[event.employee_number] = [];
//     }
//     eventsByEmployee[event.employee_number].push(event);
//   }

//   // Emparejar entrada y salida para cada empleado
//   for (const [employee, empEvents] of Object.entries(eventsByEmployee)) {
//     for (let i = 0; i < empEvents.length - 1; i++) {
//       const current = empEvents[i];
//       const next = empEvents[i + 1];

//       if (current.event_type === "0" && next.event_type === "1") {
//         // --- CAMBIO CLAVE AQUÍ ---
//         // Asegúrate de que event_date sea un string en formato YYYY-MM-DD
//         // Si ya es un objeto Date, usa .toISOString().split('T')[0]
//         const entryDateStr = current.event_date instanceof Date ? current.event_date.toISOString().split('T')[0] : current.event_date;
//         const exitDateStr = next.event_date instanceof Date ? next.event_date.toISOString().split('T')[0] : next.event_date;

//         const entryTime = current.event_time;
//         const exitTime = next.event_time;

//         const entryTimestamp = new Date(`${entryDateStr}T${entryTime}`);
//         const exitTimestamp = new Date(`${exitDateStr}T${exitTime}`);
//         // --- FIN DEL CAMBIO CLAVE ---

//         const diffMs = exitTimestamp - entryTimestamp;
//         const hoursWorked = diffMs / (1000 * 60 * 60); // horas

//         workedHours.push({
//           numero_empleado: employee,
//           fecha_entrada: entryDateStr, // Usar el string formateado si es necesario
//           hora_entrada: entryTime,
//           fecha_salida: exitDateStr, // Usar el string formateado si es necesario
//           hora_salida: exitTime,
//           horas_trabajadas: Math.round(hoursWorked * 100) / 100,
//         });

//         i++; // saltar siguiente evento ya emparejado
//       }
//     }
//   }

//   return workedHours;
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

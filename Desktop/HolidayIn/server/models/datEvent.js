const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

class DatEvent {

  static async processDatFile(filePath) {
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
        const event_type_raw = parts[4]; // valor correcto de tipo de evento

        if (!employee_number || !event_date || !event_time || !event_type_raw) {
          throw new Error(`Línea mal formada: ${line}`);
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date) || !/^\d{2}:\d{2}:\d{2}$/.test(event_time)) {
          throw new Error(`Fecha/hora mal formadas en la línea: ${line}`);
        }

        const event_type = event_type_raw === "0" ? 0 : 1;

        return {
          employee_number,
          event_type,
          event_date,
          event_time,
        };
      });

      const { data, error } = await supabase.from("dat_events").insert(events);

      if (error) throw new Error(`Error al insertar eventos: ${error.message}`);

      return { message: `${events.length} eventos insertados`, data };
    } catch (err) {
      throw new Error(`Error procesando el archivo .dat: ${err.message}`);
    }
  }
  


  

static async getWorkedHoursPerDay(page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .rpc("get_worked_hours")
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return {
      page,
      limit,
      data,
    };
  }


// static async getWorkedHoursByEmployee(employee_number, page = 1, limit = 10, from = null, to = null) {
//   const fromIndex = (page - 1) * limit;
//   const toIndex = fromIndex + limit - 1;

//   // Consulta básica para obtener todos los eventos filtrados por employee_number
//   // Luego los pares entrada-salida y calculo horas

//   // Primero traemos todos los eventos del empleado (podemos filtrar por fecha si se provee)
//   let query = supabase
//     .from("dat_events")
//     .select("*")
//     .eq("employee_number", employee_number)
//     .order("event_date", { ascending: true })
//     .order("event_time", { ascending: true });

//   if (from) {
//     query = query.gte("event_date", from);
//   }

//   if (to) {
//     query = query.lte("event_date", to);
//   }

//   const { data: events, error } = await query;

//   if (error) throw new Error(error.message);
//   if (!events.length) return { page, limit, total: 0, data: [] };

//   // Aquí procesamos el array 'events' para crear pares entrada-salida y calcular horas trabajadas
//   // similar a lo que hiciste antes...

//   // Filtramos eventos para pares (entrada=0 seguida de salida=1)
//   const pairedEvents = [];
//   for (let i = 0; i < events.length - 1; i++) {
//     const curr = events[i];
//     const next = events[i + 1];
//     if (curr.event_type === "0" && next.event_type === "1") {
//       // Validamos que next sea el siguiente evento del mismo empleado (ya que filtramos por employee_number)
//       // Calculamos horas
//       const start = new Date(`${curr.event_date}T${curr.event_time}`);
//       const end = new Date(`${next.event_date}T${next.event_time}`);
//       const diffHours = (end - start) / 3600000;

//       pairedEvents.push({
//         employee_number,
//         entry_date: curr.event_date,
//         entry_time: curr.event_time,
//         exit_date: next.event_date,
//         exit_time: next.event_time,
//         hours_worked: Math.round(diffHours * 100) / 100,
//       });
//     }
//   }

//   const total = pairedEvents.length;
//   const data = pairedEvents.slice(fromIndex, toIndex + 1);

//   return { page, limit, total, data };
// }


static async getTotalWorkedHoursByEmployee(employee_number, from, to) {
  if (!from || !to) throw new Error("Se requieren fechas 'from' y 'to'.");

  let query = supabase
    .from("dat_events")
    .select("*")
    .eq("employee_number", employee_number)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  const { data: events, error } = await query;

  if (error) throw new Error(error.message);
  if (!events.length) return { employee_number, from, to, total_hours: 0 };

  let totalHours = 0;

  for (let i = 0; i < events.length - 1; i++) {
    const curr = events[i];
    const next = events[i + 1];

    if (curr.event_type === "0" && next.event_type === "1") {
      // Emparejar entrada-salida consecutiva
      const start = new Date(`${curr.event_date}T${curr.event_time}`);
      const end = new Date(`${next.event_date}T${next.event_time}`);
      const diffHours = (end - start) / 3600000; // diferencia en horas

      totalHours += diffHours;
      i++; // saltar el siguiente evento (ya emparejado)
    }
  }

  return {
    employee_number,
    from,
    to,
    total_hours: Math.round(totalHours * 100) / 100, // redondeo a 2 decimales
  };
}

/// por departamento : 

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

//   // 2) Listar todos los empleados de ese departamento
//   const { data: emps, error: empErr } = await supabase
//     .from("employees")
//     .select("employee_number, name")
//     .eq("department_id", department_id);
//   if (empErr) throw new Error(empErr.message);
//   if (!emps.length) {
//     return { department_id, department: departmentName, from, to, data: [] };
//   }

//   // 3) Obtener eventos de esos empleados en el rango
//   const employeeNumbers = emps.map((e) => e.employee_number);
//   const { data: events, error: evErr } = await supabase
//     .from("dat_events")
//     .select("*")
//     .in("employee_number", employeeNumbers)
//     .gte("event_date", from)
//     .lte("event_date", to)
//     .order("event_date", { ascending: true })
//     .order("event_time", { ascending: true });
//   if (evErr) throw new Error(evErr.message);

//   // 4) Agrupar eventos por empleado y por fecha
//   const groupedEvents = {};

//   for (const ev of events) {
//     const key = `${ev.employee_number}-${ev.event_date}`;
//     if (!groupedEvents[key]) {
//       groupedEvents[key] = [];
//     }
//     groupedEvents[key].push(ev);
//   }

//   const totalsByEmp = {};

//   for (const key in groupedEvents) {
//     const dailyEvents = groupedEvents[key];

//     // Ordenar eventos por hora por seguridad
//     dailyEvents.sort((a, b) => {
//       const t1 = new Date(`${a.event_date}T${a.event_time}`);
//       const t2 = new Date(`${b.event_date}T${b.event_time}`);
//       return t1 - t2;
//     });

//     const empNum = dailyEvents[0].employee_number;
//     let i = 0;
//     while (i < dailyEvents.length) {
//       const entry = dailyEvents[i];

//       if (entry.event_type === "0") {
//         // Buscar la siguiente salida
//         let j = i + 1;
//         while (j < dailyEvents.length) {
//           const exit = dailyEvents[j];
//           if (exit.event_type === "1") {
//             const start = new Date(`${entry.event_date}T${entry.event_time}`);
//             const end   = new Date(`${exit.event_date}T${exit.event_time}`);
//             const diffH = (end - start) / 3600000;

//             if (diffH > 0) {
//               totalsByEmp[empNum] = (totalsByEmp[empNum] || 0) + diffH;
//             }

//             i = j; // saltamos al índice del evento de salida
//             break;
//           }
//           j++;
//         }
//       }

//       i++;
//     }
//   }

//   // 5) Formar el array de respuesta
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

  // 1) Obtener el nombre del departamento
  const { data: depts, error: deptErr } = await supabase
    .from("departments")
    .select("name")
    .eq("id", department_id)
    .single();
  if (deptErr) throw new Error(deptErr.message);
  const departmentName = depts.name;

  // 2) Obtener empleados del departamento
  const { data: emps, error: empErr } = await supabase
    .from("employees")
    .select("employee_number, name")
    .eq("department_id", department_id);
  if (empErr) throw new Error(empErr.message);
  if (!emps.length) {
    return { department_id, department: departmentName, from, to, data: [] };
  }

  // 3) Obtener eventos en el rango
  const employeeNumbers = emps.map((e) => e.employee_number);
  const { data: events, error: evErr } = await supabase
    .from("dat_events")
    .select("*")
    .in("employee_number", employeeNumbers)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("employee_number", { ascending: true })
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });
  if (evErr) throw new Error(evErr.message);

  // 4) Agrupar eventos por empleado
  const groupedEvents = {};
  for (const ev of events) {
    if (!groupedEvents[ev.employee_number]) {
      groupedEvents[ev.employee_number] = [];
    }
    groupedEvents[ev.employee_number].push(ev);
  }

  // 5) Emparejar entradas/salidas secuenciales y calcular horas
  const totalsByEmp = {};

  for (const empNum in groupedEvents) {
    const empEvents = groupedEvents[empNum];

    let i = 0;
    while (i < empEvents.length) {
      const entry = empEvents[i];

      if (entry.event_type === "0") {
        // Buscar la siguiente salida
        let j = i + 1;
        while (j < empEvents.length) {
          const exit = empEvents[j];
          if (exit.event_type === "1") {
            const start = new Date(`${entry.event_date}T${entry.event_time}`);
            const end = new Date(`${exit.event_date}T${exit.event_time}`);
            const diffH = (end - start) / 3600000;

            if (diffH > 0 && diffH < 24) {
              totalsByEmp[empNum] = (totalsByEmp[empNum] || 0) + diffH;
            }

            i = j; // saltamos al evento de salida
            break;
          }
          j++;
        }
      }

      i++;
    }
  }

  // 6) Armar respuesta
  const data = emps.map((e) => ({
    employee_number: e.employee_number,
    name: e.name,
    department: departmentName,
    total_hours: Math.round((totalsByEmp[e.employee_number] || 0) * 100) / 100,
  }));

  return { department_id, department: departmentName, from, to, data };
}







}




module.exports = DatEvent;

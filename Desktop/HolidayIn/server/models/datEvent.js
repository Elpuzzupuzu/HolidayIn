const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

class DatEvent {

  //procesa el archivo .dat
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
  

/// este trae todos los registros globales del .dat procesado:
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




/// esto busca por departamento y filtra por un rango de fechas A

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



//// este calcula las horas para cada empleado en un intervalo dado 
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


static async getWorkedHoursBetweenDates(startDate, endDate, employeeNumber = null) {
  if (!startDate || !endDate) {
    throw new Error("Debe proporcionar ambas fechas: startDate y endDate");
  }

  // Construir consulta base
  let query = supabase
    .from("dat_events")
    .select("*")
    .gte("event_date", startDate)
    .lte("event_date", endDate)
    .order("employee_number", { ascending: true })
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  // Aplicar filtro por empleado si se proporciona
  if (employeeNumber) {
    query = query.eq("employee_number", employeeNumber);
  }

  const { data: events, error } = await query;

  if (error) throw new Error(`Error fetching events: ${error.message}`);

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
        const entryDate = current.event_date;
        const entryTime = current.event_time;
        const exitDate = next.event_date;
        const exitTime = next.event_time;

        const entryTimestamp = new Date(`${entryDate}T${entryTime}`);
        const exitTimestamp = new Date(`${exitDate}T${exitTime}`);

        const diffMs = exitTimestamp - entryTimestamp;
        const hoursWorked = diffMs / (1000 * 60 * 60); // horas

        workedHours.push({
          employee_number: employee,
          entry_date: entryDate,
          entry_time: entryTime,
          exit_date: exitDate,
          exit_time: exitTime,
          hours_worked: Math.round(hoursWorked * 100) / 100,
        });

        i++; // saltar siguiente evento ya emparejado
      }
    }
  }

  return workedHours;
}

///testing


static async getWorkedHoursBetweenDatesCSV(startDate, endDate, employeeNumber = null) {
  if (!startDate || !endDate) {
    throw new Error("Debe proporcionar ambas fechas: startDate y endDate");
  }

  // Construir consulta base
  let query = supabase
    .from("dat_events")
    .select("*")
    .gte("event_date", startDate)
    .lte("event_date", endDate)
    .order("employee_number", { ascending: true })
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  // Aplicar filtro por empleado si se proporciona
  if (employeeNumber) {
    query = query.eq("employee_number", employeeNumber);
  }

  const { data: events, error } = await query;

  if (error) throw new Error(`Error fetching events: ${error.message}`);

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
        const entryDate = current.event_date;
        const entryTime = current.event_time;
        const exitDate = next.event_date;
        const exitTime = next.event_time;

        const entryTimestamp = new Date(`${entryDate}T${entryTime}`);
        const exitTimestamp = new Date(`${exitDate}T${exitTime}`);

        const diffMs = exitTimestamp - entryTimestamp;
        const hoursWorked = diffMs / (1000 * 60 * 60); // horas

        workedHours.push({
          numero_empleado: employee,
          fecha_entrada: entryDate,
          hora_entrada: entryTime,
          fecha_salida: exitDate,
          hora_salida: exitTime,
          horas_trabajadas: Math.round(hoursWorked * 100) / 100,
        });

        i++; // saltar siguiente evento ya emparejado
      }
    }
  }

  return workedHours;
}








}




module.exports = DatEvent;

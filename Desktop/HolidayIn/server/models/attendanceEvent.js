const supabase = require("../config/supabase");
const { Parser } = require("json2csv");

class AttendanceEvent {


  static async createEvent(employee_number, event_type) {
  // Validar event_type
  if (!["IN", "OUT"].includes(event_type)) {
    throw new Error("Tipo de evento inválido. Debe ser 'IN' o 'OUT'.");
  }

  // Obtener ID del empleado
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_number", employee_number)
    .single();

  if (empError || !employee) {
    throw new Error("Empleado no encontrado");
  }

  // Obtener último evento
  const { data: lastEvent, error: lastEventError } = await supabase
    .from("attendance_events")
    .select("*")
    .eq("employee_id", employee.id)
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastEventError) throw new Error(lastEventError.message);

  // 🚫 No permitir un OUT como primer evento
  if (!lastEvent && event_type === "OUT") {
    throw new Error("No se puede registrar una salida sin una entrada previa.");
  }

  // 🚫 No permitir dos eventos iguales consecutivos
  if (lastEvent && lastEvent.event_type === event_type) {
    throw new Error(`El último evento ya es un '${event_type}', no se puede registrar dos eventos iguales consecutivos.`);
  }

  // Insertar nuevo evento y retornar el registro insertado
  const { data, error } = await supabase
    .from("attendance_events")
    .insert([{ employee_id: employee.id, event_type, timestamp: new Date() }])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Evento insertado, pero no se devolvieron datos. Verifica permisos (RLS) o políticas de select.");
  }

  return data[0];
}


  static async getAll() {
    const { data, error } = await supabase
      .from("attendance_events")
      .select(`
        id,
        employee_id,
        event_type,
        timestamp,
        employees (
          id,
          name,
          employee_number
        )
      `)
      .order("timestamp", { ascending: false });

    if (error) throw new Error(error.message);

    return data;
  }

  static async getByEmployeeNumber(employee_number) {
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_number", employee_number)
      .single();

    if (empError || !employee) {
      throw new Error("Empleado no encontrado");
    }

    const { data, error } = await supabase
      .from("attendance_events")
      .select(`
        id,
        event_type,
        timestamp
      `)
      .eq("employee_id", employee.id)
      .order("timestamp", { ascending: false });

    if (error) throw new Error(error.message);

    return data;
  }

  static async getByDateRange(startDate, endDate) {
    let query = supabase
      .from("attendance_events")
      .select(`
        id,
        employee_id,
        event_type,
        timestamp,
        employees (
          id,
          name,
          employee_number
        )
      `);

    if (startDate) query = query.gte("timestamp", startDate);
    if (endDate) query = query.lte("timestamp", endDate);

    const { data, error } = await query.order("timestamp", { ascending: false });

    if (error) throw new Error(error.message);

    return data;
  }

  ///
static async exportCSV(startDate, endDate) {
  // Consulta con join a roles
  const query = supabase
    .from("attendance_events")
    .select(`
      id,
      employee_id,
      event_type,
      timestamp,
      employees (
        name,
        employee_number,
        role_id,
        roles (
          name
        )
      )
    `)
    .order("timestamp", { ascending: true });

  if (startDate && endDate) {
    query.gte("timestamp", startDate).lte("timestamp", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No hay registros para el rango de fechas indicado");
  }

  // Mapeamos los datos, incluyendo el nombre del rol
  const formattedData = data.map(row => ({
    employee_number: row.employees?.employee_number || "",
    employee_name: row.employees?.name || "",
    role_name: row.employees?.roles?.name || "Desconocido",
    event_type: row.event_type,
    timestamp: row.timestamp
  }));

  const fields = ["employee_number", "employee_name", "role_name", "event_type", "timestamp"];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(formattedData);

  return csv;
}


//// horas de trabajo 

// static async getWorkedHours() {
//   const { data, error } = await supabase
//     .from("attendance_events")
//     .select(`
//       employee_id,
//       event_type,
//       timestamp,
//       employees (
//         name,
//         employee_number
//       )
//     `)
//     .order("timestamp", { ascending: true });

//   if (error) throw new Error(error.message);

//   const grouped = {};

//   for (const row of data) {
//     const date = new Date(row.timestamp);
//     const day = date.toISOString().split("T")[0]; // YYYY-MM-DD
//     const key = `${row.employee_id}-${day}`;

//     if (!grouped[key]) {
//       grouped[key] = {
//         employee_id: row.employee_id,
//         employee_name: row.employees?.name || "",
//         employee_number: row.employees?.employee_number || "",
//         day,
//         check_in: null,
//         check_out: null
//       };
//     }

//     if (row.event_type === "IN" && !grouped[key].check_in) {
//       grouped[key].check_in = new Date(row.timestamp);
//     }

//     if (row.event_type === "OUT") {
//       grouped[key].check_out = new Date(row.timestamp);
//     }
//   }

//   // Paso 2: Calcular horas trabajadas por día
//   const dailyTotals = Object.values(grouped).map(entry => {
//     const { check_in, check_out } = entry;
//     let hoursWorked = 0;

//     if (check_in && check_out) {
//       const msDiff = check_out - check_in;
//       hoursWorked = msDiff / (1000 * 60 * 60);
//     }

//     return {
//       employee_id: entry.employee_id,
//       employee_number: entry.employee_number,
//       employee_name: entry.employee_name,
//       date: entry.day,
//       check_in: entry.check_in?.toISOString() || null,
//       check_out: entry.check_out?.toISOString() || null,
//       hoursWorked: +hoursWorked.toFixed(2)
//     };
//   });

//   // Paso 3: Agrupar por empleado con desglose
//   const totalByEmployee = {};

//   for (const row of dailyTotals) {
//     const key = row.employee_number;

//     if (!totalByEmployee[key]) {
//       totalByEmployee[key] = {
//         employee_number: row.employee_number,
//         employee_name: row.employee_name,
//         totalHours: 0,
//         details: []
//       };
//     }

//     totalByEmployee[key].totalHours += row.hoursWorked;
//     totalByEmployee[key].details.push({
//       date: row.date,
//       check_in: row.check_in,
//       check_out: row.check_out,
//       hoursWorked: row.hoursWorked
//     });
//   }

//   return Object.values(totalByEmployee);
// }




// static async getWorkedHours() {
//   const { data, error } = await supabase
//     .from("attendance_events")
//     .select(`
//       employee_id,
//       event_type,
//       timestamp,
//       employees (
//         name,
//         employee_number,
//         role_id,
//         roles (
//           name,
//           departments (
//             name
//           )
//         )
//       )
//     `)
//     .order("timestamp", { ascending: true });

//   if (error) throw new Error(error.message);

//   const grouped = {};

//   for (const row of data) {
//     const date = new Date(row.timestamp);
//     const day = date.toISOString().split("T")[0]; // YYYY-MM-DD
//     const key = `${row.employee_id}-${day}`;

//     const employee = row.employees || {};
//     const role = employee.roles || {};
//     const department = role.departments || {};

//     if (!grouped[key]) {
//       grouped[key] = {
//         employee_id: row.employee_id,
//         employee_name: employee.name || "",
//         employee_number: employee.employee_number || "",
//         department_name: department.name || "Sin departamento",
//         day,
//         check_in: null,
//         check_out: null
//       };
//     }

//     if (row.event_type === "IN" && !grouped[key].check_in) {
//       grouped[key].check_in = new Date(row.timestamp);
//     }

//     if (row.event_type === "OUT") {
//       grouped[key].check_out = new Date(row.timestamp);
//     }
//   }

//   const dailyTotals = Object.values(grouped).map(entry => {
//     const { check_in, check_out } = entry;
//     let hoursWorked = 0;

//     if (check_in && check_out) {
//       const msDiff = check_out - check_in;
//       hoursWorked = msDiff / (1000 * 60 * 60);
//     }

//     return {
//       employee_id: entry.employee_id,
//       employee_number: entry.employee_number,
//       employee_name: entry.employee_name,
//       department_name: entry.department_name,
//       date: entry.day,
//       check_in: entry.check_in?.toISOString() || null,
//       check_out: entry.check_out?.toISOString() || null,
//       hoursWorked: +hoursWorked.toFixed(2)
//     };
//   });

//   const totalByEmployee = {};

//   for (const row of dailyTotals) {
//     const key = row.employee_number;

//     if (!totalByEmployee[key]) {
//       totalByEmployee[key] = {
//         employee_number: row.employee_number,
//         employee_name: row.employee_name,
//         department_name: row.department_name,
//         totalHours: 0,
//         details: []
//       };
//     }

//     totalByEmployee[key].totalHours += row.hoursWorked;
//     totalByEmployee[key].details.push({
//       date: row.date,
//       check_in: row.check_in,
//       check_out: row.check_out,
//       hoursWorked: row.hoursWorked
//     });
//   }

//   return Object.values(totalByEmployee);
// }

static async getWorkedHoursWithCSV() {
  const { data, error } = await supabase
    .from("attendance_events")
    .select(`
      employee_id,
      event_type,
      timestamp,
      employees (
        name,
        employee_number,
        role_id,
        roles (
          name,
          departments (
            name
          )
        )
      )
    `)
    .order("timestamp", { ascending: true });

  if (error) throw new Error(error.message);

  const grouped = {};

  for (const row of data) {
    const date = new Date(row.timestamp);
    const day = date.toISOString().split("T")[0];
    const key = `${row.employee_id}-${day}`;

    const employee = row.employees || {};
    const role = employee.roles || {};
    const department = role.departments || {};

    if (!grouped[key]) {
      grouped[key] = {
        employee_id: row.employee_id,
        employee_name: employee.name || "",
        employee_number: employee.employee_number || "",
        department_name: department.name || "Sin departamento",
        day,
        check_in: null,
        check_out: null
      };
    }

    if (row.event_type === "IN" && !grouped[key].check_in) {
      grouped[key].check_in = new Date(row.timestamp);
    }

    if (row.event_type === "OUT") {
      grouped[key].check_out = new Date(row.timestamp);
    }
  }

  const dailyTotals = Object.values(grouped).map(entry => {
    const { check_in, check_out } = entry;
    let hoursWorked = 0;

    if (check_in && check_out) {
      const msDiff = check_out - check_in;
      hoursWorked = msDiff / (1000 * 60 * 60);
    }

    return {
      employee_id: entry.employee_id,
      employee_number: entry.employee_number,
      employee_name: entry.employee_name,
      department_name: entry.department_name,
      date: entry.day,
      check_in: check_in?.toISOString().slice(11, 19) || "",
      check_out: check_out?.toISOString().slice(11, 19) || "",
      hoursWorked: +hoursWorked.toFixed(2)
    };
  });

  const totalByEmployee = {};
  for (const row of dailyTotals) {
    const key = row.employee_number;

    if (!totalByEmployee[key]) {
      totalByEmployee[key] = {
        employee_number: row.employee_number,
        employee_name: row.employee_name,
        department_name: row.department_name,
        totalHours: 0,
        details: []
      };
    }

    totalByEmployee[key].totalHours += row.hoursWorked;
    totalByEmployee[key].details.push({
      date: row.date,
      check_in: row.check_in,
      check_out: row.check_out,
      hoursWorked: row.hoursWorked
    });
  }

  // CSV Generation
  const fields = [
    'employee_number',
    'employee_name',
    'department_name',
    'date',
    'check_in',
    'check_out',
    'hoursWorked'
  ];

  const parser = new Parser({ fields });
  const csv = parser.parse(dailyTotals);

  return {
    summary: Object.values(totalByEmployee),
    csv
  };


  
}

////

// static async getWorkedHoursWithCSV() {
//   const { data, error } = await supabase
//     .from("attendance_events")
//     .select(`
//       employee_id,
//       event_type,
//       timestamp,
//       employees (
//         name,
//         employee_number,
//         departments (
//           name
//         )
//       )
//     `)
//     .order("timestamp", { ascending: true });

//   if (error) throw new Error(error.message);

//   const grouped = {};

//   // Agrupamos eventos por empleado + día
//   for (const row of data) {
//     const date = new Date(row.timestamp);
//     const day = date.toISOString().split("T")[0];
//     const key = `${row.employee_id}-${day}`;

//     if (!grouped[key]) {
//       grouped[key] = {
//         employee_id: row.employee_id,
//         employee_name: row.employees?.name || "",
//         employee_number: row.employees?.employee_number || "",
//         department_name: row.employees?.departments?.name || "",
//         day,
//         events: []
//       };
//     }

//     grouped[key].events.push({
//       type: row.event_type,
//       timestamp: new Date(row.timestamp)
//     });
//   }

//   // Procesamos cada día por empleado, emparejando IN → OUT
//   const detailedRows = [];

//   for (const entry of Object.values(grouped)) {
//     const { events, employee_name, employee_number, department_name, day } = entry;

//     let checkIn = null;
//     let totalWorked = 0;

//     for (const event of events) {
//       if (event.type === "IN") {
//         checkIn = event.timestamp;
//       }

//       if (event.type === "OUT" && checkIn) {
//         const checkOut = event.timestamp;

//         const msDiff = checkOut - checkIn;

//         if (msDiff > 0) {
//           const hoursWorked = msDiff / (1000 * 60 * 60);
//           detailedRows.push({
//             employee_number,
//             employee_name,
//             department_name,
//             date: day,
//             check_in: checkIn.toTimeString().split(" ")[0],
//             check_out: checkOut.toTimeString().split(" ")[0],
//             hoursWorked: +hoursWorked.toFixed(2)
//           });

//           totalWorked += hoursWorked;
//         }

//         checkIn = null; // listo para el siguiente IN
//       }
//     }
//   }

//   // Sumamos totales por empleado
//   const totalByEmployee = {};

//   for (const row of detailedRows) {
//     const key = row.employee_number;

//     if (!totalByEmployee[key]) {
//       totalByEmployee[key] = {
//         employee_number: row.employee_number,
//         employee_name: row.employee_name,
//         department_name: row.department_name,
//         totalHours: 0
//       };
//     }

//     totalByEmployee[key].totalHours += row.hoursWorked;
//   }

//   // Generar CSV
//   const csvHeaders = "employee_number,employee_name,department_name,date,check_in,check_out,hoursWorked\n";
//   const csvBody = detailedRows.map(r =>
//     `"${r.employee_number}","${r.employee_name}","${r.department_name}","${r.date}","${r.check_in}","${r.check_out}",${r.hoursWorked}`
//   ).join("\n");

//   const csv = csvHeaders + csvBody;

//   return {
//     detailed: detailedRows,
//     totals: Object.values(totalByEmployee),
//     csv
//   };
// }







}

module.exports = AttendanceEvent;

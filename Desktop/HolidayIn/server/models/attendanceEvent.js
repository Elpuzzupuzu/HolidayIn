const supabase = require("../config/supabase");
// const { Parser } = require("json2csv");

class AttendanceEvent {

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


  ///
// static async exportCSV(startDate, endDate) {
//   // Consulta con join a roles
//   const query = supabase
//     .from("attendance_events")
//     .select(`
//       id,
//       employee_id,
//       event_type,
//       timestamp,
//       employees (
//         name,
//         employee_number,
//         role_id,
//         roles (
//           name
//         )
//       )
//     `)
//     .order("timestamp", { ascending: true });

//   if (startDate && endDate) {
//     query.gte("timestamp", startDate).lte("timestamp", endDate);
//   }

//   const { data, error } = await query;

//   if (error) {
//     throw new Error(error.message);
//   }

//   if (!data || data.length === 0) {
//     throw new Error("No hay registros para el rango de fechas indicado");
//   }

//   // Mapeamos los datos, incluyendo el nombre del rol
//   const formattedData = data.map(row => ({
//     employee_number: row.employees?.employee_number || "",
//     employee_name: row.employees?.name || "",
//     role_name: row.employees?.roles?.name || "Desconocido",
//     event_type: row.event_type,
//     timestamp: row.timestamp
//   }));

//   const fields = ["employee_number", "employee_name", "role_name", "event_type", "timestamp"];
//   const json2csvParser = new Parser({ fields });
//   const csv = json2csvParser.parse(formattedData);

//   return csv;
// }

// static async registerAutoEvent(employee_number) {
//     // 1. Obtener empleado por número
//     const { data: employee, error: empError } = await supabase
//       .from("employees")
//       .select("id")
//       .eq("employee_number", employee_number)
//       .single();

//     if (empError || !employee) {
//       throw new Error("Empleado no encontrado");
//     }

//     // 2. Obtener último evento del empleado (orden descendente por timestamp)
//     const { data: lastEvent, error: eventError } = await supabase
//       .from("attendance_events")
//       .select("event_type")
//       .eq("employee_id", employee.id)
//       .order("timestamp", { ascending: false })
//       .limit(1)
//       .single();

//     if (eventError && eventError.code !== "PGRST116") { // PGRST116 = no rows found, puede variar según Supabase
//       throw new Error(eventError.message);
//     }

//     // 3. Definir el siguiente tipo de evento
//     let nextEventType = "IN";
//     if (lastEvent && lastEvent.event_type === "IN") {
//       nextEventType = "OUT";
//     }

//     // 4. Crear el nuevo evento
//     const { data: newEvent, error: insertError } = await supabase
//       .from("attendance_events")
//       .insert([
//         { employee_id: employee.id, event_type: nextEventType }
//       ])
//       .select()
//       .single();

//     if (insertError) {
//       throw new Error(insertError.message);
//     }

//     return newEvent;
//   }

static async registerAutoEvent(employee_number) {
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_number", employee_number)
      .single();

    if (empError || !employee) {
      throw new Error("Empleado no encontrado");
    }

    const { data: lastEvent, error: lastError } = await supabase
      .from("attendance_events")
      .select("event_type")
      .eq("employee_id", employee.id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (lastError && lastError.code !== "PGRST116") {
      throw new Error("Error al obtener último evento");
    }

    const nextType = lastEvent?.event_type === "IN" ? "OUT" : "IN";

    const { data: newEvent, error: insertError } = await supabase
      .from("attendance_events")
      .insert([{ employee_id: employee.id, event_type: nextType }])
      .select("id")
      .single();

    if (insertError) {
      throw new Error("Error al registrar evento");
    }

    const { data: inserted, error: insertedError } = await supabase
      .from("attendance_events")
      .select(`
        id,
        event_type,
        timestamp,
        employees (
          name,
          employee_number
        )
      `)
      .eq("id", newEvent.id)
      .single();

    if (insertedError) {
      throw new Error("Error al obtener datos del evento registrado");
    }

    return inserted;
  }


}

module.exports = AttendanceEvent;

const supabase = require("../config/supabase");
const { Parser } = require("json2csv");

class AttendanceLog {



  static async checkIn(employee_number) {
  // Obtener ID del empleado
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_number", employee_number)
    .single();

  if (empError || !employee) {
    throw new Error("Empleado no encontrado");
  }

  // Verificar si ya hizo check-in hoy y no hizo check-out
  const { data: existingLog, error: logError } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("employee_id", employee.id)
    .eq("log_date", new Date().toISOString().slice(0, 10))
    .is("check_out", null)
    .maybeSingle();

  if (logError) {
    throw new Error(logError.message);
  }

  if (existingLog) {
    throw new Error("Ya se ha registrado el check-in para hoy.");
  }

  // Insertar nuevo registro
  const { data, error } = await supabase
    .from("attendance_logs")
    .insert([{ employee_id: employee.id, check_in: new Date() }]);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


static async checkOut(employee_number) {
  // Obtener ID del empleado
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_number", employee_number)
    .single();

  if (empError || !employee) {
    throw new Error("Empleado no encontrado");
  }

  // Buscar el último registro del día, sin importar si tiene check_out
  const { data: logs, error: logError } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("employee_id", employee.id)
    .eq("log_date", new Date().toISOString().slice(0, 10))
    .order("id", { ascending: false })
    .limit(1);

  if (logError || logs.length === 0) {
    throw new Error("No hay registro de asistencia para hoy.");
  }

  const log = logs[0];

  if (log.check_out) {
    throw new Error("Ya se ha registrado el check-out para hoy.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("attendance_logs")
    .update({ check_out: new Date() })
    .eq("id", log.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return updated;
}



  // static async getAll() {
  //   const { data, error } = await supabase
  //     .from("attendance_logs")
  //     .select("*");

  //   if (error) {
  //     throw new Error(error.message);
  //   }

  //   return data;
  // }

static async getAll() {
  const { data, error } = await supabase
    .from("attendance_logs")
    .select(`
      id,
      log_date,
      check_in,
      check_out,
      employee:employee_id (
        id,
        employee_number,
        name,
        role:role_id (
          name
        )
      )
    `)
    .order("log_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}




  // static async getByEmployeeNumber(employee_number) {
  //   const { data: employee, error: empError } = await supabase
  //     .from("employees")
  //     .select("id")
  //     .eq("employee_number", employee_number)
  //     .single();

  //   if (empError || !employee) {
  //     throw new Error("Empleado no encontrado");
  //   }

  //   const { data, error } = await supabase
  //     .from("attendance_logs")
  //     .select("*")
  //     .eq("employee_id", employee.id);

  //   if (error) {
  //     throw new Error(error.message);
  //   }

  //   return data;
  // }

  static async getByEmployeeNumber(employee_number) {
  // Obtener ID del empleado
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_number", employee_number)
    .single();

  if (empError || !employee) {
    throw new Error("Empleado no encontrado");
  }

  // Traer registros de attendance_logs incluyendo info de empleado y rol
  const { data, error } = await supabase
    .from("attendance_logs")
    .select(`
      *,
      employees (
        id,
        name,
        employee_number,
        roles (
          id,
          name
        )
      )
    `)
    .eq("employee_id", employee.id);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/// test de filtros 

static async getByDateRange(startDate, endDate) {
  let query = supabase
    .from("attendance_logs")
    .select(`
      *,
      employees (
        id,
        name,
        employee_number,
        roles (
          id,
          name
        )
      )
    `);

  if (startDate) {
    query = query.gte("log_date", startDate);
  }

  if (endDate) {
    query = query.lte("log_date", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

//// test csv 


  static async exportCSV(startDate, endDate) {
    // Validar fechas mínimamente (opcional)
    if (!startDate || !endDate) {
      throw new Error("startDate y endDate son requeridos");
    }

    const { data, error } = await supabase
      .from("attendance_logs")
      .select(`
        id,
        employee:employees(name, employee_number, role_id),
        check_in,
        check_out,
        log_date
      `)
      .gte("log_date", startDate)
      .lte("log_date", endDate);

    if (error) {
      throw new Error(error.message);
    }

    if (data.length === 0) {
      throw new Error("No hay registros para el rango de fechas indicado");
    }

    // Formatear datos para CSV
    // Aplanamos el objeto para columnas directas
    const formattedData = data.map(row => ({
      id: row.id,
      employee_number: row.employee?.employee_number || "",
      employee_name: row.employee?.name || "",
      role_id: row.employee?.role_id || "",
      check_in: row.check_in,
      check_out: row.check_out,
      log_date: row.log_date,
    }));

    const fields = ["id", "employee_number", "employee_name", "role_id", "check_in", "check_out", "log_date"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedData);

    return csv;
  }


  ////




}

module.exports = AttendanceLog;

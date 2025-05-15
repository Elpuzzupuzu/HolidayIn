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
        role_id
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

  // Convertimos cada evento en una fila CSV simple:
  const formattedData = data.map(row => ({
    employee_number: row.employees?.employee_number || "",
    employee_name: row.employees?.name || "",
    role_id: row.employees?.role_id || "",
    event_type: row.event_type,
    timestamp: row.timestamp
  }));

  const fields = ["employee_number", "employee_name", "role_id", "event_type", "timestamp"];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(formattedData);

  return csv;
}















}

module.exports = AttendanceEvent;

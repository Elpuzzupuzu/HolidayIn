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
  ///


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

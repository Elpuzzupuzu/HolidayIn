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


static async getWorkedHoursByEmployee(employee_number, page = 1, limit = 10, from = null, to = null) {
  const fromIndex = (page - 1) * limit;
  const toIndex = fromIndex + limit - 1;

  // Consulta básica para obtener todos los eventos filtrados por employee_number
  // Luego los pares entrada-salida y calculo horas

  // Primero traemos todos los eventos del empleado (podemos filtrar por fecha si se provee)
  let query = supabase
    .from("dat_events")
    .select("*")
    .eq("employee_number", employee_number)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  if (from) {
    query = query.gte("event_date", from);
  }

  if (to) {
    query = query.lte("event_date", to);
  }

  const { data: events, error } = await query;

  if (error) throw new Error(error.message);
  if (!events.length) return { page, limit, total: 0, data: [] };

  // Aquí procesamos el array 'events' para crear pares entrada-salida y calcular horas trabajadas
  // similar a lo que hiciste antes...

  // Filtramos eventos para pares (entrada=0 seguida de salida=1)
  const pairedEvents = [];
  for (let i = 0; i < events.length - 1; i++) {
    const curr = events[i];
    const next = events[i + 1];
    if (curr.event_type === "0" && next.event_type === "1") {
      // Validamos que next sea el siguiente evento del mismo empleado (ya que filtramos por employee_number)
      // Calculamos horas
      const start = new Date(`${curr.event_date}T${curr.event_time}`);
      const end = new Date(`${next.event_date}T${next.event_time}`);
      const diffHours = (end - start) / 3600000;

      pairedEvents.push({
        employee_number,
        entry_date: curr.event_date,
        entry_time: curr.event_time,
        exit_date: next.event_date,
        exit_time: next.event_time,
        hours_worked: Math.round(diffHours * 100) / 100,
      });
    }
  }

  const total = pairedEvents.length;
  const data = pairedEvents.slice(fromIndex, toIndex + 1);

  return { page, limit, total, data };
}






}




module.exports = DatEvent;

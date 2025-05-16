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
  


    // Método para obtener horas trabajadas
  // static async getWorkedHoursPerDay() {
  //   const { data, error } = await supabase.rpc("get_worked_hours");

  //   if (error) {
  //     throw new Error(`Error al obtener horas trabajadas: ${error.message}`);
  //   }

  //   return data;
  // }
// 

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




}




module.exports = DatEvent;

const DatEvent = require("../models/datEvent");
const path = require("path");
const { Parser } = require('json2csv');


class DatEventController {


  // Procesa archivo .dat
  static async processDatFile(req, res) {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({ error: "La ruta del archivo .dat es requerida (filePath)." });
      }

      const resolvedPath = path.resolve(filePath);

      const result = await DatEvent.processDatFile(resolvedPath);

      res.status(200).json(result);
    } catch (error) {
      console.error("Error al procesar el archivo .dat:", error.message);
      res.status(500).json({ error: "No se pudo procesar el archivo .dat" });
    }
  }

/// trae todos los registros del dat procesado
 static async getWorkedHours(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await DatEvent.getWorkedHoursPerDay(page, limit);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener las horas trabajadas:", error.message);
    res.status(500).json({ error: "No se pudo obtener la información de horas trabajadas." });
  }
}


/// por departamento a nivel general 
static async getTotalWorkedHoursByDepartment(req, res) {
  try {
    const department_id = parseInt(req.params.department_id, 10);
    const from = req.query.from;
    const to   = req.query.to;

    if (!from || !to) {
      return res
        .status(400)
        .json({ error: "Parámetros 'from' y 'to' son obligatorios." });
    }

    const result = await DatEvent.getTotalWorkedHoursByDepartment(
      department_id, from, to
    );
    res.status(200).json(result);

  } catch (error) {
    console.error(
      "Error al obtener total de horas trabajadas por departamento:",
      error.message
    );
    res
      .status(500)
      .json({ error: "No se pudo obtener la información de horas trabajadas." });
  }
}














//// este calcula las horas del empleado dado un intervalo  por cada empleado 
static async getTotalWorkedHoursByEmployee(req, res) {
  try {
    const { employee_number, from, to } = req.query;

    if (!employee_number || !from || !to) {
      return res.status(400).json({
        error: "Parámetros 'employee_number', 'from' y 'to' son obligatorios.",
      });
    }

    const result = await DatEvent.getTotalWorkedHoursByEmployee(
      employee_number,
      from,
      to
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener las horas trabajadas del empleado:", error.message);
    res
      .status(500)
      .json({ error: "No se pudo obtener la información de horas trabajadas del empleado AAAAA." });
  }
}

/////





















/// esto filtra por departamento y fechas





static async getWorkedHoursBetweenDates(req, res) {
  try {
    // Extract query parameters
    const { startDate, endDate, employeeNumber } = req.query;

    // Validate required dates
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Se requieren las fechas startDate y endDate." });
    }

    // Validate date format (optional, but recommended)
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ error: "Las fechas proporcionadas no tienen un formato válido." });
    }

    // Validate that the start date is not greater than the end date
    if (start > end) {
      return res.status(400).json({ error: "La fecha de inicio no puede ser mayor que la fecha final." });
    }

    // Validate that employeeNumber, if provided, is numeric
    const empNumber = employeeNumber ? String(employeeNumber).trim() : null;

    // Call the main method which now returns { workedHours, anomalies }
    const { workedHours, anomalies } = await DatEvent.getWorkedHoursBetweenDates(startDate, endDate, empNumber);

    // Send the response with both workedHours and anomalies
    return res.status(200).json({
      data: workedHours, // This corresponds to the 'workedHours' state in Redux
      anomalies: anomalies // This corresponds to the 'anomalies' state in Redux
    });

  } catch (error) {
    console.error("Error en getWorkedHoursBetweenDates:", error.message);
    return res.status(500).json({ error: "Error al obtener las horas trabajadas." });
  }
}


///


static async getWorkedHoursBetweenDatesCSV(req, res) {
  try {
    const { startDate, endDate, employeeNumber } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Se requieren las fechas startDate y endDate." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ error: "Las fechas proporcionadas no tienen un formato válido." });
    }

    if (start > end) {
      return res.status(400).json({ error: "La fecha de inicio no puede ser mayor que la fecha final." });
    }

    const empNumber = employeeNumber ? String(employeeNumber).trim() : null;

    const result = await DatEvent.getWorkedHoursBetweenDatesCSV(startDate, endDate, empNumber);

    // Definir campos con los nombres en español (deben coincidir con las propiedades del objeto)
    const fields = [
      { label: 'Numero de empleado', value: 'numero_empleado' },
      { label: 'Fecha de entrada', value: 'fecha_entrada' },
      { label: 'Hora de entrada', value: 'hora_entrada' },
      { label: 'Fecha de salida', value: 'fecha_salida' },
      { label: 'Hora de salida', value: 'hora_salida' },
      { label: 'Horas trabajadas', value: 'horas_trabajadas' },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(result);

    // Enviar el archivo CSV como descarga
    res.header('Content-Type', 'text/csv');
    res.attachment('horas_trabajadas.csv');
    return res.send(csv);

  } catch (error) {
    console.error("Error en getWorkedHoursBetweenDatesCSV:", error.message);
    return res.status(500).json({ error: "Error al obtener las horas trabajadas." });
  }
}







}

module.exports = DatEventController;

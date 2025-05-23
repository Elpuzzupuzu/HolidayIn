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
      .json({ error: "No se pudo obtener la información de horas trabajadas del empleado." });
  }
}

/// esto filtra por departamento y fechas

static async getWorkedHoursBetweenDates(req, res) {
  try {
    // Extraer parámetros de la query
    const { startDate, endDate, employeeNumber } = req.query;

    // Validar fechas requeridas
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Se requieren las fechas startDate y endDate." });
    }

    // Validar formato de fechas (opcional, pero recomendable)
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ error: "Las fechas proporcionadas no tienen un formato válido." });
    }

    // Validar que la fecha de inicio no sea mayor a la final
    if (start > end) {
      return res.status(400).json({ error: "La fecha de inicio no puede ser mayor que la fecha final." });
    }

    // Validar que employeeNumber, si viene, sea numérico
    const empNumber = employeeNumber ? String(employeeNumber).trim() : null;

    // Llamar al método principal
    const result = await DatEvent.getWorkedHoursBetweenDates(startDate, endDate, empNumber);

    // Enviar la respuesta con los datos
    return res.status(200).json({ data: result });

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

    const result = await DatEvent.getWorkedHoursBetweenDates(startDate, endDate, empNumber);

    // Convertir los datos a formato CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(result);

    // Enviar el archivo CSV como descarga
    res.header('Content-Type', 'text/csv');
    res.attachment('horas_trabajadas.csv');
    return res.send(csv);

  } catch (error) {
    console.error("Error en getWorkedHoursBetweenDates:", error.message);
    return res.status(500).json({ error: "Error al obtener las horas trabajadas." });
  }
}







}

module.exports = DatEventController;

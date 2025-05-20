const DatEvent = require("../models/datEvent");
const path = require("path");

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

// static async getWorkedHoursByEmployee(req, res) {   este va a servir luego 
//   try {
//     const employee_number = req.params.employee_number;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const from = req.query.from || null;  // opcional
//     const to = req.query.to || null;      // opcional

//     const result = await DatEvent.getWorkedHoursByEmployee(employee_number, page, limit, from, to);

//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error al obtener las horas trabajadas:", error.message);
//     res.status(500).json({ error: "No se pudo obtener la información de horas trabajadas." });
//   }
// }

static async getTotalWorkedHours(req, res) {
  try {
    const employee_number = req.params.employee_number;
    const from = req.query.from;
    const to = req.query.to;

    if (!from || !to) {
      return res.status(400).json({ error: "Parámetros 'from' y 'to' son obligatorios." });
    }

    const result = await DatEvent.getTotalWorkedHoursByEmployee(employee_number, from, to);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener total de horas trabajadas:", error.message);
    res.status(500).json({ error: "No se pudo obtener el total de horas trabajadas." });
  }
}


// por departamentos y fechas : 

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







}

module.exports = DatEventController;

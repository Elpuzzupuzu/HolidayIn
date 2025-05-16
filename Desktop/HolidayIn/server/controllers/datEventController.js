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

  // Obtiene horas trabajadas por día
  static async getWorkedHours(req, res) {
    try {
      const result = await DatEvent.getWorkedHoursPerDay();
      res.status(200).json(result);
    } catch (error) {
      console.error("Error al obtener las horas trabajadas:", error.message);
      res.status(500).json({ error: "No se pudo obtener la información de horas trabajadas." });
    }
  }
}

module.exports = DatEventController;

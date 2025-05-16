const DatEvent = require("../models/datEvent");
const path = require("path");

class DatEventController {
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
}

module.exports = DatEventController;

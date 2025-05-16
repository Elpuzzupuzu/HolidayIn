const express = require("express");
const router = express.Router();
const DatEventController = require("../controllers/datEventController");

// Endpoint para procesar archivo .dat con ruta dinámica (ruta en req.body.filePath)
router.post("/process-dat", DatEventController.processDatFile);
router.get("/worked-hours", DatEventController.getWorkedHours);

module.exports = router;

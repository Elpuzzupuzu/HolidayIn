const express = require("express");
const router = express.Router();
const DatEventController = require("../controllers/datEventController");

// Endpoint para procesar archivo .dat con ruta dinámica (ruta en req.body.filePath)
router.post("/process-dat", DatEventController.processDatFile);

module.exports = router;

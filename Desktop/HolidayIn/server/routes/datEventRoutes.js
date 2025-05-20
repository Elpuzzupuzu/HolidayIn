const express = require("express");
const router = express.Router();
const DatEventController = require("../controllers/datEventController");

// Endpoint para procesar archivo .dat con ruta dinámica 
router.post("/process-dat", DatEventController.processDatFile);
router.get("/worked-hours", DatEventController.getWorkedHours);
// Ruta para obtener horas trabajadas de un empleado específico
router.get("/worked-hours/:employee_number", DatEventController.getWorkedHoursByEmployee);

module.exports = router;

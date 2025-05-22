const express = require("express");
const router = express.Router();
const DatEventController = require("../controllers/datEventController");

// Endpoint para procesar archivo .dat con ruta dinámica 
router.post("/process-dat", DatEventController.processDatFile);
router.get("/worked-hours", DatEventController.getWorkedHours);
// router.get("/worked-hours/:employee_number", DatEventController.getWorkedHoursByEmployee);
// router.get("/worked-hours/total/:employee_number", DatEventController.getTotalWorkedHours);
//por departamento y fechas
router.get(
  "/worked-hours/department/:department_id",
  DatEventController.getTotalWorkedHoursByDepartment
);

module.exports = router;

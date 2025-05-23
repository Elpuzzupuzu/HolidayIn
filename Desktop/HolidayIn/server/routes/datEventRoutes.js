const express = require("express");
const router = express.Router();
const DatEventController = require("../controllers/datEventController");

// Endpoint para procesar archivo .dat con ruta dinámica 
router.post("/process-dat", DatEventController.processDatFile);

// Ruta para las horas de todo el .dat
router.get("/worked-hours", DatEventController.getWorkedHours);

// Filtra por número de empleado e intervalo de fechas
router.get('/worked-hours/employee', DatEventController.getTotalWorkedHoursByEmployee);

// Por departamento y fechas 
router.get(
  "/worked-hours/department/:department_id",
  DatEventController.getTotalWorkedHoursByDepartment
);

// Ruta para filtrar por departamento y fechas
router.get("/worked-hours/filter", DatEventController.getWorkedHoursBetweenDates);

// ✅ Nueva ruta: Generar CSV con horas trabajadas por fechas (y opcionalmente por empleado)
router.get("/worked-hours/csv", DatEventController.getWorkedHoursBetweenDatesCSV);

/// testing

module.exports = router;

const express = require("express");
const router = express.Router();
const DatEventController = require("../controllers/datEventController");

// Endpoint para procesar archivo .dat con ruta dinámica 
router.post("/process-dat", DatEventController.processDatFile);
//ruta para las horas de todo el .dat
router.get("/worked-hours", DatEventController.getWorkedHours);
// filtra por numero de empleado e intervalo de fechas
router.get('/worked-hours/employee', DatEventController.getTotalWorkedHoursByEmployee);

//por departamento y fechas 
router.get(
  "/worked-hours/department/:department_id",
  DatEventController.getTotalWorkedHoursByDepartment
);



/////test
router.get("/worked-hours/filter", DatEventController.getWorkedHoursBetweenDates);





module.exports = router;

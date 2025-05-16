const express = require("express");
const router = express.Router();
const AttendanceEventController = require("../controllers/attendanceEventController");

// Check-in

// Obtener todos los eventos
router.get("/", AttendanceEventController.getAll);

// Obtener eventos de un empleado por employee_number
router.get("/employee/:employee_number", AttendanceEventController.getByEmployeeNumber);

router.post("/register-event", AttendanceEventController.registerAutoEvent);



///


module.exports = router;

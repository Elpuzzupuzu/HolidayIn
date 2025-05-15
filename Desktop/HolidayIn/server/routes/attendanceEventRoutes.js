const express = require("express");
const router = express.Router();
const AttendanceEventController = require("../controllers/attendanceEventController");

// Check-in
router.post("/checkin", AttendanceEventController.checkIn);

// Check-out
router.post("/checkout", AttendanceEventController.checkOut);

// Obtener todos los eventos
router.get("/", AttendanceEventController.getAll);

// Obtener eventos de un empleado por employee_number
router.get("/employee/:employee_number", AttendanceEventController.getByEmployeeNumber);

// Obtener eventos por rango de fechas
router.get("/daterange", AttendanceEventController.getByDateRange);

//
router.get("/export-csv", AttendanceEventController.exportCSV);

module.exports = router;

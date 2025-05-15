const express = require("express");
const router = express.Router();
const AttendanceLogController = require("../controllers/attendanceLogController");

// Check-in usando employee_number en el body
router.post("/checkin", AttendanceLogController.checkIn);

// Check-out usando employee_number en el body
router.put("/checkout", AttendanceLogController.checkOut);

// Obtener todos los registros
router.get("/all", AttendanceLogController.getAll);

// Obtener registros por employee_number (en la URL)
router.get("/employee/:employee_number", AttendanceLogController.getByEmployeeNumber);

///
router.get("/date-range", AttendanceLogController.getByDateRange);


module.exports = router;

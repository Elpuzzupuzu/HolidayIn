const AttendanceEvent = require("../models/attendanceEvent");

class AttendanceEventController {
  static async checkIn(req, res) {
    try {
      const { employee_number } = req.body;
      const event = await AttendanceEvent.createEvent(employee_number, "IN");
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async checkOut(req, res) {
    try {
      const { employee_number } = req.body;
      const event = await AttendanceEvent.createEvent(employee_number, "OUT");
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const events = await AttendanceEvent.getAll();
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getByEmployeeNumber(req, res) {
    try {
      const { employee_number } = req.params;
      const events = await AttendanceEvent.getByEmployeeNumber(employee_number);
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const events = await AttendanceEvent.getByDateRange(startDate, endDate);
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  

static async exportCSV(req, res) {
  try {
    const csvData = await AttendanceEvent.exportCSV();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=attendance_report.csv");
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


///
static async getWorkedHours(req, res) {
  try {
    const { csv } = await AttendanceEvent.getWorkedHoursWithCSV();

    res.setHeader('Content-Disposition', 'attachment; filename="horas_trabajadas.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error al generar el CSV:", error.message);
    res.status(500).json({ error: "Error al generar el archivo CSV." });
  }
}







}

module.exports = AttendanceEventController;

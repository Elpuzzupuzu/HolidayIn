const AttendanceLog = require("../models/attendanceLog");

class AttendanceLogController {
  static async checkIn(req, res) {
    try {
      const { employee_number } = req.body;
      const log = await AttendanceLog.checkIn(employee_number);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async checkOut(req, res) {
    try {
      const { employee_number } = req.body;
      const log = await AttendanceLog.checkOut(employee_number);
      res.status(200).json(log);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const logs = await AttendanceLog.getAll();
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getByEmployeeNumber(req, res) {
    try {
      const { employee_number } = req.params;
      const logs = await AttendanceLog.getByEmployeeNumber(employee_number);
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  static async getByDateRange(req, res) {
  try {
    const { startDate, endDate } = req.query; // recibimos fechas como query params
    const logs = await AttendanceLog.getByDateRange(startDate, endDate);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}












}





module.exports = AttendanceLogController;

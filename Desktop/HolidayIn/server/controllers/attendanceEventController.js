const AttendanceEvent = require("../models/attendanceEvent");

class AttendanceEventController {
 
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


  

  static async registerAutoEvent(req, res) {
    try {
      const { employee_number } = req.body;
      const event = await AttendanceEvent.registerAutoEvent(employee_number);
      res.status(201).json({ event });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


}




module.exports = AttendanceEventController;

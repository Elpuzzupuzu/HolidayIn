const Department = require("../models/departament");

class DepartmentController {
  static async create(req, res) {
    try {
      const { name } = req.body;
      const department = await Department.create(name);
      res.status(201).json(department);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const departments = await Department.getAll();
      res.status(200).json(departments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const department = await Department.getById(id);
      res.status(200).json(department);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const department = await Department.update(id, name);
      res.status(200).json(department);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await Department.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DepartmentController;

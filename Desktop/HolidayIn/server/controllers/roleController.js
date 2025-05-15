const Role = require("../models/role");

class RoleController {
  static async create(req, res) {
    try {
      const { name, department_id, default_start_time, default_end_time } = req.body;
      const role = await Role.create(name, department_id, default_start_time, default_end_time);
      res.status(201).json(role);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const roles = await Role.getAll();
      res.status(200).json(roles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const role = await Role.getById(id);
      res.status(200).json(role);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, department_id, default_start_time, default_end_time } = req.body;
      const role = await Role.update(id, name, department_id, default_start_time, default_end_time);
      res.status(200).json(role);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await Role.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = RoleController;

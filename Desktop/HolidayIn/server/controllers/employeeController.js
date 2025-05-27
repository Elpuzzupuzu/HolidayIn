const Employee = require("../models/employee");

class EmployeeController {
  /**
   * Crea un nuevo empleado.
   * Espera los datos del empleado en el cuerpo de la solicitud (req.body).
   */
  static async create(req, res) {
    try {
      const employee = await Employee.create(req.body);
      res.status(201).json(employee);
    } catch (error) {
      // Manejo de errores: por ejemplo, si employee_number ya existe, MySQL arrojará un error.
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene todos los empleados.
   */
  static async getAll(req, res) {
    try {
      const employees = await Employee.getAll();
      res.status(200).json(employees);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obtiene un empleado por su número de empleado.
   * Espera el número de empleado en los parámetros de la URL (req.params.employeeNumber).
   */
  static async getByEmployeeNumber(req, res) {
    try {
      const { employeeNumber } = req.params; // Cambiado de 'id' a 'employeeNumber'
      const employee = await Employee.getByEmployeeNumber(employeeNumber);

      if (!employee) {
        return res.status(404).json({ message: "Empleado no encontrado." });
      }

      res.status(200).json(employee);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Actualiza un empleado existente por su número de empleado.
   * Espera el número de empleado en los parámetros de la URL y los campos a actualizar en req.body.
   */
  static async update(req, res) {
    try {
      const { employeeNumber } = req.params; // Cambiado de 'id' a 'employeeNumber'
      const updated = await Employee.update(employeeNumber, req.body);

      // Si no se afectó ninguna fila, es probable que el empleado no exista.
      if (updated.affectedRows === 0) {
        return res.status(404).json({ message: "Empleado no encontrado para actualizar." });
      }

      res.status(200).json({ message: "Empleado actualizado exitosamente.", affectedRows: updated.affectedRows });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Elimina un empleado por su número de empleado.
   * Espera el número de empleado en los parámetros de la URL.
   */
  static async delete(req, res) {
    try {
      const { employeeNumber } = req.params; // Cambiado de 'id' a 'employeeNumber'
      const result = await Employee.delete(employeeNumber);

      // Si no se afectó ninguna fila, es probable que el empleado no exista.
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Empleado no encontrado para eliminar." });
      }

      res.status(204).send(); // 204 No Content para eliminación exitosa sin cuerpo de respuesta
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = EmployeeController;
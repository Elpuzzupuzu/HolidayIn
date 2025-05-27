// server/controllers/employeeController.js

const Employee = require('../models/employee'); // Asegúrate de que esta ruta sea correcta

const employeeController = {
  /**
   * Obtiene todos los empleados, con opción de filtro por department_id desde la query string.
   * @param {object} req - Objeto de solicitud (req.query.departmentId contendrá el filtro).
   * @param {object} res - Objeto de respuesta.
   */
  getAllEmployees: async (req, res) => {
    try {
      const { departmentId } = req.query; // Obtiene el parámetro 'departmentId' de la URL (ej. ?departmentId=1)

      // Llama al método getAll del modelo, pasando el filtro.
      // El modelo se encargará de la lógica de filtrado o de devolver todos si el filtro es 'all' o no existe.
      const employees = await Employee.getAll(departmentId);

      res.status(200).json(employees);
    } catch (error) {
      console.error('Error al obtener empleados:', error.message);
      res.status(500).json({ message: 'Error interno del servidor al obtener empleados.', error: error.message });
    }
  },

  /**
   * Crea un nuevo empleado.
   * @param {object} req - Objeto de solicitud.
   * @param {object} res - Objeto de respuesta.
   */
  createEmployee: async (req, res) => {
    try {
      const newEmployee = await Employee.create(req.body);
      res.status(201).json({ message: 'Empleado creado exitosamente', employee: newEmployee });
    } catch (error) {
      if (error.message.includes('Duplicate entry')) {
        return res.status(409).json({ message: 'El número de empleado ya existe.' });
      }
      console.error("Error al crear empleado:", error.message);
      res.status(500).json({ message: 'Error interno del servidor al crear empleado.', error: error.message });
    }
  },

  /**
   * Obtiene un empleado por su número.
   * @param {object} req - Objeto de solicitud.
   * @param {object} res - Objeto de respuesta.
   */
  getEmployeeByNumber: async (req, res) => {
    try {
      const { employeeNumber } = req.params;
      const employee = await Employee.getByEmployeeNumber(employeeNumber);
      if (!employee) {
        return res.status(404).json({ message: 'Empleado no encontrado.' });
      }
      res.status(200).json(employee);
    } catch (error) {
      console.error("Error al obtener empleado por número:", error.message);
      res.status(500).json({ message: 'Error interno del servidor al obtener empleado.', error: error.message });
    }
  },

  /**
   * Actualiza los campos de un empleado específico.
   * @param {object} req - Objeto de solicitud.
   * @param {object} res - Objeto de respuesta.
   */
  updateEmployee: async (req, res) => {
    try {
      const { employeeNumber } = req.params;
      const updateFields = req.body;
      const result = await Employee.update(employeeNumber, updateFields);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Empleado no encontrado para actualizar.' });
      }
      res.status(200).json({ message: 'Empleado actualizado exitosamente.', affectedRows: result.affectedRows });
    } catch (error) {
      console.error("Error al actualizar empleado:", error.message);
      res.status(500).json({ message: 'Error interno del servidor al actualizar empleado.', error: error.message });
    }
  },

  /**
   * Elimina un empleado.
   * @param {object} req - Objeto de solicitud.
   * @param {object} res - Objeto de respuesta.
   */
  deleteEmployee: async (req, res) => {
    try {
      const { employeeNumber } = req.params;
      const result = await Employee.delete(employeeNumber);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Empleado no encontrado para eliminar.' });
      }
      res.status(200).json({ message: 'Empleado eliminado exitosamente.', affectedRows: result.affectedRows });
    } catch (error) {
      console.error("Error al eliminar empleado:", error.message);
      res.status(500).json({ message: 'Error interno del servidor al eliminar empleado.', error: error.message });
    }
  }
};

module.exports = employeeController;
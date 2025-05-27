// server/models/Employee.js

const supabase = require("../config/supabase"); // 'supabase' es tu pool de conexiones MySQL

class Employee {
  /**
   * Crea un nuevo registro de empleado en la base de datos.
   * @param {object} employeeData - Los datos del empleado a crear.
   * @param {string} employeeData.employee_number - Número de empleado único.
   * @param {string} employeeData.name - Nombre del empleado.
   * @param {number} employeeData.role_id - ID del rol del empleado.
   * @param {number} employeeData.department_id - ID del departamento del empleado.
   * @param {string} employeeData.puesto - Puesto del empleado.
   * @param {string} employeeData.hire_date - Fecha de contratación (formato 'YYYY-MM-DD').
   * @param {string} [employeeData.status='activo'] - Estado del empleado (opcional).
   * @returns {Promise<object>} Un objeto con el ID insertado y la información de la inserción.
   * @throws {Error} Si ocurre un error al insertar el empleado.
   */
  static async create({ employee_number, name, role_id, department_id, puesto, hire_date, status }) {
    try {
      const query = `
        INSERT INTO employees
        (employee_number, name, role_id, department_id, puesto, hire_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [employee_number, name, role_id, department_id, puesto, hire_date, status || 'activo'];

      const [result] = await supabase.execute(query, values);
      return { id: result.insertId, affectedRows: result.affectedRows };
    } catch (error) {
      console.error("Error al crear empleado:", error.message);
      throw new Error(`Error al crear empleado: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los registros de empleados, con opción de filtro por department_id.
   * @param {number | string} [departmentId='all'] - ID del departamento para filtrar. Si es 'all' o no se proporciona, devuelve todos.
   * @returns {Promise<object[]>} Un arreglo de objetos de empleados.
   * @throws {Error} Si ocurre un error al obtener los empleados.
   */
  static async getAll(departmentId = 'all') { // <-- Aquí el cambio, aceptamos un departmentId opcional
    try {
      let query = "SELECT * FROM employees";
      const values = [];

      // Si se proporciona un departmentId válido (que no sea 'all'), añadimos la cláusula WHERE
      if (departmentId && departmentId !== 'all') {
        query += " WHERE department_id = ?";
        values.push(departmentId);
      }
      // Opcional: ordenar los resultados (buena práctica para la UI)
      query += " ORDER BY name ASC";

      const [rows] = await supabase.execute(query, values);
      return rows;
    } catch (error) {
      console.error("Error al obtener todos los empleados (filtrado):", error.message);
      throw new Error(`Error al obtener todos los empleados: ${error.message}`);
    }
  }

  /**
   * Obtiene un empleado por su número de empleado.
   * @param {string} employeeNumber - El número de empleado.
   * @returns {Promise<object | null>} El objeto del empleado, o null si no se encuentra.
   * @throws {Error} Si ocurre un error de base de datos.
   */
  static async getByEmployeeNumber(employeeNumber) {
    try {
      const query = "SELECT * FROM employees WHERE employee_number = ?";
      const [rows] = await supabase.execute(query, [employeeNumber]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error al obtener empleado ${employeeNumber}:`, error.message);
      throw new Error(`Error al obtener empleado por número: ${error.message}`);
    }
  }

  /**
   * Actualiza los campos de un empleado específico usando su número de empleado.
   * @param {string} employeeNumber - El número de empleado del registro a actualizar.
   * @param {object} updateFields - Un objeto con los campos y sus nuevos valores a actualizar.
   * @returns {Promise<object>} Un objeto con la cantidad de filas afectadas.
   * @throws {Error} Si ocurre un error al actualizar el empleado.
   */
  static async update(employeeNumber, updateFields) {
    try {
      const fields = Object.keys(updateFields);
      const values = Object.values(updateFields);

      if (fields.length === 0) {
        throw new Error("No hay campos para actualizar.");
      }

      const setClause = fields.map(field => `${field} = ?`).join(", ");
      const query = `UPDATE employees SET ${setClause} WHERE employee_number = ?`;
      const finalValues = [...values, employeeNumber];

      const [result] = await supabase.execute(query, finalValues);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error(`Error al actualizar empleado ${employeeNumber}:`, error.message);
      throw new Error(`Error al actualizar empleado: ${error.message}`);
    }
  }

  /**
   * Elimina un empleado de la base de datos usando su número de empleado.
   * @param {string} employeeNumber - El número de empleado del registro a eliminar.
   * @returns {Promise<object>} Un objeto con la cantidad de filas afectadas.
   * @throws {Error} Si ocurre un error al eliminar el empleado.
   */
  static async delete(employeeNumber) {
    try {
      const query = "DELETE FROM employees WHERE employee_number = ?";
      const [result] = await supabase.execute(query, [employeeNumber]);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      console.error(`Error al eliminar empleado ${employeeNumber}:`, error.message);
      throw new Error(`Error al eliminar empleado: ${error.message}`);
    }
  }
}

module.exports = Employee;
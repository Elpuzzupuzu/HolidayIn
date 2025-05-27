const express = require("express");
const router = express.Router();
const EmployeeController = require("../controllers/employeeController");

// Ruta para crear un nuevo empleado
router.post("/add", EmployeeController.create);

// Ruta para obtener todos los empleados
router.get("/getall", EmployeeController.getAll);

// Ruta para obtener un empleado por su número de empleado
// Hemos cambiado 'id' por 'employeeNumber' para que coincida con el controlador y el modelo
router.get("/getByEmployeeNumber/:employeeNumber", EmployeeController.getByEmployeeNumber);

// Ruta para actualizar un empleado por su número de empleado
// Hemos cambiado 'id' por 'employeeNumber'
router.put("/update/:employeeNumber", EmployeeController.update);

// Ruta para eliminar un empleado por su número de empleado
// Hemos cambiado 'id' por 'employeeNumber'
router.delete("/delete/:employeeNumber", EmployeeController.delete);

module.exports = router;
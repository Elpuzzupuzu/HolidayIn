const express = require("express");
const router = express.Router();
const EmployeeController = require("../controllers/employeeController");

router.post("/add", EmployeeController.create);
router.get("/getall", EmployeeController.getAll);
router.get("/getById/:id", EmployeeController.getById);
router.put("/update/:id", EmployeeController.update);
router.delete("/delete/:id", EmployeeController.delete);

module.exports = router;

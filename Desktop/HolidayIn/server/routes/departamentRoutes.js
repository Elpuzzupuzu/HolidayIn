const express = require("express");
const router = express.Router();
const DepartmentController = require("../controllers/departamentController");

router.post("/add", DepartmentController.create);
router.get("/getall", DepartmentController.getAll);
router.get("/getById/:id", DepartmentController.getById);  
router.put("/update/:id", DepartmentController.update);   
router.delete("/delete/:id", DepartmentController.delete);

module.exports = router;

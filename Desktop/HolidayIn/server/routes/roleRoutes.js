const express = require("express");
const router = express.Router();
const RoleController = require("../controllers/roleController");

router.post("/add", RoleController.create);
router.get("/getall", RoleController.getAll);
router.get("/getById/:id", RoleController.getById);
router.put("/update/:id", RoleController.update);
router.delete("/delete/:id", RoleController.delete);

module.exports = router;

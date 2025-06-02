// routes/datEventRoutes.js
const express = require("express");
const router = express.Router();
const DatEventController = require("../controllers/datEventController");
const multer = require("multer"); // ¡Importa multer!
const path = require("path");   // ¡Importa path para manejar rutas de archivos!
const fs = require("fs");     // ¡Importa fs para manejar la eliminación de archivos!

// Configuración de Multer para guardar archivos temporalmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads'); // Ruta a la carpeta 'uploads'
    // Crea la carpeta 'uploads' si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Genera un nombre de archivo único para evitar colisiones
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// ✅ NUEVA RUTA para subir el archivo y procesarlo
// Este endpoint recibirá el archivo directamente del frontend
router.post("/upload-and-process-dat", upload.single("datFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se ha subido ningún archivo." });
    }

    const filePath = req.file.path; // Multer guarda el archivo y nos da su ruta temporal
    const result = await DatEventController.processDatFileInServer(filePath); // Llama al método del controlador
    res.status(200).json(result);
  } catch (error) {
    console.error("Error al subir y procesar el archivo .dat:", error.message);
    res.status(500).json({ error: "No se pudo subir y procesar el archivo .dat", details: error.message });
  }
});


// Tu ruta existente para procesar archivo .dat con ruta dinámica (si la sigues usando para otros fines)
router.post("/process-dat", DatEventController.processDatFile);

// Ruta para las horas de todo el .dat
router.get("/worked-hours", DatEventController.getWorkedHours);

// Filtra por número de empleado e intervalo de fechas
router.get('/worked-hours/employee', DatEventController.getTotalWorkedHoursByEmployee);

// Por departamento y fechas
router.get(
  "/worked-hours/department/:department_id",
  DatEventController.getTotalWorkedHoursByDepartment
);

// Ruta para filtrar por departamento y fechas
router.get("/worked-hours/filter", DatEventController.getWorkedHoursBetweenDates);

// ✅ : Generar CSV con horas trabajadas por fechas (y opcionalmente por empleado)
router.get("/worked-hours/csv", DatEventController.getWorkedHoursBetweenDatesCSV);

module.exports = router;
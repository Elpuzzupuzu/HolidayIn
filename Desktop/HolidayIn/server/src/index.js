require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const supabase = require("../config/supabase");

// 🔹 Importar rutas
const departmentRoutes = require("../routes/departamentRoutes");
const roleRoutes = require("../routes/roleRoutes");
const employeeRoutes = require("../routes/employeeRoutes");
const attendanceLogRoutes = require("../routes/attendanceLogRoutes");
const attendanceEventRoutes = require("../routes/attendanceEventRoutes");
const datEventRoutes = require("../routes/datEventRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// 🔹 Middlewares
app.use(
  cors({
    origin: "*", // ⚠️ Solo para pruebas locales (NO usar en producción)
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// 🔹 Ruta raíz de prueba
app.get("/", (req, res) => {
  res.send("¡Backend de HolidayIn funcionando!");
});

// 🔹 rutas
app.use("/api/departments", departmentRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceLogRoutes);
app.use("/attendance-events", attendanceEventRoutes);
app.use("/api/datEvents", datEventRoutes)

// 🔹 Iniciar servidor
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;

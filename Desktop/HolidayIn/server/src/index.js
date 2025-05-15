require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const supabase = require("../config/supabase"); // Si no lo usas directo aquí, igual se puede mantener para validación

// 🔹 Importar rutas
const departmentRoutes = require("../routes/departamentRoutes");
const roleRoutes = require("../routes/roleRoutes");
const employeeRoutes = require("../routes/employeeRoutes");
const attendanceLogRoutes = require("../routes/attendanceLogRoutes");





const app = express();
const PORT = process.env.PORT || 5000;

// 🔹 Middlewares
app.use(
  cors({
    origin: "https://a-mimos-sb.onrender.com", // Cambia esto según el frontend
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

// 🔹 Usar rutas departamentos
app.use("/api/departments", departmentRoutes);

// Usar rutas de Roles
app.use("/api/roles", roleRoutes);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// rutas empleado
app.use("/api/employees", employeeRoutes);

//rutas checkIn/checkOut
app.use("/api/attendance", attendanceLogRoutes);




module.exports = app;

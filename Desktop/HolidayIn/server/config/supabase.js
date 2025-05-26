// const { createClient } = require("@supabase/supabase-js");
// require("dotenv").config(); // Cargar variables de entorno

// const SUPABASE_URL = process.env.SUPABASE_URL;
// const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// module.exports = supabase;


const mysql = require('mysql2/promise'); // usamos la versión con promesas
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,      // ej: 'localhost'
  user: process.env.MYSQL_USER,      // ej: 'root'
  password: process.env.MYSQL_PASS,  // tu contraseña
  database: process.env.MYSQL_DB,    // nombre de la base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

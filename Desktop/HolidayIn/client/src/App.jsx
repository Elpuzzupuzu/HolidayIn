import { Routes, Route } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";  
import AuthLayout from "./components/layout/AuthLayout";    
import CheckAuth from "./components/common/CheckAuth"

import Login from "./pages/auth/Login";
import RecoverPassword from "./pages/auth/RecoverPassword";

import Home from "./pages/dashboard/Home";
import LogsList from "./pages/attendance/LogList";
import LogDetail from "./pages/attendance/LogDetails";

import NotFound from "./pages/NotFound";

function App() {
  // Dummy de autenticación para pruebas
  const isAuthenticated = true;  // Siempre autenticado
  const user = { name: "Test User", role: "admin" }; // Usuario dummy
  const isLoading = false; // Simulamos que no está cargando

  if (isLoading) return <div>Loading...</div>;

  return (
    <Routes>
      {/* Autenticación */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="recover-password" element={<RecoverPassword />} />
      </Route>

      {/* Rutas protegidas */}
      <Route
        path="/admin"
        element={
          <CheckAuth isAuthenticated={isAuthenticated} user={user}>
            <AdminLayout />
          </CheckAuth>
        }
      >
        <Route path="dashboard" element={<Home />} />
        <Route path="logs" element={<LogsList />} />
        <Route path="logs/FindByID" element={<LogDetail />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

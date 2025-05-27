import React from "react"; // No necesitamos NavLink ni Outlet aquí
import "./styles/CheckAuth.css"; // Solo para el estilo de "unauthorized"

// CheckAuth solo recibe 'isAuthenticated', 'user', y 'children'
export default function CheckAuth({ isAuthenticated, user, children }) {
  if (!isAuthenticated) {
    return <div className="unauthorized">No autorizado</div>;
  }

  // Si está autenticado, simplemente renderiza el contenido hijo (que será AdminLayout)
  return <>{children}</>;
}
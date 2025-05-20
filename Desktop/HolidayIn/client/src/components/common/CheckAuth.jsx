// src/components/common/CheckAuth.jsx

import { NavLink, Outlet } from "react-router-dom";
import "./styles/CheckAuth.css";

export default function CheckAuth({ isAuthenticated, user, children }) {
  if (!isAuthenticated) {
    return <div className="unauthorized">No autorizado</div>; // Or redirection
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <p className="user-name">{user?.name}</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/logs"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Registros
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
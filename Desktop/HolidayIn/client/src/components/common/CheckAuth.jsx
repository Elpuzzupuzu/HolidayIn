import { NavLink, Outlet } from "react-router-dom";
import "./styles/CheckAuth.css";
import AsideResumen from "../../components/common/AsideResumen";

export default function CheckAuth({ isAuthenticated, user }) {
  if (!isAuthenticated) {
    return <div className="unauthorized">No autorizado</div>;
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
            to="/admin/logs/findbyID"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            buscar por Numero de Empleado
          </NavLink>
              <NavLink
            to="/admin/logs"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Todos los Registros
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button">Cerrar sesión</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          <section className="main-section">
            <Outlet />
          </section>
          {/* <aside className="right-aside">
            <AsideResumen />
          </aside> */}
        </div>
      </main>
    </div>
  );
}

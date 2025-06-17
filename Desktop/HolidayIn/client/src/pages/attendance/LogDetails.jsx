import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHoursByDepartment, clearWorkedHours, getTotalWorkedHoursByEmployee, clearTotalWorkedHours } from "../../features/datEvents/datEventsSlice"; 

import "./styles/LogDetail.css"; // Asegúrate de que esta línea esté presente
import EmployeeResume from "./EmployeeResume";
// Import Hook personalizado
import useDateValidation from "../../components/hooks/useDateValidation"; 

const ResumenPorDepartamento = () => {
  const dispatch = useDispatch();

  // Local state (SIN CAMBIOS)
  const [departmentId, setDepartmentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showResume, setShowResume] = useState(false);

  // Global state (SIN CAMBIOS)
  const { workedHours, status, error, totalWorkedHours } = useSelector((state) => state.datEvents);
  
  // Calculate total hours with better number handling (SIN CAMBIOS)
  const totalHours = workedHours?.length > 0 
    ? workedHours.reduce((acc, curr) => {
        const hours = parseFloat(curr.total_hours);
        return acc + (isNaN(hours) ? 0 : hours);
      }, 0).toFixed(2)
    : 0;

  // Limpiar workedHours al montar el componente. (SIN CAMBIOS)
  useEffect(() => {
    dispatch(clearWorkedHours());
  }, [dispatch]);

  // --- Usando el Hook personalizado --- (SIN CAMBIOS)
  const validateSearchDates = useDateValidation(from, to, '2020-01-01');


  ///// HANDLE (SIN CAMBIOS)
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!departmentId || !from || !to) {
      alert("⚠️ Por favor completa todos los campos requeridos:\n" +
            `${!departmentId ? "• Departamento\n" : ""}` +
            `${!from ? "• Fecha de inicio\n" : ""}` +
            `${!to ? "• Fecha de fin" : ""}`);
      return;
    }

    if (!validateSearchDates()) {
      return;
    }
    
    dispatch(getWorkedHoursByDepartment({ department_id: departmentId, from, to }));
  };


  // setDefaultDates (SIN CAMBIOS)
  const setDefaultDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    setFrom(yesterday.toISOString().split("T")[0]);
    setTo(today.toISOString().split("T")[0]);
  };

  // handleRowClick (SIN CAMBIOS)
  const handleRowClick = (employeeNumber) => {
    if (!from || !to) {
      alert("Por favor selecciona un rango de fechas antes de ver el resumen del empleado.");
      return;
    }

    setSelectedEmployee(employeeNumber);
    setShowResume(true);
    dispatch(getTotalWorkedHoursByEmployee({
      employee_number: employeeNumber,
      from,
      to
    }));
  };

  // closeModal (SIN CAMBIOS)
  const closeModal = () => {
    if (selectedEmployee && departmentId && from && to) {
      dispatch(getWorkedHoursByDepartment({
        department_id: departmentId,
        from,
        to,
      }));
    }

    dispatch(clearTotalWorkedHours()); // 🔄 Limpiar datos antiguos

    setSelectedEmployee(null);
    setShowResume(false);
  };

  // --- Lógica de ordenamiento aquí --- (SIN CAMBIOS)
  const sortedWorkedHours = workedHours ? [...workedHours].sort((a, b) => {
    const hoursA = parseFloat(a.total_hours);
    const hoursB = parseFloat(b.total_hours);

    if (hoursA > 0 && hoursB === 0) {
      return -1;
    }
    if (hoursA === 0 && hoursB > 0) {
      return 1;
    }
    return 0;
  }) : [];


  return (
    <div className="main-layout"> {/* Nuevo contenedor principal para el layout */}
      
      {/* Sección del Encabezado Principal */}
      <header className="main-header">
        <h1 className="main-title">
          <span className="icon">📊</span>
          Resumen por Departamento
        </h1>
        <p className="main-subtitle">
          Consulta las horas trabajadas por empleado en cada departamento
        </p>
      </header>

      {/* Sección de Parámetros de Búsqueda */}
      <section className="card search-parameters"> {/* Una "tarjeta" para los parámetros */}
        <div className="card-header">
          <h2 className="card-title">
            <span className="icon">🔍</span>
            Parámetros de Búsqueda
          </h2>
        </div>
        
        <form onSubmit={handleSearch} className="form-grid">
          <div className="form-group">
            <label className="form-label">
              🏢 ID Departamento *
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="form-input"
              required
            >
              <option value="">Seleccione un departamento</option>
              <option value="1">Ama de llaves</option>
              <option value="2">Mantenimiento</option>
              <option value="3">Alimentos y Bebidas</option>
              <option value="4">Recepción</option>
              <option value="5">Administración</option>
              <option value="6">Ventas</option>
              <option value="7">RRHH</option>
              <option value="8">Seguridad</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              📅 Fecha Desde *
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              📅 Fecha Hasta *
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-actions"> {/* Contenedor para los botones */}
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Buscando..." : "🔍 Buscar"}
            </button>
            
            <button 
              type="button"
              onClick={setDefaultDates} 
              className="btn btn-secondary"
            >
              📊 Hoy
            </button>
          </div>
        </form>
      </section>

      {/* Sección de Resultados de Búsqueda (la tabla) */}
      <section className="card search-results"> {/* Otra "tarjeta" para los resultados */}
        <div className="card-header">
          <h2 className="card-title">
            <span className="icon">📈</span>
            Resultados de Búsqueda
          </h2>
          {status === "succeeded" && (
            <div className="results-summary"> {/* Resumen compacto de resultados */}
              {departmentId && <span className="summary-item">Departamento: <strong>{departmentId}</strong></span>}
              {workedHours?.length > 0 && (
                <>
                  <span className="summary-item">👥 Empleados: {workedHours.length}</span>
                  <span className="summary-item">⏰ Total Horas: {totalHours}h</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="table-wrapper"> {/* Contenedor para hacer la tabla scrollable */}
          <table className="data-table">
            <thead>
              {status === "succeeded" && workedHours?.length > 0 && (
                <tr>
                  <th>👤 Número de Empleado</th>
                  <th>⏱️ Horas Trabajadas</th>
                </tr>
              )}
            </thead>
            <tbody>
              {status === "loading" && (
                <tr>
                  <td colSpan="2" className="status-message">
                    <div className="loading-indicator">
                      ⏳ Cargando datos del departamento...
                    </div>
                  </td>
                </tr>
              )}
              
              {status === "failed" && (
                <tr>
                  <td colSpan="2" className="status-message">
                    <div className="error-message">
                      ❌ Error: {error}
                      <button onClick={handleSearch} className="btn btn-primary btn-small">
                        🔄 Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              
              {status === "succeeded" && workedHours?.length === 0 && (
                <tr>
                  <td colSpan="2" className="status-message">
                    <div className="warning-message">
                      📋 No se encontraron datos para el departamento <strong>{departmentId}</strong>
                    </div>
                  </td>
                </tr>
              )}
              
              {status === "succeeded" && sortedWorkedHours?.length > 0 && 
                sortedWorkedHours.map((item, idx) => (
                  <tr
                    key={`${item.employee_number}-${idx}`}
                    className={`data-row ${selectedEmployee === item.employee_number ? 'row-selected' : ''}`}
                    onClick={() => handleRowClick(item.employee_number)}
                  >
                    <td className="data-cell">
                      👤 {item.employee_number} - {item.name} 
                      {selectedEmployee === item.employee_number && <span className="selected-badge"> ✓</span>}
                    </td>
                    <td className="data-cell">
                      {(() => {
                        const hours = parseFloat(item.total_hours);
                        return isNaN(hours) ? '0.00' : hours.toFixed(2);
                      })()} horas
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal para EmployeeResume (se mantiene como está, solo asegúrate de importar el CSS de EmployeeResume si aún no lo haces) */}
      {showResume && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={closeModal} />
          <EmployeeResume
            resumen={totalWorkedHours}  
            workedHours={workedHours} 
            onClose={closeModal}
          />
        </div>
      )}
    </div>
  );
};

export default ResumenPorDepartamento;
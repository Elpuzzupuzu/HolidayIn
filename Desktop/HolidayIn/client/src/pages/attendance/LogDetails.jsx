import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHoursByDepartment, clearWorkedHours, getTotalWorkedHoursByEmployee, clearTotalWorkedHours } from "../../features/datEvents/datEventsSlice"; 

import "./styles/LogDetail.css";
import EmployeeResume from "./EmployeeResume";
// Import Hook personalizado
import useDateValidation from "../../components/hooks/useDateValidation"; 

const ResumenPorDepartamento = () => {
  const dispatch = useDispatch();

  // Local state
  const [departmentId, setDepartmentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showResume, setShowResume] = useState(false);

  // Global state
  const { workedHours, status, error, totalWorkedHours } = useSelector((state) => state.datEvents);
  
  // Este useEffect no es estrictamente necesario para la funcionalidad, pero puede ser útil para depuración.

  // useEffect(() => {
  //   console.log("PRUEBAAAA ", workedHours);
  // }, [workedHours]);


  // Calculate total hours with better number handling
  
  
  const totalHours = workedHours?.length > 0 
    ? workedHours.reduce((acc, curr) => {
        const hours = parseFloat(curr.total_hours);
        return acc + (isNaN(hours) ? 0 : hours);
      }, 0).toFixed(2)
    : 0;

  // Limpiar workedHours al montar el componente.
  useEffect(() => {
    dispatch(clearWorkedHours());
  }, [dispatch]);

  // --- Usando el Hook personalizado ---
  // Llama al hook y obtén la función de validación.
  // Pasa 'from' y 'to' como argumentos, y opcionalmente tu fecha mínima.
  const validateSearchDates = useDateValidation(from, to, '2020-01-01');


  ///// HANDLE
  const handleSearch = (e) => {
    e.preventDefault();
    
    // 1. Validar campos requeridos (sigue aquí porque no es solo de fechas)
    if (!departmentId || !from || !to) {
      alert("⚠️ Por favor completa todos los campos requeridos:\n" +
            `${!departmentId ? "• Departamento\n" : ""}` +
            `${!from ? "• Fecha de inicio\n" : ""}` +
            `${!to ? "• Fecha de fin" : ""}`);
      return;
    }

    // 2. ¡Llama a la función de validación del Hook!
    if (!validateSearchDates()) {
      return; // Si el hook reporta un error, detén la ejecución
    }
    
    // Si todas las validaciones pasan, procede con el dispatch
    dispatch(getWorkedHoursByDepartment({ department_id: departmentId, from, to }));
  };



  const setDefaultDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    setFrom(yesterday.toISOString().split("T")[0]);
    setTo(today.toISOString().split("T")[0]);
  };

  const handleRowClick = (employeeNumber) => {
    // Aquí puedes decidir si quieres usar también validateSearchDates
    // o si la validación en handleSearch es suficiente antes de entrar a esta lógica
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

  // --- Lógica de ordenamiento aquí ---
  const sortedWorkedHours = workedHours ? [...workedHours].sort((a, b) => {
    const hoursA = parseFloat(a.total_hours);
    const hoursB = parseFloat(b.total_hours);

    // Si 'a' tiene horas y 'b' no, 'a' va antes (-1)
    if (hoursA > 0 && hoursB === 0) {
      return -1;
    }
    // Si 'b' tiene horas y 'a' no, 'b' va antes (1, es decir, 'a' va después)
    if (hoursA === 0 && hoursB > 0) {
      return 1;
    }
    // Si ambos tienen horas > 0 o ambos tienen horas === 0, mantén el orden relativo o añade otro criterio (ej. por nombre)
    return 0; // Si no hay una diferencia relevante para el orden, no cambies la posición
  }) : [];


  return (
    <div className="resumen-container">
      {/* Resto de tu JSX permanece igual */}
      <div className="page-header">
        <h1 className="resumen-title">
          <span className="title-icon">📊</span>
          Resumen por Departamento
        </h1>
        <p className="page-subtitle">
          Consulta las horas trabajadas por empleado en cada departamento
        </p>
      </div>

      <div className="input-container">
        <div className="form-header">
          <h3 className="form-title">
            <span className="form-icon">🔍</span>
            Parámetros de Búsqueda
          </h3>
        </div>
        
        <form onSubmit={handleSearch} className="input-grid">
            <div className="input-group">
              <label className="input-label">
                🏢 ID Departamento *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Seleccione un departamento</option>
                <option value="1">Ama de llaves</option>
                <option value="2">Mantenimiento</option>
                <option value="3">Aliementos y Bebidas</option>
                <option value="4">Recepcion</option>
                <option value="5">Administracion</option>
                <option value="6">Ventas</option>
                <option value="7">RRHH</option>
                <option value="8">Seguridad</option>
              </select>
            </div>


          <div className="input-group">
            <label className="input-label">
              📅 Fecha Desde *
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              📅 Fecha Hasta *
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="button-group">
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
      </div>

      <div className="table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th colSpan="2" className="table-header">
                <div className="header-content">
                  <h3 className="results-title">📊 Resultados de Búsqueda</h3>
                  {departmentId && <p>Departamento: <strong>{departmentId}</strong></p>}
                  {status === "succeeded" && workedHours?.length > 0 && (
                    <div className="results-summary">
                      <span>👥 Empleados: {workedHours.length}</span>
                      <span>⏰ Total Horas: {totalHours}h</span>
                    </div>
                  )}
                </div>
              </th>
            </tr>
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
                <td colSpan="2" className="status-cell">
                  <div className="loading-indicator">
                    ⏳ Cargando datos del departamento...
                  </div>
                </td>
              </tr>
            )}
            
            {status === "failed" && (
              <tr>
                <td colSpan="2" className="status-cell">
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
                <td colSpan="2" className="status-cell">
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
                  style={{ cursor: 'pointer' }}
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
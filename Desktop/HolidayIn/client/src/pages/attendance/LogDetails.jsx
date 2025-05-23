import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHoursByDepartment, clearWorkedHours, getTotalWorkedHoursByEmployee } from "../../features/datEvents/datEventsSlice";
import "./styles/LogDetail.css";
import EmployeeResume from "./EmployeeResume";

const ResumenPorDepartamento = () => {
  const dispatch = useDispatch();

  // Local state
  const [departmentId, setDepartmentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showResume, setShowResume] = useState(false);

  // Global state
  const { workedHours, status, error, totalWorkedHours } = useSelector((state) => state.datEvents);

  useEffect(() => {
    if (workedHours && workedHours.length > 0) {
      const sum = workedHours.reduce((acc, curr) => acc + parseFloat(curr.total_hours || 0), 0);
      setTotalHours(sum.toFixed(2));
    } else {
      setTotalHours(0);
    }
  }, [workedHours]);

  useEffect(() => {
    dispatch(clearWorkedHours());
  }, []);

  const handleBuscar = () => {
    if (!departmentId || !from || !to) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }
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

  // Enhanced UI Components
  const SearchForm = () => (
    <div className="input-container">
      <div className="form-header">
        <h3 className="form-title">
          <span className="form-icon">🔍</span>
          Parámetros de Búsqueda
        </h3>
        <p className="form-subtitle">Ingresa los datos para consultar las horas trabajadas por departamento</p>
      </div>
      
      <div className="input-grid">
        <div className="input-group">
          <label className="input-label">
            <span className="label-icon">🏢</span>
            ID Departamento
            <span className="required-indicator">*</span>
          </label>
          <input
            type="text"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="input-field"
            placeholder="Ej: DEPT01, VENTAS, IT..."
            maxLength={20}
          />
          {departmentId && (
            <span className="input-helper">
              Departamento: {departmentId}
            </span>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">
            <span className="label-icon">📅</span>
            Fecha Desde
            <span className="required-indicator">*</span>
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input-field"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <span className="label-icon">📅</span>
            Fecha Hasta
            <span className="required-indicator">*</span>
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input-field"
            max={new Date().toISOString().split("T")[0]}
            min={from}
          />
        </div>

        <div className="button-group">
          <button 
            onClick={handleBuscar} 
            className="btn btn-primary"
            disabled={status === "loading" || !departmentId || !from || !to}
          >
            {status === "loading" ? (
              <>
                <span className="btn-spinner"></span>
                Buscando...
              </>
            ) : (
              <>
                <span className="btn-icon">🔍</span>
                Buscar
              </>
            )}
          </button>
          
          <button 
            onClick={setDefaultDates} 
            className="btn btn-secondary"
            title="Establecer rango de fechas: ayer a hoy"
          >
            <span className="btn-icon">📊</span>
            Hoy
          </button>
        </div>
      </div>

      {(from && to) && (
        <div className="date-range-info">
          <span className="info-icon">ℹ️</span>
          Consultando desde <strong>{new Date(from).toLocaleDateString('es-ES')}</strong> hasta <strong>{new Date(to).toLocaleDateString('es-ES')}</strong>
        </div>
      )}
    </div>
  );

  const TableHeader = () => (
    <thead>
      <tr>
        <th colSpan="2" className="table-header">
          <div className="header-content">
            <div className="header-left">
              <h3 className="results-title">
                <span className="results-icon">📊</span>
                Resultados de Búsqueda
              </h3>
              {departmentId && (
                <p className="department-info">Departamento: <strong>{departmentId}</strong></p>
              )}
            </div>
            
            {status === "succeeded" && workedHours.length > 0 && (
              <div className="results-summary">
                <div className="summary-item">
                  <span className="summary-icon">👥</span>
                  <span className="summary-label">Empleados:</span>
                  <span className="summary-value">{workedHours.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">⏰</span>
                  <span className="summary-label">Total Horas:</span>
                  <span className="summary-value">{totalHours}h</span>
                </div>
              </div>
            )}
          </div>
        </th>
      </tr>
      
      {status === "succeeded" && workedHours.length > 0 && (
        <tr>
          <th className="column-header">
            <span className="column-icon">👤</span>
            Número de Empleado
          </th>
          <th className="column-header">
            <span className="column-icon">⏱️</span>
            Horas Trabajadas
          </th>
        </tr>
      )}
    </thead>
  );

  const LoadingState = () => (
    <tr>
      <td colSpan="2" className="status-cell">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p className="loading-text">
            <span className="loading-icon">⏳</span>
            Cargando datos del departamento...
          </p>
          <p className="loading-subtext">Esto puede tomar unos segundos</p>
        </div>
      </td>
    </tr>
  );

  const ErrorState = () => (
    <tr>
      <td colSpan="2" className="status-cell">
        <div className="error-message">
          <div className="error-icon">❌</div>
          <div className="error-content">
            <h4 className="error-title">Error al cargar los datos</h4>
            <div className="error-text">{error}</div>
            <button 
              onClick={handleBuscar} 
              className="btn btn-primary btn-small"
              style={{ marginTop: '12px' }}
            >
              <span className="btn-icon">🔄</span>
              Intentar de nuevo
            </button>
          </div>
        </div>
      </td>
    </tr>
  );

  const EmptyState = () => (
    <tr>
      <td colSpan="2" className="status-cell">
        <div className="warning-message">
          <div className="warning-icon">📋</div>
          <div className="warning-content">
            <h4 className="warning-title">Sin resultados</h4>
            <div className="warning-text">
              No se encontraron horas trabajadas para el departamento <strong>{departmentId}</strong> 
              en el período seleccionado.
            </div>
            <div className="warning-suggestions">
              <p>Sugerencias:</p>
              <ul>
                <li>Verifica el ID del departamento</li>
                <li>Amplía el rango de fechas</li>
                <li>Contacta al administrador si el problema persiste</li>
              </ul>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );

  const DataRow = ({ item, idx }) => (
    <tr
      key={idx}
      className={`
        ${idx % 2 === 0 ? 'row-even' : 'row-odd'} 
        ${selectedEmployee === item.employee_number ? 'row-selected' : ''}
        data-row
      `}
      onClick={() => handleRowClick(item.employee_number)}
      title={`Click para ver detalles del empleado ${item.employee_number}`}
    >
      <td className="data-cell employee-cell">
        <div className="employee-info">
          <span className="employee-icon">👤</span>
          <span className="employee-number">{item.employee_number}</span>
          {selectedEmployee === item.employee_number && (
            <span className="selected-badge">Seleccionado</span>
          )}
        </div>
      </td>
      <td className="data-cell hours-cell">
        <div className="hours-info">
          <span className="hours-value">{parseFloat(item.total_hours).toFixed(2)}</span>
          <span className="hours-unit">horas</span>
        </div>
      </td>
    </tr>
  );

  const ResultsTable = () => (
    <div className="table-container">
      <table className="results-table">
        <TableHeader />
        <tbody>
          {status === "loading" && <LoadingState />}
          {status === "failed" && <ErrorState />}
          {status === "succeeded" && workedHours.length === 0 && <EmptyState />}
          {status === "succeeded" && workedHours.length > 0 && 
            workedHours.map((item, idx) => (
              <DataRow key={idx} item={item} idx={idx} />
            ))
          }
        </tbody>
      </table>
      
      {status === "succeeded" && workedHours.length > 0 && (
        <div className="table-footer">
          <div className="table-info">
            <span className="info-text">
              💡 Haz clic en cualquier fila para ver el resumen detallado del empleado
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="resumen-container">
      {/* Enhanced Header */}
      <div className="page-header">
        <h1 className="resumen-title">
          <span className="title-icon">📊</span>
          Resumen por Departamento
        </h1>
        <p className="page-subtitle">
          Consulta y analiza las horas trabajadas por empleado en cada departamento
        </p>
      </div>

      {/* Enhanced Search Form */}
      <SearchForm />

      {/* Enhanced Results Table */}
      <ResultsTable />

      {/* Employee Resume Modal */}
      {showResume && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => {
            setSelectedEmployee(null);
            setShowResume(false);
          }} />
          <EmployeeResume
            resumen={totalWorkedHours}
            onClose={() => {
              setSelectedEmployee(null);
              setShowResume(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ResumenPorDepartamento;
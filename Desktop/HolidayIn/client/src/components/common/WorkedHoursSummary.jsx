import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHoursBetweenDates } from "../store/datEventsSlice"; // ajusta la ruta
import "./styles/WorkedHoursSummary.css"; // opcional para estilos

const WorkedHoursSummary = () => {
  const dispatch = useDispatch();
  const { workedHoursData, loading, error } = useSelector((state) => state.datEvents);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");

  const handleFetch = () => {
    if (!startDate || !endDate) return alert("Debes seleccionar fechas válidas");

    dispatch(getWorkedHoursBetweenDates({
      startDate,
      endDate,
      employeeNumber: employeeNumber || null,
    }));
  };

  return (
    <div className="worked-hours-summary">
      <h2>Consultar Horas Trabajadas</h2>

      <div className="filters">
        <label>
          Desde:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          Hasta:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label>
          Nº Empleado (opcional):
          <input type="text" value={employeeNumber} onChange={(e) => setEmployeeNumber(e.target.value)} />
        </label>
        <button onClick={handleFetch}>Consultar</button>
      </div>

      {loading && <p>Cargando datos...</p>}
      {error && <p className="error">Error: {error}</p>}

      {workedHoursData && workedHoursData.length > 0 && (
        <div className="results">
          <h3>Resultados:</h3>
          <table>
            <thead>
              <tr>
                <th>Nº Empleado</th>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Horas Trabajadas</th>
              </tr>
            </thead>
            <tbody>
              {workedHoursData.map((item, index) => (
                <tr key={index}>
                  <td>{item.employeeNumber}</td>
                  <td>{item.employeeName}</td>
                  <td>{item.date}</td>
                  <td>{parseFloat(item.totalHours).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {workedHoursData && workedHoursData.length === 0 && !loading && (
        <p>No se encontraron resultados para los criterios ingresados.</p>
      )}
    </div>
  );
};

export default WorkedHoursSummary;

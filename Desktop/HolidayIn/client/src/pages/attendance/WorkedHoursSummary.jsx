import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHoursBetweenDates } from "../../features/datEvents/datEventsSlice";

const WorkedHoursSummary = ({ employeeNumber, from, to }) => {
  const dispatch = useDispatch();
  const { workedHours, status, error } = useSelector((state) => state.datEvents);

  useEffect(() => {
    if (employeeNumber && from && to) {
      dispatch(getWorkedHoursBetweenDates({
        employeeNumber,
        startDate: from,
        endDate: to,
      }));
    }
  }, [employeeNumber, from, to, dispatch]);

  console.log("workedHours:", workedHours);

  return (
    <div className="worked-hours-summary">
      <h2>Consultar Horas Trabajadas</h2>

      {status === "loading" && <p>Cargando datos...</p>}
      {error && <p className="error">Error: {error}</p>}

      {status !== "loading" && (!workedHours || workedHours.length === 0) && (
        <p>No se encontraron resultados para los criterios ingresados.</p>
      )}

      {workedHours && workedHours.length > 0 && (
        <div className="results">
          <h3>Resultados:</h3>
          <table>
            <thead>
              <tr>
                <th>Nº Empleado</th>
              
                <th>Fecha</th>
                <th>Horas Trabajadas</th>
              </tr>
            </thead>
            <tbody>
              {workedHours.map((item, index) => (
                <tr key={index}>
                  <td>{item.employee_number}</td>
                  <td>{item.employeeName || "-"}</td>
                  <td>{item.entry_date}</td>
                  <td>{item.hours_worked ? item.hours_worked.toFixed(2) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkedHoursSummary;

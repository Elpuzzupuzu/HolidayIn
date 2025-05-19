import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHours } from "../../features/datEvents/datEventsSlice";

const LogList = () => {
  const dispatch = useDispatch();

  const { workedHours, status, error } = useSelector((state) => state.datEvents);

  useEffect(() => {
    dispatch(getWorkedHours({ page: 1, limit: 20 }));
  }, [dispatch]);

  const calculateWorkedHours = (entryDate, entryTime, exitDate, exitTime) => {
    const start = new Date(`${entryDate}T${entryTime}`);
    const end = new Date(`${exitDate}T${exitTime}`);
    const diffMs = end - start;
    if (diffMs < 0) return "0.00"; // en caso de datos erróneos
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(2); // horas con 2 decimales
  };

  if (status === "loading") return <p>Cargando...</p>;
  if (status === "failed") return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Horas Trabajadas</h2>
      <table>
        <thead>
          <tr>
            <th>Número de Empleado</th>
            <th>Fecha Entrada</th>
            <th>Hora Entrada</th>
            <th>Fecha Salida</th>
            <th>Hora Salida</th>
            <th>Horas Trabajadas</th>
          </tr>
        </thead>
        <tbody>
          {workedHours.map((log, index) => (
            <tr key={index}>
              <td>{log.employee_number}</td>
              <td>{log.entry_date}</td>
              <td>{log.entry_time}</td>
              <td>{log.exit_date}</td>
              <td>{log.exit_time}</td>
              <td>{calculateWorkedHours(log.entry_date, log.entry_time, log.exit_date, log.exit_time)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogList;

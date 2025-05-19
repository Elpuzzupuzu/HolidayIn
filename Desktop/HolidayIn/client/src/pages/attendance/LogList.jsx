import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHours } from "../../features/datEvents/datEventsSlice";

const LogList = () => {
  const dispatch = useDispatch();
  const { workedHours, status, error } = useSelector((state) => state.datEvents);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    dispatch(getWorkedHours({ page, limit }));
  }, [dispatch, page, limit]);

  const calculateWorkedHours = (entryDate, entryTime, exitDate, exitTime) => {
    const start = new Date(`${entryDate}T${entryTime}`);
    const end = new Date(`${exitDate}T${exitTime}`);
    const diffMs = end - start;
    if (diffMs < 0) return "0.00";
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(2);
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-indigo-700 font-semibold">Cargando registros de asistencia...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="max-w-3xl mx-auto bg-red-100 border-l-4 border-red-600 text-red-800 p-5 rounded-lg shadow-lg mt-6">
        <div className="flex">
          <div className="py-1">
            <svg
              className="h-6 w-6 text-red-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-lg">Error al cargar datos</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl w-full bg-white rounded-xl shadow-2xl p-8 border border-indigo-200">
        <div className="flex justify-between items-center mb-10 border-b border-indigo-300 pb-5">
          <div>
            <h2 className="text-3xl font-extrabold text-indigo-900">
              Control de Asistencia
            </h2>
            <p className="text-indigo-600 mt-1 text-lg">
              Departamento de Recursos Humanos
            </p>
          </div>

          <div className="flex items-center bg-indigo-100 rounded-lg px-5 py-3 shadow-inner">
            <span className="text-sm text-indigo-700 mr-3 font-semibold">
              Registros por página:
            </span>
            <select
              className="bg-white border border-indigo-300 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center mb-10">
          <div className="w-full overflow-x-auto rounded-lg border border-indigo-300 shadow-md">
            <table className="min-w-full bg-white rounded-lg">
              <thead className="bg-indigo-100">
                <tr>
                  {[
                    "N° Empleado",
                    "Fecha Entrada",
                    "Hora Entrada",
                    "Fecha Salida",
                    "Hora Salida",
                    "Horas Trabajadas",
                  ].map((header) => (
                    <th
                      key={header}
                      className="py-4 px-7 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider border-b border-indigo-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-200">
                {workedHours.length > 0 ? (
                  workedHours.map((log, index) => (
                    <tr
                      key={index}
                      className={`transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-indigo-50"
                      } hover:bg-indigo-200`}
                    >
                      <td className="py-4 px-7 whitespace-nowrap text-sm font-semibold text-indigo-900">
                        {log.employee_number}
                      </td>
                      <td className="py-4 px-7 whitespace-nowrap text-sm text-indigo-700">
                        {log.entry_date}
                      </td>
                      <td className="py-4 px-7 whitespace-nowrap text-sm text-indigo-700">
                        {log.entry_time}
                      </td>
                      <td className="py-4 px-7 whitespace-nowrap text-sm text-indigo-700">
                        {log.exit_date}
                      </td>
                      <td className="py-4 px-7 whitespace-nowrap text-sm text-indigo-700">
                        {log.exit_time}
                      </td>
                      <td className="py-4 px-7 whitespace-nowrap text-sm font-semibold text-indigo-800">
                        {calculateWorkedHours(
                          log.entry_date,
                          log.entry_time,
                          log.exit_date,
                          log.exit_time
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-12 px-7 text-center text-indigo-500 font-semibold"
                    >
                      No hay registros de asistencia disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between bg-indigo-100 p-5 rounded-lg shadow-inner">
          <div className="text-sm text-indigo-700 font-semibold">
            <span>Página {page}</span> · {limit} registros por página
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-5 py-2 rounded-md font-semibold ${
                page === 1
                  ? "bg-indigo-200 text-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
              }`}
            >
              Anterior
            </button>

            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-5 py-2 rounded-md font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogList;

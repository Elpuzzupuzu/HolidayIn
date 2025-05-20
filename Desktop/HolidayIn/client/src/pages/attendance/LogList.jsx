import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWorkedHours } from "../../features/datEvents/datEventsSlice";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Clock, Users, AlertCircle } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
        <div className="h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-indigo-800 font-semibold text-xl">Cargando registros de asistencia...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6">
        <div className="max-w-3xl w-full bg-white rounded-xl shadow-xl p-8 border-l-8 border-red-600">
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-10 w-10 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-2xl text-red-800 mb-2">Error al cargar datos</h3>
              <p className="text-red-700">{error}</p>
              <button 
                className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md"
                onClick={() => dispatch(getWorkedHours({ page, limit }))}
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine if data has rows
  const hasData = workedHours.length > 0;

  // Get current date for the header
  const currentDate = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-100 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-indigo-200 justify-center">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b-2 border-indigo-200">
          <div className="mb-4 md:mb-0 justify-center">
            <h2 className="text-3xl font-extrabold text-indigo-900 flex items-center">
              <Clock className="h-8 w-8 mr-3 text-indigo-700" />
              Control de Asistencia
            </h2>
            <p className="text-indigo-600 mt-2 text-lg flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Departamento de Recursos Humanos
            </p>
            <p className="text-gray-500 text-sm mt-2 italic first-letter:uppercase">
              {currentDate}
            </p>
          </div>

          <div className="bg-indigo-100 rounded-xl px-5 py-4 shadow-md border border-indigo-200">
            <span className="text-sm text-indigo-800 font-semibold block mb-2">
              Registros por página:
            </span>
            <select
              className="bg-white border-2 border-indigo-300 rounded-lg px-4 py-2 text-indigo-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 w-full"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5 registros</option>
              <option value={10}>10 registros</option>
              <option value={20}>20 registros</option>
              <option value={50}>50 registros</option>
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-indigo-200 shadow-lg mb-8 overflow-hidden">
          <div className="p-4 bg-indigo-800 text-white">
            <h3 className="text-xl font-semibold">Registros de Asistencia</h3>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-indigo-100 text-indigo-900">
                <TableRow className="hover:bg-indigo-50">
                  <TableHead className="px-6 py-4 text-lg font-semibold">N° Empleado</TableHead>
                  <TableHead className="px-6 py-4 text-lg font-semibold">Fecha Entrada</TableHead>
                  <TableHead className="px-6 py-4 text-lg font-semibold">Hora Entrada</TableHead>
                  <TableHead className="px-6 py-4 text-lg font-semibold">Fecha Salida</TableHead>
                  <TableHead className="px-6 py-4 text-lg font-semibold">Hora Salida</TableHead>
                  <TableHead className="px-6 py-4 text-lg font-semibold text-right">Horas Trabajadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workedHours.map((log, index) => {
                  const hours = parseFloat(calculateWorkedHours(
                    log.entry_date,
                    log.entry_time,
                    log.exit_date,
                    log.exit_time
                  ));

                  let rowClass = "";
                  let hoursClass = "";
                  let hoverClass = "";

                  if (hours < 4) {
                    hoursClass = "text-red-600 font-semibold";
                    rowClass = "bg-red-50/30";
                    hoverClass = "hover:bg-red-100 hover:shadow-md";
                  } else if (hours >= 8) {
                    hoursClass = "text-green-600 font-semibold";
                    rowClass = "bg-green-50/30";
                    hoverClass = "hover:bg-green-100 hover:shadow-md";
                  } else {
                    hoursClass = "text-amber-600 font-semibold";
                    rowClass = "bg-amber-50/30";
                    hoverClass = "hover:bg-amber-100 hover:shadow-md";
                  }

                  const baseRowClass = index % 2 === 0 ? "bg-white" : "bg-indigo-50/50";

                  return (
                    <TableRow 
                      key={index} 
                      className={`${baseRowClass} ${rowClass} border-b transition-all duration-200 cursor-pointer ${hoverClass} transform hover:scale-[1.01]`}
                    >
                      <TableCell className="px-6 py-4 text-base">{log.employee_number}</TableCell>
                      <TableCell className="px-6 py-4 text-base">{log.entry_date}</TableCell>
                      <TableCell className="px-6 py-4 text-base">{log.entry_time}</TableCell>
                      <TableCell className="px-6 py-4 text-base">{log.exit_date}</TableCell>
                      <TableCell className="px-6 py-4 text-base">{log.exit_time}</TableCell>
                      <TableCell className={`px-6 py-4 text-base text-right ${hoursClass}`}>
                        {hours.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {hasData && (
            <div className="p-4 bg-indigo-50 text-sm text-indigo-800 border-t border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span>Menos de 4 horas</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                    <span>Entre 4 y 8 horas</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>8 horas o más</span>
                  </div>
                </div>
                <div className="text-xs italic">Pase el cursor sobre una fila para destacarla</div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-indigo-100 p-5 rounded-xl shadow-inner border border-indigo-200">
          <div className="text-sm text-indigo-700 font-semibold mb-4 sm:mb-0">
            <span className="bg-indigo-200 px-3 py-1 rounded-lg">Página {page}</span>
            <span className="mx-2">•</span>
            <span>{limit} registros por página</span>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center ${
                page === 1
                  ? "bg-indigo-200 text-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-colors duration-200"
              }`}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span>Anterior</span>
            </button>

            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md flex items-center transition-colors duration-200"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-5 w-5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogList;
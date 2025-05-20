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
      <div>
        <div>Cargando registros de asistencia...</div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div>
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        <button onClick={() => dispatch(getWorkedHours({ page, limit }))}>
          Reintentar
        </button>
      </div>
    );
  }

  const hasData = workedHours.length > 0;

  const currentDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div>
        {/* Header */}
        <div>
          <h2>
            <Clock />
            Control de Asistencia
          </h2>
          <p>
            <Users />
            Departamento de Recursos Humanos
          </p>
          <p>{currentDate}</p>
        </div>

        {/* Registros por página */}
        <div>
          <label>Registros por página:</label>
          <select
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

      {/* Tabla de registros */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Empleado</TableHead>
              <TableHead>Fecha Entrada</TableHead>
              <TableHead>Hora Entrada</TableHead>
              <TableHead>Fecha Salida</TableHead>
              <TableHead>Hora Salida</TableHead>
              <TableHead>Horas Trabajadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workedHours.map((log, index) => {
              const hours = parseFloat(
                calculateWorkedHours(
                  log.entry_date,
                  log.entry_time,
                  log.exit_date,
                  log.exit_time
                )
              );

              return (
                <TableRow key={index}>
                  <TableCell>{log.employee_number}</TableCell>
                  <TableCell>{log.entry_date}</TableCell>
                  <TableCell>{log.entry_time}</TableCell>
                  <TableCell>{log.exit_date}</TableCell>
                  <TableCell>{log.exit_time}</TableCell>
                  <TableCell>{hours.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div>
        <div>
          <span>Página {page}</span>
          <span> • </span>
          <span>{limit} registros por página</span>
        </div>

        <div>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            <ChevronLeft />
            Anterior
          </button>

          <button onClick={() => setPage((p) => p + 1)}>
            Siguiente
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogList;

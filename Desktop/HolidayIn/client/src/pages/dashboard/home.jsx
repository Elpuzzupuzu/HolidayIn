import React, { useState, useEffect } from 'react';

export default function Home() {
  // Datos simulados
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalEmployees: 50,
    presentToday: 38,
    absentToday: 12,
  });

  const [recentLogs, setRecentLogs] = useState([
    { id: 1, name: 'Juan Pérez', time: '08:00 AM', status: 'Entrada' },
    { id: 2, name: 'Ana Gómez', time: '08:05 AM', status: 'Entrada' },
    { id: 3, name: 'Luis Martínez', time: '08:10 AM', status: 'Entrada' },
  ]);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Control de Asistencias - Hotel</h1>

      <section style={{ marginBottom: 30 }}>
        <h2>Resumen de Hoy</h2>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ padding: 20, backgroundColor: '#d4edda', borderRadius: 8 }}>
            <strong>Total Empleados:</strong>
            <p>{attendanceSummary.totalEmployees}</p>
          </div>
          <div style={{ padding: 20, backgroundColor: '#c3e6cb', borderRadius: 8 }}>
            <strong>Presentes Hoy:</strong>
            <p>{attendanceSummary.presentToday}</p>
          </div>
          <div style={{ padding: 20, backgroundColor: '#f8d7da', borderRadius: 8 }}>
            <strong>Ausentes Hoy:</strong>
            <p>{attendanceSummary.absentToday}</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Registros Recientes</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Empleado</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Hora</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {recentLogs.map(log => (
              <tr key={log.id}>
                <td>{log.name}</td>
                <td>{log.time}</td>
                <td>{log.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllEvents } from "../../features/dining_room/dinningSlice";

export default function DinningList() {
  const dispatch = useDispatch();

  const { events, loading, error } = useSelector((state) => state.dinning);

  useEffect(() => {
    dispatch(fetchAllEvents());
  }, [dispatch]);

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>Lista de Eventos</h2>

      {loading && <p>Cargando eventos...</p>}

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!loading && !error && events.length === 0 && <p>No hay eventos registrados.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {events.map((event) => (
          <li
            key={event.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 6,
              marginBottom: 10,
              padding: 10,
              backgroundColor: "#f9f9f9",
            }}
          >
            <p><strong>ID:</strong> {event.id}</p>
            <p><strong>Tipo de evento:</strong> {event.event_type}</p>
            <p><strong>Empleado:</strong> {event.employee_number}</p>
            <p><strong>Fecha:</strong> {new Date(event.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

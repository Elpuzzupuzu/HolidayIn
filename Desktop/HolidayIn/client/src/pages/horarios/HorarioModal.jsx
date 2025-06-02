// src/components/modals/HorarioModal.js
import React from 'react';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

// Función para determinar el rango de fechas de la semana
function obtenerRangoFechasSemana(numeroSemana, anio) {
  const fechaReferencia = new Date(anio, 0, 4); // 4 de enero del año especificado
  const diaSemanaReferencia = (fechaReferencia.getDay() + 6) % 7;
  const inicioSemana1 = new Date(fechaReferencia);
  inicioSemana1.setDate(fechaReferencia.getDate() - diaSemanaReferencia);

  const inicioSemanaDeseada = new Date(inicioSemana1);
  inicioSemanaDeseada.setDate(inicioSemana1.getDate() + (numeroSemana - 1) * 7);

  const finSemanaDeseada = new Date(inicioSemanaDeseada);
  finSemanaDeseada.setDate(inicioSemanaDeseada.getDate() + 6);

  const opcionesFormato = { year: 'numeric', month: '2-digit', day: '2-digit' };

  return {
    lunes: inicioSemanaDeseada.toLocaleDateString('es-ES', opcionesFormato),
    domingo: finSemanaDeseada.toLocaleDateString('es-ES', opcionesFormato),
  };
}

const HorarioModal = ({ colaborador, onClose }) => {
  if (!colaborador) {
    return null; // No renderiza nada si no hay un colaborador para mostrar
  }

  console.log("ℹ️ HorarioModal: Colaborador recibido para mostrar en la modal:", colaborador);
  console.log("en pruebas id", colaborador.id);
  console.log("en pruebas semana", colaborador.numeroSemana);
  console.log("en pruebas anio", colaborador.anioSemana);

  // Llama a la función para obtener el rango de fechas
  const rangoFechas = obtenerRangoFechasSemana(colaborador.numeroSemana, colaborador.anioSemana);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times; {/* Símbolo de "multiplicar" como una 'x' */}
        </button>
        <h3>Detalles del Colaborador</h3>
        <p><strong>ID Colaborador:</strong> {colaborador.idColaborador}</p>
        <p><strong>ID Departamento:</strong> {colaborador.deptoId}</p>
        <p><strong>Año Semana:</strong> {colaborador.anioSemana}</p>
        <p><strong>Número de Semana:</strong> {colaborador.numeroSemana}</p>
        {/* Muestra el rango de fechas aquí */}
        <p>
          <strong>Rango de Fechas:</strong> {rangoFechas.lunes} - {rangoFechas.domingo}
        </p>
        <p><strong>Activo:</strong> {colaborador.activo ? 'Sí' : 'No'}</p>

        <h4>Horarios de la Semana:</h4>
        <ul>
          {colaborador.semana.map((horario, index) => (
            <li key={index}>
              <strong>Día {index + 1}:</strong> {horario || 'Sin horario'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HorarioModal;
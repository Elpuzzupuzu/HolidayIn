// src/components/modals/HorarioModal.js
import React from 'react';

const HorarioModal = ({ colaborador, onClose }) => {
  if (!colaborador) {
    return null; // No renderiza nada si no hay un colaborador para mostrar
  }

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


// ¡ATENCIÓN: REVISA ESTA RUTA! Ajusta según la ubicación real de tu archivo Colaborador.js
import Colaborador from '../../../../server/models/Colaborador'; // Ajustado a una ruta más común dentro de src/models
import './styles/HorariosDeptoView.css'
// src/views/HorariosDeptoView.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchHorarios } from '../../features/horarios/horariosSlice';

// Importar el CSS y el componente Modal
import './styles/HorariosDeptoView.css'; 
import HorarioModal from './HorarioModal';

const HorariosDeptoView = () => {
  const dispatch = useDispatch();
  const { deptoId, numeroSemana } = useParams();
  const { data: rawHorarios, status, error } = useSelector((state) => state.horarios);

  // --- Estado para la Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState(null);

  // Función para abrir la modal
  const handleRowClick = (colaborador) => {
    setSelectedColaborador(colaborador);
    setIsModalOpen(true);
  };

  // Función para cerrar la modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedColaborador(null); // Limpiar el colaborador seleccionado
  };
  // --- FIN Estado para la Modal ---

  // --- LOGS EN EL COMPONENTE ---
  useEffect(() => {
    console.groupCollapsed("📊 Estado de HorariosDeptoView (cambio de Redux)");
    console.log("rawHorarios (datos planos de la API desde Redux):", rawHorarios);
    console.log("status (estado de la carga):", status);
    console.log("error (mensaje de error, si lo hay):", error);
    console.groupEnd();
  }, [rawHorarios, status, error]);

  // Mapea los datos planos a instancias de Colaborador en el componente
  const horarios = rawHorarios.map(item => new Colaborador(item));
  // console.log("horarios (Array de instancias de Colaborador mapeadas):", horarios);
  // --- FIN LOGS EN EL COMPONENTE ---

  const [currentDeptoId, setCurrentDeptoId] = useState(deptoId || '1');
  const [currentNumeroSemana, setCurrentNumeroSemana] = useState(numeroSemana || '23');

  useEffect(() => {
    if (deptoId && numeroSemana) {
      console.log(`➡️ [HorariosDeptoView] Despachando fetchHorarios (desde URL): deptoId=${deptoId}, numeroSemana=${numeroSemana}`);
      dispatch(fetchHorarios({ deptoId, numeroSemana }));
      setCurrentDeptoId(deptoId);
      setCurrentNumeroSemana(numeroSemana);
    }
  }, [dispatch, deptoId, numeroSemana]);

  const handleSearch = () => {
    console.log(`➡️ [HorariosDeptoView] Despachando fetchHorarios (desde botón Buscar): deptoId=${currentDeptoId}, numeroSemana=${currentNumeroSemana}`);
    dispatch(fetchHorarios({ deptoId: currentDeptoId, numeroSemana: currentNumeroSemana }));
  };

  // Nombres de los días para la cabecera de la tabla
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  if (status === 'loading') {
    return <p className="status-message">Cargando horarios para el departamento {currentDeptoId}, semana {currentNumeroSemana}...</p>;
  }

  if (status === 'failed') {
    return <p className="status-message error-message">Error al cargar los horarios: {error}</p>;
  }

  return (
    <div className="horarios-container">
      <h1>Consulta de Horarios por Departamento y Semana</h1>

      <div className="search-controls">
        <label htmlFor="deptoId">Departamento ID:</label>
        <input
          type="text"
          id="deptoId"
          value={currentDeptoId}
          onChange={(e) => setCurrentDeptoId(e.target.value)}
          placeholder="Ej: 1"
        />
        <label htmlFor="numeroSemana">Número de Semana:</label>
        <input
          type="text"
          id="numeroSemana"
          value={currentNumeroSemana}
          onChange={(e) => setCurrentNumeroSemana(e.target.value)}
          placeholder="Ej: 23"
        />
        <button onClick={handleSearch}>Buscar</button>
      </div>

      <h2>Horarios del Departamento {currentDeptoId} - Semana {currentNumeroSemana}</h2>

      {horarios.length > 0 ? (
        <table className="horarios-table">
          <thead>
            <tr>
              <th>ID Colaborador</th>
              <th>Activo</th>
              <th>Depto ID</th>
              {diasSemana.map((dia, index) => (
                <th key={index}>{dia}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horarios.map((colaborador) => (
              <tr key={colaborador.idColaborador} onClick={() => handleRowClick(colaborador)}>
                <td>{colaborador.idColaborador}</td>
                <td>{colaborador.activo ? 'Sí' : 'No'}</td>
                <td>{colaborador.deptoId}</td>
                {diasSemana.map((_, index) => (
                  <td key={index}>{colaborador.getHorarioDia(index) || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="status-message">No se encontraron horarios para este departamento y semana.</p>
      )}

      {/* Renderizar la Modal si está abierta */}
      {isModalOpen && (
        <HorarioModal
          colaborador={selectedColaborador}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default HorariosDeptoView;
import Colaborador from '../../../../server/models/Colaborador';
import './styles/HorariosDeptoView.css';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchHorarios } from '../../features/horarios/horariosSlice';
import HorarioModal from './HorarioModal';

const HorariosDeptoView = () => {
  const dispatch = useDispatch();
  const { deptoId, numeroSemana } = useParams();
  const { data: rawHorarios, status, error } = useSelector((state) => state.horarios);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState(null);

  const handleRowClick = (colaborador) => {
    setSelectedColaborador(colaborador);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedColaborador(null);
  };

  useEffect(() => {
    console.groupCollapsed("📊 Estado de HorariosDeptoView (cambio de Redux)");
    console.log("rawHorarios:", rawHorarios);
    console.log("status:", status);
    console.log("error:", error);
    console.groupEnd();
  }, [rawHorarios, status, error]);

  const horarios = rawHorarios.map(item => new Colaborador(item));

  const departments = [
    { id: 1, name: 'Ama de llaves' },
    { id: 2, name: 'Mantenimiento' },
    { id: 3, name: 'Alimentos y Bebidas' },
    { id: 4, name: 'Recepcion' },
    { id: 5, name: 'Administracion' },
    { id: 6, name: 'Ventas' },
    { id: 7, name: 'Recursos Humanos' },
    { id: 8, name: 'Seguridad' },
  ];

  const initialDeptoId = deptoId && departments.some(dep => dep.id === parseInt(deptoId))
    ? parseInt(deptoId)
    : departments[0].id;

  const [currentDeptoId, setCurrentDeptoId] = useState(initialDeptoId);
  const [currentNumeroSemana, setCurrentNumeroSemana] = useState(numeroSemana || '11');

  useEffect(() => {
    if (deptoId && numeroSemana) {
      const parsedDeptoId = parseInt(deptoId);
      if (!isNaN(parsedDeptoId) && departments.some(dep => dep.id === parsedDeptoId)) {
        dispatch(fetchHorarios({ deptoId: parsedDeptoId, numeroSemana }));
        setCurrentDeptoId(parsedDeptoId);
      } else {
        dispatch(fetchHorarios({ deptoId: departments[0].id, numeroSemana }));
        setCurrentDeptoId(departments[0].id);
      }
      setCurrentNumeroSemana(numeroSemana);
    } else {
      dispatch(fetchHorarios({ deptoId: initialDeptoId, numeroSemana: currentNumeroSemana }));
    }
  }, [dispatch, deptoId, numeroSemana]);

  const handleSearch = () => {
    dispatch(fetchHorarios({ deptoId: currentDeptoId, numeroSemana: currentNumeroSemana }));
  };

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
        <label htmlFor="deptoId">Departamento:</label>
        <select
          id="deptoId"
          value={currentDeptoId}
          onChange={(e) => setCurrentDeptoId(parseInt(e.target.value))}
        >
          {departments.map((dep) => (
            <option key={dep.id} value={dep.id}>{dep.name}</option>
          ))}
        </select>

        <label htmlFor="numeroSemana">Número de Semana:</label>
        <input
          type="text"
          id="numeroSemana"
          value={currentNumeroSemana}
          onChange={(e) => {
            const inputValue = e.target.value;
            const numericValue = inputValue.replace(/[^0-9]/g, '');
            const numberToCheck = parseInt(numericValue, 10);

            if (numericValue === "") {
              setCurrentNumeroSemana("");
            } else if (!isNaN(numberToCheck) && numberToCheck >= 1 && numberToCheck <= 52) {
              setCurrentNumeroSemana(numericValue);
            }
          }}
          placeholder="Ej: 23"
        />
        <button onClick={handleSearch}>Buscar</button>
      </div>

      <h2>Horarios del Departamento {departments.find(d => d.id === currentDeptoId)?.name || currentDeptoId} - Semana {currentNumeroSemana}</h2>

      {horarios.length > 0 ? (
        <table className="horarios-table">
          <thead>
            <tr>
              <th>ID Colaborador</th>
              <th>Activo</th>
              {diasSemana.map((dia, index) => (
                <th key={index}>{dia}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horarios.map((colaborador) => (
              <tr key={colaborador.idColaborador} onClick={() => handleRowClick(colaborador)}>
                <td>{colaborador.id}</td>
                <td>{colaborador.activo ? 'Sí' : 'No'}</td>
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

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

  // Lista de departamentos
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

  // Establece el ID del departamento inicial. Si viene de la URL, úsalo, si no, usa el ID del primer departamento.
  const initialDeptoId = deptoId && departments.some(dep => dep.id === parseInt(deptoId))
    ? parseInt(deptoId)
    : departments[0].id; // Establece el primer departamento como predeterminado si no hay uno válido en la URL

  const [currentDeptoId, setCurrentDeptoId] = useState(initialDeptoId);
  const [currentNumeroSemana, setCurrentNumeroSemana] = useState(numeroSemana || '23');

  useEffect(() => {
    // Cuando el componente se monta o los parámetros de la URL cambian
    if (deptoId && numeroSemana) {
      const parsedDeptoId = parseInt(deptoId);
      // Solo despacha si el deptoId de la URL es un número y existe en la lista de departamentos
      if (!isNaN(parsedDeptoId) && departments.some(dep => dep.id === parsedDeptoId)) {
        console.log(`➡️ [HorariosDeptoView] Despachando fetchHorarios (desde URL): deptoId=${parsedDeptoId}, numeroSemana=${numeroSemana}`);
        dispatch(fetchHorarios({ deptoId: parsedDeptoId, numeroSemana }));
        setCurrentDeptoId(parsedDeptoId);
      } else {
        // Si el deptoId de la URL no es válido, usa el departamento predeterminado y despacha
        console.warn(`⚠️ [HorariosDeptoView] deptoId de la URL no válido o no encontrado: ${deptoId}. Usando el predeterminado: ${departments[0].id}`);
        dispatch(fetchHorarios({ deptoId: departments[0].id, numeroSemana: numeroSemana }));
        setCurrentDeptoId(departments[0].id);
      }
      setCurrentNumeroSemana(numeroSemana);
    } else {
      // Si no hay parámetros en la URL, despacha con el departamento predeterminado y semana predeterminada
      console.log(`➡️ [HorariosDeptoView] Despachando fetchHorarios (inicial, sin URL params): deptoId=${initialDeptoId}, numeroSemana=${currentNumeroSemana}`);
      dispatch(fetchHorarios({ deptoId: initialDeptoId, numeroSemana: currentNumeroSemana }));
    }
  }, [dispatch, deptoId, numeroSemana]); // Dependencias para re-ejecutar el efecto

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
        <label htmlFor="deptoId">Departamento:</label>
        <select
          id="deptoId"
          value={currentDeptoId}
          onChange={(e) => setCurrentDeptoId(parseInt(e.target.value))} // Convierte a número
        >
          {departments.map((dep) => (
            <option key={dep.id} value={dep.id}>
              {dep.name}
            </option>
          ))}
        </select>

        <label htmlFor="numeroSemana">Número de Semana:</label>
          <input
          type="text"
          id="numeroSemana"
          value={currentNumeroSemana}
          onChange={(e) => {
            const inputValue = e.target.value;
            // Usamos una expresión regular para permitir solo dígitos
            const numericValue = inputValue.replace(/[^0-9]/g, '');

            // Convertimos a número para la validación, pero lo guardamos como string si es válido
            const numberToCheck = parseInt(numericValue, 10);

            if (numericValue === "") {
              // Permite que el campo esté vacío
              setCurrentNumeroSemana("");
            } else if (!isNaN(numberToCheck) && numberToCheck >= 1 && numberToCheck <= 52) {
              // Si es un número válido en el rango, lo guardamos como string
              setCurrentNumeroSemana(numericValue);
            }
            // Si no es un número válido o está fuera del rango, no actualizamos el estado.
            // Esto significa que el input visualmente no mostrará valores inválidos.
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
              <th>Depto ID</th>
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
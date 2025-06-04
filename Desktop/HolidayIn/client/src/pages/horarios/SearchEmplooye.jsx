// client/src/components/SearchEmplooye.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployeeByNumber, clearSelectedEmployee } from '../../features/employees/employeesSlice'; 

import './styles/SearchEmployee.css'; // Ajusta la ruta si es necesario

function EmployeeSearchComponent({ employeeNumber }) {
  const dispatch = useDispatch();
  const { selectedEmployee, status, error } = useSelector((state) => state.employees); 

  const loading = status === 'loading';


  useEffect(() => {
    if (employeeNumber) {
      console.log(`➡️ EmployeeSearchComponent: Despachando fetchEmployeeByNumber para ID: ${employeeNumber}`);
      dispatch(fetchEmployeeByNumber(employeeNumber));
    } else {
      console.log(`⚠️ EmployeeSearchComponent: employeeNumber es nulo o vacío. Limpiando estado.`);
      dispatch(clearSelectedEmployee());
    }
    return () => {
    //   console.log(`🧹 EmployeeSearchComponent: Función de limpieza del useEffect para ID: ${employeeNumber}`);
      dispatch(clearSelectedEmployee()); 
    };
  }, [employeeNumber, dispatch]);

  // Si no se proporcionó un número de empleado, no renderizamos nada o mostramos un mensaje
  // Usamos la nueva clase CSS aquí
  if (!employeeNumber) {
    return <div className="employee-search-missing-id">Falta número de empleado.</div>;
  }

  // Renderizado basado en los estados de Redux
  if (loading) {
    // Usamos la nueva clase CSS aquí
    return <div className="employee-search-loading-message">Cargando datos del empleado...</div>;
  }

  if (error) {
    // Usamos la nueva clase CSS aquí
    return (
      <div className="employee-search-error-message">
        <p><strong>Error al cargar empleado:</strong> {error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))}</p>
      </div>
    );
  }

  if (selectedEmployee) {
    // Usamos la nueva clase CSS aquí
    return (
      <div className="employee-search-info">
        <p><strong>Nombre:</strong> {selectedEmployee.name}</p>
        <p><strong>Puesto:</strong> {selectedEmployee.puesto}</p>
      </div>
    );
  }

  // Si no hay empleado, no está cargando, y no hay error, significa que no se encontró
  // Usamos la nueva clase CSS aquí
  return <div className="employee-search-no-employee-message">Empleado no encontrado.</div>;
}

// Eliminamos el objeto 'styles' porque ahora usamos clases CSS
// const styles = { ... }; 

export default EmployeeSearchComponent;
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  fetchEmployeeByNumber,
  clearSelectedEmployee // Si la tienes definida en el slice
} from '../../features/employees/employeesSlice';
import './styles/employees.css'; // Opcional: para estilos específicos del componente

function EmployeesManagement() {
  const dispatch = useDispatch();
  const employees = useSelector((state) => state.employees.employees);
  const selectedEmployee = useSelector((state) => state.employees.selectedEmployee);
  const status = useSelector((state) => state.employees.status);
  const error = useSelector((state) => state.employees.error);

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    employee_number: '',
    name: '',
    role_id: '',
    department_id: '',
    puesto: '',
    hire_date: '',
    status: 'activo'
  });

  // Efecto para cargar los empleados cuando el componente se monta o el estado cambia a 'idle'
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchEmployees());
    }
  }, [status, dispatch]);

  // Manejador para el cambio de los inputs del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejador para enviar el formulario de creación/actualización
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAdding) {
      await dispatch(createEmployee(formData));
    } else if (isEditing) {
      await dispatch(updateEmployee({
        employeeNumber: formData.employee_number,
        employeeData: {
          name: formData.name,
          role_id: parseInt(formData.role_id), // Asegúrate de convertir a número si es necesario
          department_id: parseInt(formData.department_id), // Asegúrate de convertir a número si es necesario
          puesto: formData.puesto,
          hire_date: formData.hire_date,
          status: formData.status
        }
      }));
    }
    // Después de crear/actualizar, reinicia el estado del formulario y recarga la lista
    setFormData({
      employee_number: '', name: '', role_id: '', department_id: '', puesto: '', hire_date: '', status: 'activo'
    });
    setIsAdding(false);
    setIsEditing(false);
    dispatch(fetchEmployees()); // Para asegurarse de que la lista se actualice
  };

  // Manejador para el botón de editar
  const handleEditClick = (employee) => {
    setIsEditing(true);
    setIsAdding(false); // Asegúrate de que no estemos en modo "añadir"
    setFormData({
      employee_number: employee.employee_number,
      name: employee.name,
      role_id: employee.role_id,
      department_id: employee.department_id,
      puesto: employee.puesto,
      hire_date: employee.hire_date.split('T')[0], // Ajusta para el input type="date" si viene de la DB con timestamp
      status: employee.status
    });
    // Limpiar el empleado seleccionado en el estado de Redux si existe
    if (selectedEmployee) {
        dispatch(clearSelectedEmployee());
    }
  };

  // Manejador para el botón de eliminar
  const handleDeleteClick = async (employeeNumber) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar al empleado ${employeeNumber}?`)) {
      await dispatch(deleteEmployee(employeeNumber));
      dispatch(fetchEmployees()); // Recargar la lista después de eliminar
    }
  };

  // Manejador para el botón de ver detalles
  const handleViewDetails = (employeeNumber) => {
    dispatch(fetchEmployeeByNumber(employeeNumber));
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setIsEditing(false);
    setFormData({
      employee_number: '', name: '', role_id: '', department_id: '', puesto: '', hire_date: '', status: 'activo'
    });
    dispatch(clearSelectedEmployee());
  };

  // Renderizado condicional basado en el estado de la petición
  if (status === 'loading' && employees.length === 0) {
    return <div className="loading-message">Cargando empleados...</div>;
  }

  if (status === 'failed') {
    return <div className="error-message">Error: {error || 'No se pudo cargar la lista de empleados.'}</div>;
  }

  return (
    <div className="employees-management-container">
      <h1>Gestión de Empleados</h1>

      <button onClick={() => { setIsAdding(true); setIsEditing(false); handleCancelForm(); }} className="add-employee-button">
        Agregar Nuevo Empleado
      </button>

      {(isAdding || isEditing) && (
        <div className="employee-form-card">
          <h2>{isAdding ? 'Agregar Empleado' : `Editar Empleado: ${formData.employee_number}`}</h2>
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-group">
              <label htmlFor="employee_number">Número de Empleado:</label>
              <input
                type="text"
                id="employee_number"
                name="employee_number"
                value={formData.employee_number}
                onChange={handleInputChange}
                required
                disabled={isEditing} // No permitir cambiar el número de empleado al editar
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">Nombre:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="role_id">ID de Rol:</label>
              <input
                type="number"
                id="role_id"
                name="role_id"
                value={formData.role_id}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="department_id">ID de Departamento:</label>
              <input
                type="number"
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="puesto">Puesto:</label>
              <input
                type="text"
                id="puesto"
                name="puesto"
                value={formData.puesto}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="hire_date">Fecha de Contratación:</label>
              <input
                type="date"
                id="hire_date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Estado:</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="licencia">Licencia</option>
                <option value="terminado">Terminado</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button">
                {isAdding ? 'Crear Empleado' : 'Guardar Cambios'}
              </button>
              <button type="button" onClick={handleCancelForm} className="cancel-button">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedEmployee && (
        <div className="employee-details-card">
          <h2>Detalles del Empleado</h2>
          <p><strong>Número:</strong> {selectedEmployee.employee_number}</p>
          <p><strong>Nombre:</strong> {selectedEmployee.name}</p>
          <p><strong>Rol ID:</strong> {selectedEmployee.role_id}</p>
          <p><strong>Departamento ID:</strong> {selectedEmployee.department_id}</p>
          <p><strong>Puesto:</strong> {selectedEmployee.puesto}</p>
          <p><strong>Contratación:</strong> {new Date(selectedEmployee.hire_date).toLocaleDateString()}</p>
          <p><strong>Estado:</strong> {selectedEmployee.status}</p>
          <p><strong>Activo:</strong> {selectedEmployee.activo}</p>
          <p><strong>Fecha de Creación:</strong> {new Date(selectedEmployee.fh_cre).toLocaleString()}</p>
          {selectedEmployee.fh_act && <p><strong>Última Actualización:</strong> {new Date(selectedEmployee.fh_act).toLocaleString()}</p>}
          {selectedEmployee.fechaBaja && <p><strong>Fecha de Baja:</strong> {new Date(selectedEmployee.fechaBaja).toLocaleString()}</p>}
          <button onClick={() => dispatch(clearSelectedEmployee())} className="close-details-button">Cerrar Detalles</button>
        </div>
      )}

      <div classNameame="employee-list">
        <h2>Lista de Empleados</h2>
        {employees.length === 0 ? (
          <p>No hay empleados registrados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Departamento ID</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.employee_number}>
                  <td>{employee.employee_number}</td>
                  <td>{employee.name}</td>
                  <td>{employee.puesto}</td>
                  <td>{employee.department_id}</td>
                  <td>{employee.status}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleViewDetails(employee.employee_number)} className="action-button view">Ver</button>
                    <button onClick={() => handleEditClick(employee)} className="action-button edit">Editar</button>
                    <button onClick={() => handleDeleteClick(employee.employee_number)} className="action-button delete">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default EmployeesManagement;
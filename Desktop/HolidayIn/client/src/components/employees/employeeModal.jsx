import React from 'react';
import './styles/EmployeeModal.css'; // Estilos específicos para el modal

function EmployeeModal({
  isOpen,
  onClose,
  employee,
  isEditing,
  onEditToggle,
  onCancelEdit,
  formData,
  onInputChange,
  onSubmit,
  isNewEmployee // Flag para saber si es un nuevo empleado en el modal
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {isNewEmployee ? 'Agregar Nuevo Empleado' : (isEditing ? `Editar Empleado: ${formData.name || (employee ? employee.name : '')}` : `Detalles del Empleado: ${employee ? employee.name : ''}`)}
          </h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {isEditing ? (
            // Formulario de edición/creación
            <form onSubmit={onSubmit} className="employee-modal-form">
              <div className="form-group">
                <label htmlFor="employee_number">Número de Empleado:</label>
                <input
                  type="text"
                  id="employee_number"
                  name="employee_number"
                  value={formData.employee_number}
                  onChange={onInputChange}
                  required
                  disabled={!isNewEmployee} // Deshabilita al editar, habilita si es nuevo
                />
              </div>
              <div className="form-group">
                <label htmlFor="name">Nombre:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={onInputChange}
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
                  onChange={onInputChange}
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
                  onChange={onInputChange}
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
                  onChange={onInputChange}
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
                  onChange={onInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Estado:</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={onInputChange}
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
                  {isNewEmployee ? 'Crear Empleado' : 'Guardar Cambios'}
                </button>
                <button type="button" onClick={onCancelEdit} className="cancel-button">
                  {isNewEmployee ? 'Cancelar' : 'Volver a Detalles'}
                </button>
              </div>
            </form>
          ) : (
            // Vista de detalles del empleado
            employee ? (
              <div className="employee-details-content">
                <p><strong>Número:</strong> {employee.employee_number}</p>
                <p><strong>Nombre:</strong> {employee.name}</p>
                <p><strong>Rol ID:</strong> {employee.role_id}</p>
                <p><strong>Departamento ID:</strong> {employee.department_id}</p>
                <p><strong>Puesto:</strong> {employee.puesto}</p>
                <p><strong>Contratación:</strong> {new Date(employee.hire_date).toLocaleDateString()}</p>
                <p><strong>Estado:</strong> <span className={`status-badge status-${employee.status}`}>{employee.status}</span></p>
                <p><strong>Activo (flag):</strong> {employee.activo ? 'Sí' : 'No'}</p>
                <p><strong>Fecha de Creación:</strong> {new Date(employee.fh_cre).toLocaleString()}</p>
                {employee.fh_act && <p><strong>Última Actualización:</strong> {new Date(employee.fh_act).toLocaleString()}</p>}
                {employee.fechaBaja && <p><strong>Fecha de Baja:</strong> {new Date(employee.fechaBaja).toLocaleString()}</p>}
                <div className="modal-actions">
                  <button onClick={onEditToggle} className="action-button edit">Editar</button>
                </div>
              </div>
            ) : (
              <p>Cargando detalles del empleado...</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeModal;
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

  // Helper function to get department name
  const getDepartmentName = (departmentId) => {
    const departments = {
      1: 'Ama de llaves',
      2: 'Mantenimiento', 
      3: 'Alimentos y Bebidas',
      4: 'Recepcion',
      5: 'Administracion',
      6: 'Ventas',
      7: 'Recursos Humanos',
      8: 'Seguridad',
      9: 'Configuracion'
    };
    return departments[departmentId] || `Departamento ${departmentId}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-info">
            <div className="modal-icon">
              {isNewEmployee ? '👤➕' : (isEditing ? '✏️' : '👤')}
            </div>
            <div className="header-text">
              <h2>
                {isNewEmployee ? 'Agregar Nuevo Empleado' : (isEditing ? 'Editar Empleado' : 'Detalles del Empleado')}
              </h2>
              {!isNewEmployee && employee && (
                <p className="employee-subtitle">{employee.name} - #{employee.employee_number}</p>
              )}
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <span className="close-icon">✕</span>
          </button>
        </div>

        <div className="modal-body">
          {isEditing ? (
            // Formulario de edición/creación
            <div className="form-container">
              <form onSubmit={onSubmit} className="employee-modal-form">
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-icon">📋</span>
                    Información Básica
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="employee_number">
                        <span className="label-icon">🔢</span>
                        Número de Empleado
                      </label>
                      <input
                        type="text"
                        id="employee_number"
                        name="employee_number"
                        value={formData.employee_number}
                        onChange={onInputChange}
                        required
                        disabled={!isNewEmployee}
                        className={!isNewEmployee ? 'disabled' : ''}
                        placeholder="Ej: EMP001"
                      />
                      {!isNewEmployee && (
                        <small className="field-note">El número de empleado no se puede modificar</small>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="name">
                        <span className="label-icon">👤</span>
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={onInputChange}
                        required
                        placeholder="Nombre completo del empleado"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-icon">💼</span>
                    Información Laboral
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="puesto">
                        <span className="label-icon">🎯</span>
                        Puesto
                      </label>
                      <input
                        type="text"
                        id="puesto"
                        name="puesto"
                        value={formData.puesto}
                        onChange={onInputChange}
                        required
                        placeholder="Cargo o posición"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="department_id">
                        <span className="label-icon">🏢</span>
                        Departamento
                      </label>
                      <select
                        id="department_id"
                        name="department_id"
                        value={formData.department_id}
                        onChange={onInputChange}
                        required
                      >
                        <option value="">Seleccionar departamento</option>
                        <option value="1">Ama de llaves</option>
                        <option value="2">Mantenimiento</option>
                        <option value="3">Alimentos y Bebidas</option>
                        <option value="4">Recepcion</option>
                        <option value="5">Administracion</option>
                        <option value="6">Ventas</option>
                        <option value="7">Recursos Humanos</option>
                        <option value="8">Seguridad</option>
                        <option value="9">Configuracion</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="role_id">
                        <span className="label-icon">🎭</span>
                        ID de Rol
                      </label>
                      <input
                        type="number"
                        id="role_id"
                        name="role_id"
                        value={formData.role_id}
                        onChange={onInputChange}
                        required
                        placeholder="ID del rol"
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="hire_date">
                        <span className="label-icon">📅</span>
                        Fecha de Contratación
                      </label>
                      <input
                        type="date"
                        id="hire_date"
                        name="hire_date"
                        value={formData.hire_date}
                        onChange={onInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-icon">📊</span>
                    Estado
                  </h3>
                  <div className="form-group">
                    <label htmlFor="status">
                      <span className="label-icon">🔄</span>
                      Estado del Empleado
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={onInputChange}
                      required
                      className="status-select"
                    >
                      <option value="activo">✅ Activo</option>
                      <option value="inactivo">❌ Inactivo</option>
                      <option value="licencia">🏥 Licencia</option>
                      <option value="terminado">🚪 Terminado</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    <span className="button-icon">
                      {isNewEmployee ? '➕' : '💾'}
                    </span>
                    {isNewEmployee ? 'Crear Empleado' : 'Guardar Cambios'}
                  </button>
                  <button type="button" onClick={onCancelEdit} className="cancel-button">
                    <span className="button-icon">❌</span>
                    {isNewEmployee ? 'Cancelar' : 'Volver a Detalles'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Vista de detalles del empleado
            employee ? (
              <div className="employee-details-content">
                <div className="employee-header">
                  <div className="employee-avatar">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="employee-basic-info">
                    <h3>{employee.name}</h3>
                    <p className="employee-id">Empleado #{employee.employee_number}</p>
                    <span className={`status-badge status-${employee.status}`}>
                      <span className="status-indicator"></span>
                      {employee.status}
                    </span>
                  </div>
                </div>

                <div className="details-grid">
                  <div className="detail-section">
                    <h4>
                      <span className="section-icon">💼</span>
                      Información Laboral
                    </h4>
                    <div className="detail-item">
                      <span className="detail-label">
                        <span className="detail-icon">🎯</span>
                        Puesto:
                      </span>
                      <span className="detail-value">{employee.puesto}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <span className="detail-icon">🏢</span>
                        Departamento:
                      </span>
                      <span className="detail-value department-badge">
                        {getDepartmentName(employee.department_id)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <span className="detail-icon">🎭</span>
                        Rol ID:
                      </span>
                      <span className="detail-value">{employee.role_id}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>
                      <span className="section-icon">📅</span>
                      Fechas Importantes
                    </h4>
                    <div className="detail-item">
                      <span className="detail-label">
                        <span className="detail-icon">🎉</span>
                        Contratación:
                      </span>
                      <span className="detail-value">{new Date(employee.hire_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <span className="detail-icon">📝</span>
                        Creación:
                      </span>
                      <span className="detail-value">{new Date(employee.fh_cre).toLocaleString()}</span>
                    </div>
                    {employee.fh_act && (
                      <div className="detail-item">
                        <span className="detail-label">
                          <span className="detail-icon">🔄</span>
                          Última Actualización:
                        </span>
                        <span className="detail-value">{new Date(employee.fh_act).toLocaleString()}</span>
                      </div>
                    )}
                    {employee.fechaBaja && (
                      <div className="detail-item">
                        <span className="detail-label">
                          <span className="detail-icon">🚪</span>
                          Fecha de Baja:
                        </span>
                        <span className="detail-value warning">{new Date(employee.fechaBaja).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <h4>
                      <span className="section-icon">📊</span>
                      Estado del Sistema
                    </h4>
                    <div className="detail-item">
                      <span className="detail-label">
                        <span className="detail-icon">⚡</span>
                        Activo (flag):
                      </span>
                      <span className={`detail-value ${employee.activo ? 'active' : 'inactive'}`}>
                        {employee.activo ? '✅ Sí' : '❌ No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button onClick={onEditToggle} className="action-button edit">
                    <span className="button-icon">✏️</span>
                    Editar Empleado
                  </button>
                </div>
              </div>
            ) : (
              <div className="loading-state">
                <div className="loading-spinner">
                  <div className="spinner-circle"></div>
                </div>
                <p>Cargando detalles del empleado...</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeModal;
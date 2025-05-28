// EmployeesManagement.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  fetchEmployeeByNumber,
  clearSelectedEmployee,
  deleteEmployee
} from '../../features/employees/employeesSlice';
import EmployeeModal from './EmployeeModal';
import './styles/employees.css';

function EmployeesManagement() {
  const dispatch = useDispatch();
  const employees = useSelector((state) => state.employees.employees);
  const selectedEmployee = useSelector((state) => state.employees.selectedEmployee);
  const status = useSelector((state) => state.employees.status);
  const error = useSelector((state) => state.employees.error);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_number: '',
    name: '',
    role_id: '',
    department_id: '',
    puesto: '',
    hire_date: '',
    status: 'activo'
  });

  const [filterDepartmentId, setFilterDepartmentId] = useState('all');

  const departments = [
    { id: 1, name: 'Ama de llaves' },
    { id: 2, name: 'Mantenimiento' },
    { id: 3, name: 'Alimentos y Bebidas' },
    { id: 4, name: 'Recepcion' },
    { id: 5, name: 'Administracion' },
    { id: 6, name: 'Ventas' },
    { id: 7, name: 'Recursos Humanos' },
    { id: 8, name: 'Seguridad' },
    { id: 9, name: 'Configuracion' },
  ];

  useEffect(() => {
    dispatch(fetchEmployees({ departmentId: filterDepartmentId }));
  }, [dispatch, filterDepartmentId]);

  useEffect(() => {
    if (selectedEmployee) {
      setIsModalOpen(true);
      if (isEditingInModal) {
        setFormData({
          employee_number: selectedEmployee.employee_number,
          name: selectedEmployee.name,
          role_id: selectedEmployee.role_id,
          department_id: selectedEmployee.department_id,
          puesto: selectedEmployee.puesto,
          hire_date: selectedEmployee.hire_date ? selectedEmployee.hire_date.split('T')[0] : '',
          status: selectedEmployee.status
        });
      }
    } else if (!isEditingInModal) {
      setIsModalOpen(false);
      setIsEditingInModal(false);
      setFormData({
        employee_number: '', name: '', role_id: '', department_id: '', puesto: '', hire_date: '', status: 'activo'
      });
    }
  }, [selectedEmployee, isEditingInModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      role_id: parseInt(formData.role_id, 10),
      department_id: parseInt(formData.department_id, 10)
    };

    if (!formData.employee_number) {
      await dispatch(createEmployee(dataToSend));
    } else {
      await dispatch(updateEmployee({
        employeeNumber: dataToSend.employee_number,
        employeeData: dataToSend
      }));
    }
    handleCloseModal();
    dispatch(fetchEmployees({ departmentId: filterDepartmentId }));
  };

  const handleRowClick = (employeeNumber) => {
    setIsEditingInModal(false);
    dispatch(fetchEmployeeByNumber(employeeNumber));
  };

  const handleAddNewEmployeeClick = () => {
    dispatch(clearSelectedEmployee());
    setIsEditingInModal(true);
    setFormData({
      employee_number: '', name: '', role_id: '', department_id: '', puesto: '', hire_date: '', status: 'activo'
    });
    setIsModalOpen(true);
  };

  const handleEditFromModal = () => {
    setIsEditingInModal(true);
  };

  const handleCancelEdit = () => {
    setIsEditingInModal(false);
    if (selectedEmployee) {
      setFormData({
        employee_number: selectedEmployee.employee_number,
        name: selectedEmployee.name,
        role_id: selectedEmployee.role_id,
        department_id: selectedEmployee.department_id,
        puesto: selectedEmployee.puesto,
        hire_date: selectedEmployee.hire_date ? selectedEmployee.hire_date.split('T')[0] : '',
        status: selectedEmployee.status
      });
    } else {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditingInModal(false);
    dispatch(clearSelectedEmployee());
    setFormData({
      employee_number: '', name: '', role_id: '', department_id: '', puesto: '', hire_date: '', status: 'activo'
    });
  };

  const handleFilterChange = (e) => {
    setFilterDepartmentId(e.target.value);
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : `Departamento ${departmentId}`;
  };

  if (status === 'loading' && employees.length === 0) {
    return (
      <div className="employees-management-container">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
          <p>Cargando empleados...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="employees-management-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error al cargar empleados</h2>
          <p>{error || 'No se pudo cargar la lista de empleados.'}</p>
          <button 
            onClick={() => dispatch(fetchEmployees({ departmentId: filterDepartmentId }))}
            className="retry-button"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="employees-management-container">
      <div className="page-header">
        <div className="header-content">
          <h1>
            <span className="header-icon">👥</span>
            Gestión de Empleados
          </h1>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-number">{employees.length}</div>
              <div className="stat-label">Empleados</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {employees.filter(emp => emp.status === 'activo').length}
              </div>
              <div className="stat-label">Activos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="controls-card">
          <div className="controls-row">
            <div className="filter-group">
              <label htmlFor="departmentFilter">
                <span className="filter-icon">🏢</span>
                Filtrar por Departamento:
              </label>
              <select
                id="departmentFilter"
                value={filterDepartmentId}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">📋 Todos los departamentos</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleAddNewEmployeeClick} 
              className="add-employee-button"
            >
              <span className="button-icon">➕</span>
              Agregar Nuevo Empleado
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EmployeeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          employee={selectedEmployee}
          isEditing={isEditingInModal}
          onEditToggle={handleEditFromModal}
          onCancelEdit={handleCancelEdit}
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          isNewEmployee={!selectedEmployee && isEditingInModal}
        />
      )}

      <div className="employee-list-section">
        <div className="list-header">
          <h2>
            <span className="list-icon">📊</span>
            Lista de Empleados
          </h2>
          {filterDepartmentId !== 'all' && (
            <div className="filter-badge">
              Filtrado: {getDepartmentName(parseInt(filterDepartmentId))}
            </div>
          )}
        </div>
        
        {employees.length === 0 && status !== 'loading' ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No hay empleados registrados</h3>
            <p>
              {filterDepartmentId === 'all' 
                ? 'Aún no se han registrado empleados en el sistema.'
                : `No hay empleados registrados en el departamento seleccionado.`
              }
            </p>
            <button 
              onClick={handleAddNewEmployeeClick}
              className="empty-state-button"
            >
              Agregar primer empleado
            </button>
          </div>
        ) : (
          <div className="table-container">
            <div className="table-wrapper">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th>
                      <span className="header-icon">🔢</span>
                      Número
                    </th>
                    <th>
                      <span className="header-icon">👤</span>
                      Nombre
                    </th>
                    <th>
                      <span className="header-icon">💼</span>
                      Puesto
                    </th>
                    <th>
                      <span className="header-icon">🏢</span>
                      Departamento
                    </th>
                    <th>
                      <span className="header-icon">📈</span>
                      Estado
                    </th>
                    <th>
                      <span className="header-icon">⚡</span>
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr 
                      key={employee.employee_number} 
                      onClick={() => handleRowClick(employee.employee_number)} 
                      className="employee-row"
                    >
                      <td className="employee-number">
                        <span className="number-badge">
                          {employee.employee_number}
                        </span>
                      </td>
                      <td className="employee-name">
                        <div className="name-cell">
                          <div className="avatar">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{employee.name}</span>
                        </div>
                      </td>
                      <td className="employee-position">
                        {employee.puesto}
                      </td>
                      <td className="employee-department">
                        <span className="department-badge">
                          {getDepartmentName(employee.department_id)}
                        </span>
                      </td>
                      <td className="employee-status">
                        <span className={`status-badge status-${employee.status}`}>
                          <span className="status-indicator"></span>
                          {employee.status}
                        </span>
                      </td>
                      <td className="employee-actions">
                        <div className="action-hint">
                          <span className="action-icon">👁️</span>
                          Ver detalles
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="table-footer">
              <div className="results-summary">
                Mostrando {employees.length} empleado{employees.length !== 1 ? 's' : ''}
                {filterDepartmentId !== 'all' && 
                  ` en ${getDepartmentName(parseInt(filterDepartmentId))}`
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeesManagement;
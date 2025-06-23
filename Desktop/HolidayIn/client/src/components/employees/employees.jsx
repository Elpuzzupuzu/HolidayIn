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
      {/* Header compacto */}
      <div className="compact-header">
        <div className="header-left">
          <h1>👥 Gestión de Empleados</h1>
          <div className="header-stats">
            <span className="stat-item">
              <strong>{employees.length}</strong> Total
            </span>
            <span className="stat-item">
              <strong>{employees.filter(emp => emp.status === 'activo').length}</strong> Activos
            </span>
            {filterDepartmentId !== 'all' && (
              <span className="filter-indicator">
                📋 {getDepartmentName(parseInt(filterDepartmentId))}
              </span>
            )}
          </div>
        </div>
        
        <div className="header-controls">
          <select
            value={filterDepartmentId}
            onChange={handleFilterChange}
            className="compact-filter-select"
          >
            <option value="all">Todos los departamentos</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleAddNewEmployeeClick}
            className="compact-add-button"
          >
            ➕ Nuevo Empleado
          </button>
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

      {/* Tabla predominante */}
      <div className="main-table-section">
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
          <div className="main-table-container">
            <table className="main-employees-table">
              <thead>
                <tr>
                  <th className="col-number">Número</th>
                  <th className="col-name">Nombre</th>
                  <th className="col-position">Puesto</th>
                  <th className="col-department">Departamento</th>
                  <th className="col-status">Estado</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.employee_number}
                    onClick={() => handleRowClick(employee.employee_number)}
                    className="main-employee-row"
                  >
                    <td className="col-number">
                      <span className="employee-number-badge">
                        {employee.employee_number}
                      </span>
                    </td>
                    <td className="col-name">
                      <span className="employee-name-text">
                        {employee.name}
                      </span>
                    </td>
                    <td className="col-position">
                      {employee.puesto}
                    </td>
                    <td className="col-department">
                      <span className="department-tag">
                        {getDepartmentName(employee.department_id)}
                      </span>
                    </td>
                    <td className="col-status">
                      <span className={`status-indicator status-${employee.status}`}>
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-summary">
              <span className="summary-text">
                {employees.length} empleado{employees.length !== 1 ? 's' : ''}
                {filterDepartmentId !== 'all' &&
                  ` en ${getDepartmentName(parseInt(filterDepartmentId))}`
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeesManagement;
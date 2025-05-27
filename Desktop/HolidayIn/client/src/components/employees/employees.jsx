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

  if (status === 'loading' && employees.length === 0) {
    return <div className="loading-message">Cargando empleados...</div>;
  }

  if (status === 'failed') {
    return <div className="error-message">Error: {error || 'No se pudo cargar la lista de empleados.'}</div>;
  }

  return (
    <div className="employees-management-container">
      <h1>Gestión de Empleados</h1>

      <div className="controls-row">
        {/* FILTRO DE DEPARTAMENTO AHORA VA PRIMERO */}
        <div className="filter-group">
          <label htmlFor="departmentFilter">Filtrar por Departamento:</label>
          <select
            id="departmentFilter"
            value={filterDepartmentId}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">Todos</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* BOTÓN AGREGAR EMPLEADO AHORA VA SEGUNDO */}
        <button onClick={handleAddNewEmployeeClick} className="add-employee-button">
          Agregar Nuevo Empleado
        </button>
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

      <div className="employee-list">
        <h2>Lista de Empleados</h2>
        {employees.length === 0 && status !== 'loading' ? (
          <p>No hay empleados registrados para este filtro.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Departamento ID</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.employee_number} onClick={() => handleRowClick(employee.employee_number)} className="clickable-row">
                  <td>{employee.employee_number}</td>
                  <td>{employee.name}</td>
                  <td>{employee.puesto}</td>
                  <td>{employee.department_id}</td>
                  <td><span className={`status-badge status-${employee.status}`}>{employee.status}</span></td>
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
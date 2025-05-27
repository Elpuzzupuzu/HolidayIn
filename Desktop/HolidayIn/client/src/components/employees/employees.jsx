// EmployeesManagement.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  fetchEmployeeByNumber,
  clearSelectedEmployee
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

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchEmployees());
    }
  }, [status, dispatch]);

  // AJUSTE CLAVE AQUÍ:
  useEffect(() => {
    // Este bloque se encarga de abrir el modal y precargar datos cuando un empleado es seleccionado
    if (selectedEmployee) {
      setIsModalOpen(true);
      if (isEditingInModal) { // Si ya estamos en modo edición (ej. desde el botón "Agregar" previamente)
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
    }
    // ESTE ES EL CAMBIO: Solo cierra el modal si selectedEmployee es null Y NO estamos en modo de "Agregar Nuevo Empleado"
    // (es decir, si isEditingInModal es false, lo que implica que es un cierre normal o un "ver detalles" sin selección).
    else if (!isEditingInModal) {
      setIsModalOpen(false);
      setIsEditingInModal(false); // Reset editing state
      setFormData({ // Clear form data
        employee_number: '', name: '', role_id: '', department_id: '', puesto: '', hire_date: '', status: 'activo'
      });
    }
  }, [selectedEmployee, isEditingInModal]); // Las dependencias son correctas

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      role_id: parseInt(formData.role_id),
      department_id: parseInt(formData.department_id)
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
    dispatch(fetchEmployees());
  };

  const handleRowClick = (employeeNumber) => {
    setIsEditingInModal(false); // Abre el modal en modo "ver"
    dispatch(fetchEmployeeByNumber(employeeNumber)); // Carga el empleado seleccionado
  };

  const handleAddNewEmployeeClick = () => {
    dispatch(clearSelectedEmployee()); // Limpia el empleado seleccionado en Redux (selectedEmployee = null)
    setIsEditingInModal(true); // Establece el modo a edición/creación
    setFormData({ // Resetea el formulario para una nueva entrada
      employee_number: '', name: '', role_id: '', department_id: '', puesto: '', hire_date: '', status: 'activo'
    });
    setIsModalOpen(true); // Abre el modal explícitamente
  };

  const handleEditFromModal = () => {
    setIsEditingInModal(true);
  };

  const handleCancelEdit = () => {
    setIsEditingInModal(false);
    if (selectedEmployee) { // Si hay un empleado seleccionado, vuelve a la vista de detalles
      setFormData({
        employee_number: selectedEmployee.employee_number,
        name: selectedEmployee.name,
        role_id: selectedEmployee.role_id,
        department_id: selectedEmployee.department_id,
        puesto: selectedEmployee.puesto,
        hire_date: selectedEmployee.hire_date ? selectedEmployee.hire_date.split('T')[0] : '',
        status: selectedEmployee.status
      });
    } else { // Si no hay selectedEmployee (estábamos añadiendo uno nuevo), cierra el modal completamente
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditingInModal(false);
    dispatch(clearSelectedEmployee()); // Limpia el estado de Redux al cerrar
    setFormData({ // Limpia el formulario
      employee_number: '', name: '', role_id: '', department_id: '', puesto: '', hire_date: '', status: 'activo'
    });
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

      <button onClick={handleAddNewEmployeeClick} className="add-employee-button">
        Agregar Nuevo Empleado
      </button>

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
          // isNewEmployee será true si selectedEmployee es null Y estamos en modo edición
          isNewEmployee={!selectedEmployee && isEditingInModal}
        />
      )}

      <div className="employee-list">
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
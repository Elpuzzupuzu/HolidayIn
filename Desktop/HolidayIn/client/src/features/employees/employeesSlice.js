// client/src/features/employees/employeesSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Definimos la URL base de tu API
const API_URL = "http://localhost:3000/api";

// --- Thunks Asíncronos ---

/**
 * Thunk para obtener todos los empleados.
 * Ahora acepta un objeto 'filter' para permitir filtros como departmentId.
 * @param {object} filter - Objeto con los parámetros de filtro (ej: { departmentId: '1' }).
 */
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (filter = {}, { rejectWithValue }) => { // Modificado para aceptar 'filter'
    try {
      let url = `${API_URL}/employees/getall`; // Ruta base
      const params = new URLSearchParams(); // Para construir los query parameters

      // Si hay un departmentId en el filtro y no es 'all', lo añadimos a los parámetros
      if (filter.departmentId && filter.departmentId !== 'all') {
        params.append('departmentId', filter.departmentId);
      }

      // Si hay parámetros, los adjuntamos a la URL
      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Thunk para crear un nuevo empleado.
 */
export const createEmployee = createAsyncThunk(
  'employees/createEmployee',
  async (employeeData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/employees/add`, employeeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Thunk para obtener un empleado por su employee_number.
 */
export const fetchEmployeeByNumber = createAsyncThunk(
  'employees/fetchEmployeeByNumber',
  async (employeeNumber, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/employees/getByEmployeeNumber/${employeeNumber}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Thunk para actualizar un empleado existente.
 */
export const updateEmployee = createAsyncThunk(
  'employees/updateEmployee',
  async ({ employeeNumber, employeeData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/employees/update/${employeeNumber}`, employeeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Thunk para eliminar un empleado.
 */
export const deleteEmployee = createAsyncThunk(
  'employees/deleteEmployee',
  async (employeeNumber, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/employees/delete/${employeeNumber}`);
      return employeeNumber;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// --- Slice de Empleados ---
const employeesSlice = createSlice({
  name: 'employees',
  initialState: {
    employees: [], // Lista de todos los empleados
    selectedEmployee: null, // El empleado seleccionado o cargado por ID
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null, // Cualquier error ocurrido
  },
  reducers: {
    // Acción para limpiar el empleado actualmente seleccionado
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
      state.status = 'idle'; // Resetear el estado también para consistencia
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Reducers para fetchEmployees
      .addCase(fetchEmployees.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch employees';
      })
      // Reducers para createEmployee
      .addCase(createEmployee.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // No mutamos `state.employees` directamente aquí, se espera un refetch en el componente
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create employee';
      })
      // Reducers para fetchEmployeeByNumber
      .addCase(fetchEmployeeByNumber.pending, (state) => {
        state.status = 'loading';
        state.selectedEmployee = null; // Limpiar cualquier empleado anterior
        state.error = null; // Limpiar errores anteriores
      })
      .addCase(fetchEmployeeByNumber.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedEmployee = action.payload;
      })
      .addCase(fetchEmployeeByNumber.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch employee by number';
        state.selectedEmployee = null; // Asegurarse de que no haya un empleado parcial o incorrecto
      })
      // Reducers para updateEmployee
      .addCase(updateEmployee.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Si el empleado actualizado es el que está seleccionado, actualiza sus datos localmente
        if (state.selectedEmployee && state.selectedEmployee.employee_number === action.meta.arg.employeeNumber) {
            state.selectedEmployee = { ...state.selectedEmployee, ...action.meta.arg.employeeData };
        }
        // También puedes buscar y actualizarlo en `state.employees` si es necesario:
        const index = state.employees.findIndex(emp => emp.employee_number === action.meta.arg.employeeNumber);
        if (index !== -1) {
            state.employees[index] = { ...state.employees[index], ...action.meta.arg.employeeData };
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update employee';
      })
      // Reducers para deleteEmployee
      .addCase(deleteEmployee.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Filtra el empleado eliminado de la lista
        state.employees = state.employees.filter(emp => emp.employee_number !== action.payload);
        // Si el empleado eliminado era el seleccionado, límpialo
        if (state.selectedEmployee && state.selectedEmployee.employee_number === action.payload) {
          state.selectedEmployee = null;
        }
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to delete employee';
      });
  },
});

// Exporta la acción generada por el reductor `clearSelectedEmployee`
export const { clearSelectedEmployee } = employeesSlice.actions;

// Exporta el reductor principal del slice
export default employeesSlice.reducer;
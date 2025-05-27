import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Definimos la URL base de tu API
const API_URL = "http://localhost:3000/api";

// --- Thunks Asíncronos ---

/**
 * Thunk para obtener todos los empleados.
 */
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/employees/getall`);
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
    employees: [],
    selectedEmployee: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
    }
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
        state.employees.push(action.payload);
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create employee';
      })
      // Reducers para fetchEmployeeByNumber
      .addCase(fetchEmployeeByNumber.pending, (state) => {
        state.status = 'loading';
        state.selectedEmployee = null;
      })
      .addCase(fetchEmployeeByNumber.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedEmployee = action.payload;
      })
      .addCase(fetchEmployeeByNumber.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch employee by number';
        state.selectedEmployee = null;
      })
      // Reducers para updateEmployee
      .addCase(updateEmployee.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.employees.findIndex(emp => emp.employee_number === action.meta.arg.employeeNumber);
        if (index !== -1) {
          state.employees[index] = { ...state.employees[index], ...action.meta.arg.employeeData };
        }
        if (state.selectedEmployee && state.selectedEmployee.employee_number === action.meta.arg.employeeNumber) {
            state.selectedEmployee = { ...state.selectedEmployee, ...action.meta.arg.employeeData };
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
        state.employees = state.employees.filter(emp => emp.employee_number !== action.payload);
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

export const { clearSelectedEmployee } = employeesSlice.actions;

export default employeesSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Cambia esta URL base si es necesario
const BASE_URL = 'http://localhost:3000/api';

// Thunk para obtener todos los eventos
export const fetchAllEvents = createAsyncThunk(
  'dinning/fetchAllEvents',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${BASE_URL}/`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Thunk para obtener eventos por número de empleado
export const fetchEventsByEmployeeNumber = createAsyncThunk(
  'dinning/fetchEventsByEmployeeNumber',
  async (employee_number, thunkAPI) => {
    try {
      const response = await axios.get(`${BASE_URL}/employee/${employee_number}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Thunk para registrar evento automático
export const registerAutoEvent = createAsyncThunk(
  'dinning/registerAutoEvent',
  async (employee_number, thunkAPI) => {
    try {
      const response = await axios.post(`${BASE_URL}attendance-events/register-event`, { employee_number });
      return response.data.event;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const dinningSlice = createSlice({
  name: 'dinning',
  initialState: {
    events: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDinningError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchAllEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchEventsByEmployeeNumber.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventsByEmployeeNumber.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEventsByEmployeeNumber.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(registerAutoEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAutoEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events.unshift(action.payload);
      })
      .addCase(registerAutoEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDinningError } = dinningSlice.actions;

export default dinningSlice.reducer;

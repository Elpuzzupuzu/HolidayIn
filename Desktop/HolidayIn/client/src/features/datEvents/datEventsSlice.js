import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:3000/api"; // Asegúrate que el puerto es el correcto

// Thunk para procesar archivo .dat
export const processDatFile = createAsyncThunk(
  "datEvents/processDatFile",
  async (filePath, thunkAPI) => {
    try {
      const response = await axios.post(`${API_URL}/process-dat`, { filePath });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { error: "Error al procesar archivo .dat" });
    }
  }
);

export const getWorkedHours = createAsyncThunk(
  "datEvents/getWorkedHours",
  async ({ page = 1, limit = 10 }, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/datEvents/worked-hours?page=${page}&limit=${limit}`);
      console.log("Respuesta getWorkedHours:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en getWorkedHours:", error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || { error: "Error al obtener horas trabajadas" });
    }
  }
);

// Nuevo thunk para filtrar por rango de fechas
export const getWorkedHoursByDateRange = createAsyncThunk(
  "datEvents/getWorkedHoursByDateRange",
  async ({ employee_number, from, to, page = 1, limit = 10 }, thunkAPI) => {
    try {
      let query = `page=${page}&limit=${limit}`;
      if (from) query += `&from=${from}`;
      if (to) query += `&to=${to}`;

      const response = await axios.get(`${API_URL}/datEvents/worked-hours/${employee_number}?${query}`);
      console.log("Respuesta getWorkedHoursByDateRange:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en getWorkedHoursByDateRange:", error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || { error: "Error al obtener horas trabajadas por rango de fechas" });
    }
  }
);

const datEventsSlice = createSlice({
  name: "datEvents",
  initialState: {
    processedResult: null,
    workedHours: [],
    page: 1,
    limit: 10,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(processDatFile.pending, (state) => {
        console.log("processDatFile pending");
        state.status = "loading";
        state.error = null;
      })
      .addCase(processDatFile.fulfilled, (state, action) => {
        console.log("processDatFile fulfilled, payload:", action.payload);
        state.status = "succeeded";
        state.processedResult = action.payload;
      })
      .addCase(processDatFile.rejected, (state, action) => {
        console.log("processDatFile rejected, error:", action.payload);
        state.status = "failed";
        state.error = action.payload?.error || "Error desconocido";
      })

      .addCase(getWorkedHours.pending, (state) => {
        console.log("getWorkedHours pending");
        state.status = "loading";
        state.error = null;
      })
      .addCase(getWorkedHours.fulfilled, (state, action) => {
        console.log("getWorkedHours fulfilled, payload:", action.payload);
        state.status = "succeeded";
        state.workedHours = action.payload.data || [];
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
      })
      .addCase(getWorkedHours.rejected, (state, action) => {
        console.log("getWorkedHours rejected, error:", action.payload);
        state.status = "failed";
        state.error = action.payload?.error || "Error desconocido";
      })

      // ExtraReducers para getWorkedHoursByDateRange
      .addCase(getWorkedHoursByDateRange.pending, (state) => {
        console.log("getWorkedHoursByDateRange pending");
        state.status = "loading";
        state.error = null;
      })
      .addCase(getWorkedHoursByDateRange.fulfilled, (state, action) => {
        console.log("getWorkedHoursByDateRange fulfilled, payload:", action.payload);
        state.status = "succeeded";
        state.workedHours = action.payload.data || [];
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || 10;
      })
      .addCase(getWorkedHoursByDateRange.rejected, (state, action) => {
        console.log("getWorkedHoursByDateRange rejected, error:", action.payload);
        state.status = "failed";
        state.error = action.payload?.error || "Error desconocido";
      });
  },
});

export default datEventsSlice.reducer;

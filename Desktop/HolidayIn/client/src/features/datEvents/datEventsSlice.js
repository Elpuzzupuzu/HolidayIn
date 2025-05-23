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

// este trae toda la data
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

// funciona para filtrar por rango de fechas
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

// Thunk para obtener horas trabajadas por departamento
export const getWorkedHoursByDepartment = createAsyncThunk(
  "datEvents/getWorkedHoursByDepartment",
  async ({ department_id, from, to }, thunkAPI) => {
    try {
      if (!from || !to) {
        return thunkAPI.rejectWithValue({ error: "Se requieren fechas 'from' y 'to'." });
      }

      const response = await axios.get(
        `${API_URL}/datEvents/worked-hours/department/${department_id}?from=${from}&to=${to}`
      );

      console.log("Respuesta getWorkedHoursByDepartment:", response.data);
      return response.data;

    } catch (error) {
      console.error("Error en getWorkedHoursByDepartment:", error.response?.data || error.message);
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: "Error al obtener horas por departamento" }
      );
    }
  }
);

// Thunk para obtener el total de horas trabajadas por un empleado
export const getTotalWorkedHoursByEmployee = createAsyncThunk(
  "datEvents/getTotalWorkedHoursByEmployee",
  async ({ employee_number, from, to }, thunkAPI) => {
    try {
      if (!from || !to) {
        return thunkAPI.rejectWithValue({ error: "Los parámetros 'from' y 'to' son obligatorios." });
      }

      const response = await axios.get(`${API_URL}/datEvents/worked-hours/employee`, {
        params: {
          employee_number,
          from,
          to,
        },
      });

      console.log("Respuesta getTotalWorkedHoursByEmployee:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error en getTotalWorkedHoursByEmployee:", error.response?.data || error.message);
      return thunkAPI.rejectWithValue(
        error.response?.data || { error: "Error al obtener total de horas trabajadas" }
      );
    }
  }
);

// NUEVO THUNK - obtener horas trabajadas entre fechas con opción a filtrar por empleado
export const getWorkedHoursBetweenDates = createAsyncThunk(
  "datEvents/getWorkedHoursBetweenDates",
  async ({ startDate, endDate, employeeNumber = null }, thunkAPI) => {
    try {
      if (!startDate || !endDate) {
        return thunkAPI.rejectWithValue({ error: "Los parámetros startDate y endDate son obligatorios." });
      }

      const response = await axios.get(`${API_URL}/datEvents/worked-hours/filter`, {
        params: {
          startDate,
          endDate,
          employeeNumber,
        },
      });

      console.log("Respuesta getWorkedHoursBetweenDates:", response.data);
      return response.data.data; // asumiendo que en tu backend devuelves { data: [...] }
    } catch (error) {
      console.error("Error en getWorkedHoursBetweenDates:", error.response?.data || error.message);

      return thunkAPI.rejectWithValue(
        error.response?.data || { error: "Error al obtener horas trabajadas" }
      );
    }
  }
);

const datEventsSlice = createSlice({
  name: "datEvents",
  initialState: {
    processedResult: null,
    workedHours: [],
    totalWorkedHours: null, // <--- nueva propiedad
    page: 1,
    limit: 10,
    status: "idle",
    error: null,
  },
  reducers: {
    clearWorkedHours(state) {
      state.workedHours = [];
      state.page = 1;
      state.limit = 10;
      state.status = "idle";
      state.error = null;
    },
    clearTotalWorkedHours: (state) => {
    state.totalWorkedHours = null;
}

  },
  extraReducers: (builder) => {
    builder
      // processDatFile
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

      // getWorkedHours
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

      // getWorkedHoursByDateRange
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
      })

      // getWorkedHoursByDepartment
      .addCase(getWorkedHoursByDepartment.pending, (state) => {
        console.log("getWorkedHoursByDepartment pending");
        state.status = "loading";
        state.error = null;
      })
      .addCase(getWorkedHoursByDepartment.fulfilled, (state, action) => {
        console.log("getWorkedHoursByDepartment fulfilled:", action.payload);
        state.status = "succeeded";
        state.workedHours = action.payload.data || [];
      })
      .addCase(getWorkedHoursByDepartment.rejected, (state, action) => {
        console.log("getWorkedHoursByDepartment rejected:", action.payload);
        state.status = "failed";
        state.error = action.payload?.error || "Error desconocido";
      })

      // getTotalWorkedHoursByEmployee
      .addCase(getTotalWorkedHoursByEmployee.pending, (state) => {
        console.log("getTotalWorkedHoursByEmployee pending");
        state.status = "loading";
        state.error = null;
      })
      .addCase(getTotalWorkedHoursByEmployee.fulfilled, (state, action) => {
        console.log("getTotalWorkedHoursByEmployee fulfilled:", action.payload);
        state.status = "succeeded";
        state.totalWorkedHours = action.payload;
      })
      .addCase(getTotalWorkedHoursByEmployee.rejected, (state, action) => {
        console.log("getTotalWorkedHoursByEmployee rejected:", action.payload);
        state.status = "failed";
        state.error = action.payload?.error || "Error desconocido";
      })

      // NUEVO: getWorkedHoursBetweenDates
      .addCase(getWorkedHoursBetweenDates.pending, (state) => {
        console.log("getWorkedHoursBetweenDates pending");
        state.status = "loading";
        state.error = null;
      })
      .addCase(getWorkedHoursBetweenDates.fulfilled, (state, action) => {
        console.log("getWorkedHoursBetweenDates fulfilled:", action.payload);
        state.status = "succeeded";
        state.workedHours = action.payload || [];
      })
      .addCase(getWorkedHoursBetweenDates.rejected, (state, action) => {
  console.log("getWorkedHoursBetweenDates rejected, action:", action);
  state.status = "failed";
  state.error =
    (action.payload && (typeof action.payload === "string" ? action.payload : action.payload.error)) ||
    action.error?.message ||
    "Error desconocido";
});

  },
});

export const { clearWorkedHours, clearTotalWorkedHours } = datEventsSlice.actions;

export default datEventsSlice.reducer;

// client/src/features/horarios/horariosSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// Importamos el modelo Horario que encapsula la lógica de la llamada a la intranet
import Horario from '../../../../server/models/Horario';

// --- Thunks Asíncronos ---

/**
 * Thunk para obtener los horarios de los colaboradores.
 * Acepta un objeto 'params' que debe contener 'deptoId' y 'numeroSemana'.
 *
 * @param {object} params - Objeto con los parámetros de búsqueda.
 * @param {string | number} params.deptoId - El ID del departamento.
 * @param {string | number} params.numeroSemana - El número de la semana.
 * @returns {Promise<Array<Colaborador>>} Una promesa que resuelve con un array de objetos Colaborador.
 */
export const fetchHorarios = createAsyncThunk(
  'horarios/fetchHorarios', // Nombre del slice / nombre de la acción
  async ({ deptoId, numeroSemana }, { rejectWithValue }) => {
    try {
      // Llamamos directamente al método estático del modelo Horario
      // Este método ya se encarga de hacer el 'fetch' a la intranet y mapear a Colaborador
      const data = await Horario.getByDeptoAndWeek(deptoId, numeroSemana);
      return data; // Retorna los datos que serán el 'payload' de la acción fulfilled
    } catch (error) {
      // Usa rejectWithValue para pasar el error al extraReducer
      console.error("Error en thunk fetchHorarios:", error.message);
      return rejectWithValue(error.message || 'Fallo al obtener horarios');
    }
  }
);

// --- Slice de Horarios ---
const horariosSlice = createSlice({
  name: 'horarios', // Nombre del slice
  initialState: {
    data: [], // Aquí se almacenarán los objetos Colaborador
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null, // Almacena cualquier mensaje de error
  },
  reducers: {
    // No necesitamos reducers síncronos adicionales para este caso de uso de solo GET.
    // Si en el futuro quisieras, por ejemplo, limpiar los horarios, los añadirías aquí:
    // clearHorarios: (state) => {
    //   state.data = [];
    //   state.status = 'idle';
    //   state.error = null;
    // }
  },
  extraReducers: (builder) => {
    builder
      // Manejo de estados para fetchHorarios.pending
      .addCase(fetchHorarios.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Limpiamos cualquier error previo al iniciar una nueva carga
      })
      // Manejo de estados para fetchHorarios.fulfilled (éxito)
      .addCase(fetchHorarios.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload; // Asignamos los datos recibidos (array de Colaborador)
      })
      // Manejo de estados para fetchHorarios.rejected (fallo)
      .addCase(fetchHorarios.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // El payload contendrá el mensaje de error de rejectWithValue
        state.data = []; // Limpiamos los datos en caso de error
      });
  },
});

// Exportamos las acciones síncronas si las hubiera (en este caso, ninguna)
// export const { clearHorarios } = horariosSlice.actions;

// Exportamos el reducer por defecto
export default horariosSlice.reducer;
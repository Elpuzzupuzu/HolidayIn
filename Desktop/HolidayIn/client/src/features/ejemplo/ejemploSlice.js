import { createSlice } from '@reduxjs/toolkit';

const ejemploSlice = createSlice({
  name: 'ejemplo',
  initialState: {
    valor: 0,
  },
  reducers: {
    incrementar: (state) => {
      state.valor += 1;
    },
    decrementar: (state) => {
      state.valor -= 1;
    },
  },
});

export const { incrementar, decrementar } = ejemploSlice.actions;
export default ejemploSlice.reducer;

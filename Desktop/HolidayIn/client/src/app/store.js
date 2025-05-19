

import { configureStore } from '@reduxjs/toolkit';
import ejemploReducer from '../features/ejemplo/ejemploSlice';

export const store = configureStore({
  reducer: {
    ejemplo: ejemploReducer,
  },
});

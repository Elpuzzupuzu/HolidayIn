

import { configureStore } from '@reduxjs/toolkit';
import ejemploReducer from '../features/datEvents/datEventsSlice';

export const store = configureStore({
  reducer: {
    ejemplo: ejemploReducer,
  },
});

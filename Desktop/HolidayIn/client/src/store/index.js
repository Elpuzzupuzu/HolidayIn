import { configureStore } from "@reduxjs/toolkit";
import datEventsReducer from "../features/datEvents/datEventsSlice";

export const store = configureStore({
  reducer: {
    datEvents: datEventsReducer,
    // aquí puedes agregar más reducers si necesitas
  },
});

export default store;
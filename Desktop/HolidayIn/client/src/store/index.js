import { configureStore } from "@reduxjs/toolkit";
import datEventsReducer from "../features/datEvents/datEventsSlice";
import dinningReducer from "../features/dining_room/dinningSlice"

export const store = configureStore({
  reducer: {
    datEvents: datEventsReducer,
    dinning: dinningReducer,  // <- agrégalo aquí
    // aquí puedes agregar más reducers si necesitas
  },
});

export default store;

import { configureStore } from "@reduxjs/toolkit";
import datEventsReducer from "../features/datEvents/datEventsSlice";
import dinningReducer from "../features/dining_room/dinningSlice";
import employeesReducer from "../features/employees/employeesSlice"; // Importa el reducer de empleados

export const store = configureStore({
  reducer: {
    datEvents: datEventsReducer,
    dinning: dinningReducer,
    employees: employeesReducer, // ¡Agrégalo aquí!
    // aquí puedes agregar más reducers si necesitas
  },
});

export default store;
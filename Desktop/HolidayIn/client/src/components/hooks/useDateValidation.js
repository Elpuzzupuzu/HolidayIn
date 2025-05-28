import { useState, useEffect } from 'react'; // Puedes necesitar useState/useEffect si el hook maneja su propio estado interno

/**
 * Hook personalizado para validar rangos de fechas.
 * @param {string} fromDate - La fecha de inicio en formato YYYY-MM-DD.
 * @param {string} toDate - La fecha de fin en formato YYYY-MM-DD.
 * @param {string} minAllowedDateStr - (Opcional) La fecha mínima permitida en formato YYYY-MM-DD.
 * @returns {function} Una función de validación que retorna true si las fechas son válidas, false en caso contrario.
 */
const useDateValidation = (fromDate, toDate, minAllowedDateStr = '2000-01-01') => { // Valor por defecto para minAllowedDateStr

  const validateDates = () => {
    // Convertir las fechas a objetos Date para comparaciones
    const dateFrom = new Date(fromDate);
    const dateTo = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Para comparar solo la fecha, sin la hora

    // 1. Validar que la fecha de inicio no sea posterior a la fecha de fin
    if (dateFrom > dateTo) {
      alert("📅 Error en las fechas:\nLa fecha de inicio debe ser anterior o igual a la fecha de fin.");
      return false;
    }

    // 2. Validar que las fechas no sean futuras (respecto a la fecha actual)
    if (dateFrom > today) {
        alert("⛔ Error en la fecha de inicio:\nLa fecha de inicio no puede ser una fecha futura.");
        return false;
    }

    if (dateTo > today) {
        alert("⛔ Error en la fecha de fin:\nLa fecha de fin no puede ser una fecha futura.");
        return false;
    }

    // 3. Validar una fecha mínima si tu sistema tiene un "inicio" de registros
    const minAllowedDate = new Date(minAllowedDateStr);
    minAllowedDate.setHours(0, 0, 0, 0); // Asegurarse de comparar solo el día

    if (dateFrom < minAllowedDate || dateTo < minAllowedDate) {
        alert("🚫 Fechas fuera de rango:\nPor favor, selecciona fechas a partir del " + minAllowedDate.toLocaleDateString() + ".");
        return false;
    }
    
    return true; // Todas las validaciones pasaron
  };

  // El hook retorna la función de validación
  return validateDates;
};

export default useDateValidation;
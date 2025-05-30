// src/models/Horario.js
// Ya no necesitas importar Colaborador aquí si no lo usas para el mapeo inicial
// import Colaborador from './Colaborador'; // Puedes eliminar esta línea

const BASE_URL = '/portalMIDDT/apl_hor/consulta.php';

class Horario {
  static async getByDeptoAndWeek(deptoId, numeroSemana) {
    try {
      const url = `${BASE_URL}?depto_id=${deptoId}&num_sem=${numeroSemana}`;
      const response = await fetch(url);

      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.message || JSON.stringify(errorData)}`;
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage += ` - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // ¡IMPORTANTE AQUÍ! Retornar los datos tal como vienen, sin mapear a Colaborador
      return data; // Retornar el array de objetos planos JSON
    } catch (error) {
      console.error("Error en el modelo Horario.getByDeptoAndWeek:", error.message);
      throw new Error(`Fallo al obtener horarios: ${error.message}`);
    }
  }
}

export default Horario;
// src/models/Colaborador.js
class Colaborador {
  constructor(data) {
    this.id = data.idColaborador;
    this.deptoId = data.depto_Id;
    this.anioSemana = data.anioSemana;
    this.numeroSemana = data.numeroSemana;
    this.activo = data.activo === 'SI'; // Convertir "SI" a booleano
    this.semana = data.semana; // Array de horarios
  }

  // Métodos de negocio relacionados con un colaborador
  getHorarioDia(diaIndex) {
    if (this.semana && this.semana[diaIndex] !== undefined) { // Asegura que el índice existe
      return this.semana[diaIndex];
    }
    return 'Sin horario';
  }

  estaDisponible() {
    // Si la semana es un array de cadenas vacías, el colaborador no tiene horario asignado
    return this.activo && this.semana.some(horario => horario !== "");
  }
}

export default Colaborador;
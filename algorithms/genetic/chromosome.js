// src/algorithms/genetic/chromosome.js

/**
 * Representa una solución (horario) en el algoritmo genético.
 * Cada cromosoma contiene un arreglo de "genes" (clases asignadas).
 */

export class ClaseAsignada {
  constructor(cargaHorariaId, docenteId, cursoId, asignaturaId, aulaId, dia, horaInicio, horaFin) {
    this.cargaHorariaId = cargaHorariaId;
    this.docenteId = docenteId;
    this.cursoId = cursoId;
    this.asignaturaId = asignaturaId;
    this.aulaId = aulaId;
    this.dia = dia;           // 'LUNES' | 'MARTES' | ...
    this.horaInicio = horaInicio; // '07:00'
    this.horaFin = horaFin;       // '08:00'
  }
}

export class Chromosome {
  constructor(clases = []) {
    this.clases = clases;
    this.fitness = 0;
    this.conflictos = 0;
    this.restriccionesCumplidas = 0;
  }

  /**
   * Clona el cromosoma (para operaciones genéticas)
   */
  clone() {
    const nuevasClases = this.clases.map(c => 
      new ClaseAsignada(
        c.cargaHorariaId, c.docenteId, c.cursoId,
        c.asignaturaId, c.aulaId, c.dia, c.horaInicio, c.horaFin
      )
    );
    const clon = new Chromosome(nuevasClases);
    clon.fitness = this.fitness;
    clon.conflictos = this.conflictos;
    clon.restriccionesCumplidas = this.restriccionesCumplidas;
    return clon;
  }

  /**
   * Obtener todas las clases de un día específico
   */
  getClasesPorDia(dia) {
    return this.clases.filter(c => c.dia === dia);
  }

  /**
   * Obtener todas las clases de un docente
   */
  getClasesPorDocente(docenteId) {
    return this.clases.filter(c => c.docenteId === docenteId);
  }

  /**
   * Obtener todas las clases de un curso
   */
  getClasesPorCurso(cursoId) {
    return this.clases.filter(c => c.cursoId === cursoId);
  }

  /**
   * Obtener todas las clases de un aula
   */
  getClasesPorAula(aulaId) {
    return this.clases.filter(c => c.aulaId === aulaId);
  }
}
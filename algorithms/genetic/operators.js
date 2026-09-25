// src/algorithms/genetic/operators.js
import { Chromosome, ClaseAsignada } from './chromosome.js';

/**
 * SELECCIÓN POR TORNEO
 * Elige el mejor de N participantes aleatorios
 */
export function seleccionTorneo(poblacion, tamañoTorneo = 3) {
  const participantes = [];
  for (let i = 0; i < tamañoTorneo; i++) {
    const idx = Math.floor(Math.random() * poblacion.length);
    participantes.push(poblacion[idx]);
  }
  return participantes.reduce((mejor, actual) => 
    actual.fitness > mejor.fitness ? actual : mejor
  );
}

/**
 * CRUCE POR PUNTO ÚNICO
 * Combina dos padres para crear dos hijos
 */
export function cruce(padre1, padre2, tasaCruce = 0.8) {
  if (Math.random() > tasaCruce) {
    return [padre1.clone(), padre2.clone()];
  }

  const puntoCruce = Math.floor(Math.random() * padre1.clases.length);
  
  const hijo1Clases = [
    ...padre1.clases.slice(0, puntoCruce).map(c => clonarClase(c)),
    ...padre2.clases.slice(puntoCruce).map(c => clonarClase(c))
  ];
  
  const hijo2Clases = [
    ...padre2.clases.slice(0, puntoCruce).map(c => clonarClase(c)),
    ...padre1.clases.slice(puntoCruce).map(c => clonarClase(c))
  ];

  return [new Chromosome(hijo1Clases), new Chromosome(hijo2Clases)];
}

/**
 * MUTACIÓN
 * Cambia aleatoriamente el día/hora/aula de algunas clases
 */
export function mutar(chromosome, tasaMutacion = 0.05, dias = [], horas = [], aulas = []) {
  const mutado = chromosome.clone();

  for (let i = 0; i < mutado.clases.length; i++) {
    if (Math.random() < tasaMutacion) {
      const clase = mutado.clases[i];

      // Elegir qué mutar (día, hora o aula)
      const tipoMutacion = Math.floor(Math.random() * 3);

      if (tipoMutacion === 0 && dias.length > 0) {
        clase.dia = dias[Math.floor(Math.random() * dias.length)];
      } else if (tipoMutacion === 1 && horas.length > 0) {
        const hora = horas[Math.floor(Math.random() * horas.length)];
        clase.horaInicio = hora.inicio;
        clase.horaFin = hora.fin;
      } else if (tipoMutacion === 2 && aulas.length > 0) {
        clase.aulaId = aulas[Math.floor(Math.random() * aulas.length)];
      }
    }
  }

  return mutado;
}

/**
 * ELITISMO
 * Conserva los mejores individuos de una generación
 */
export function elitismo(poblacion, cantidadElite = 2) {
  const ordenada = [...poblacion].sort((a, b) => b.fitness - a.fitness);
  return ordenada.slice(0, cantidadElite);
}

// ============================================
// UTILIDADES
// ============================================

function clonarClase(c) {
  return new ClaseAsignada(
    c.cargaHorariaId, c.docenteId, c.cursoId,
    c.asignaturaId, c.aulaId, c.dia, c.horaInicio, c.horaFin
  );
}
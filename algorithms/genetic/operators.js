// algorithms/genetic/operators.js
import { Chromosome, ClaseAsignada } from './chromosome.js';
import { calcularFitness } from './fitness.js';

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
 * Cambia de lugar algunas clases: intercambio entre dos clases o nuevo día/bloque.
 * El aula no se muta: cada curso tiene aula fija.
 */
export function mutar(chromosome, tasaMutacion = 0.05, dias = [], bloques = [], aulas = []) {
  const mutado = chromosome.clone();
  const n = mutado.clases.length;

  for (let i = 0; i < n; i++) {
    if (Math.random() < tasaMutacion) {
      const clase = mutado.clases[i];

      if (Math.random() < 0.5 && n > 1) {
        // Intercambio: dos clases del curso cambian de día y bloque entre sí.
        // No crea choques dentro del curso, y funciona aunque la semana esté llena.
        const otra = mutado.clases[Math.floor(Math.random() * n)];
        [clase.dia, otra.dia] = [otra.dia, clase.dia];
        [clase.horaInicio, otra.horaInicio] = [otra.horaInicio, clase.horaInicio];
        [clase.horaFin, otra.horaFin] = [otra.horaFin, clase.horaFin];
      } else if (Math.random() < 0.5 && dias.length > 0) {
        clase.dia = dias[Math.floor(Math.random() * dias.length)];
      } else if (bloques.length > 0) {
        const bloque = bloques[Math.floor(Math.random() * bloques.length)];
        clase.horaInicio = bloque.inicio;
        clase.horaFin = bloque.fin;
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

/**
 * REPARACIÓN (búsqueda local)
 * Al terminar la evolución, si quedan conflictos, prueba intercambiar el día y bloque
 * de cada clase con las demás clases del curso y conserva el cambio que más los reduzca.
 */
export function reparar(chromosome, disponibilidades = [], clasesOcupadas = [], maxPasadas = 20) {
  const c = chromosome;
  calcularFitness(c, disponibilidades, clasesOcupadas);
  const swap = (a, b) => {
    [a.dia, b.dia] = [b.dia, a.dia];
    [a.horaInicio, b.horaInicio] = [b.horaInicio, a.horaInicio];
    [a.horaFin, b.horaFin] = [b.horaFin, a.horaFin];
  };
  for (let pasada = 0; pasada < maxPasadas && c.conflictos > 0; pasada++) {
    let mejora = false;
    for (let i = 0; i < c.clases.length && c.conflictos > 0; i++) {
      let mejorJ = -1, mejorFit = c.fitness;
      for (let j = 0; j < c.clases.length; j++) {
        if (i === j) continue;
        swap(c.clases[i], c.clases[j]);
        const f = calcularFitness(c, disponibilidades, clasesOcupadas);
        if (f > mejorFit) { mejorFit = f; mejorJ = j; }
        swap(c.clases[i], c.clases[j]);
      }
      if (mejorJ >= 0) { swap(c.clases[i], c.clases[mejorJ]); mejora = true; }
      calcularFitness(c, disponibilidades, clasesOcupadas);
    }
    if (!mejora) break;
  }
  return c;
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
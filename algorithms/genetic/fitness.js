// src/algorithms/genetic/fitness.js

/**
 * Función de aptitud (fitness)
 * Evalúa qué tan buena es una solución (horario)
 * 
 * Restricciones DURAS (penalización alta):
 *   - Un docente no puede estar en 2 clases al mismo tiempo
 *   - Un curso no puede tener 2 clases al mismo tiempo
 *   - Un aula no puede estar ocupada por 2 clases al mismo tiempo
 *   - El docente debe estar disponible
 * 
 * Restricciones BLANDAS (penalización baja):
 *   - Distribución equilibrada de clases
 *   - Evitar huecos
 */

const PENALIZACION_DURA = 100;
const PENALIZACION_BLANDA = 10;

export function calcularFitness(chromosome, disponibilidades = []) {
  let penalizaciones = 0;
  let conflictos = 0;

  const clases = chromosome.clases;

  // ============================================
  // 1. CRUCE DE DOCENTES
  // ============================================
  for (let i = 0; i < clases.length; i++) {
    for (let j = i + 1; j < clases.length; j++) {
      const a = clases[i];
      const b = clases[j];

      // Solo verificar si están en el mismo día
      if (a.dia !== b.dia) continue;

      // Verificar si se solapan en horario
      if (seSolapan(a.horaInicio, a.horaFin, b.horaInicio, b.horaFin)) {

        // Cruce de docente
        if (a.docenteId === b.docenteId) {
          penalizaciones += PENALIZACION_DURA;
          conflictos++;
        }

        // Cruce de curso
        if (a.cursoId === b.cursoId) {
          penalizaciones += PENALIZACION_DURA;
          conflictos++;
        }

        // Cruce de aula
        if (a.aulaId === b.aulaId) {
          penalizaciones += PENALIZACION_DURA;
          conflictos++;
        }
      }
    }
  }

  // ============================================
  // 2. DISPONIBILIDAD DOCENTE
  // ============================================
  for (const clase of clases) {
    const disponible = disponibilidades.some(d => 
      d.docenteId === clase.docenteId &&
      d.dia === clase.dia &&
      horaEnRango(clase.horaInicio, d.horaInicio, d.horaFin) &&
      horaEnRango(clase.horaFin, d.horaInicio, d.horaFin)
    );

    if (!disponible && disponibilidades.length > 0) {
      penalizaciones += PENALIZACION_DURA;
      conflictos++;
    }
  }

  // ============================================
  // 3. DISTRIBUCIÓN EQUILIBRADA (blanda)
  // ============================================
  // Penalizar si un curso tiene demasiadas clases en un solo día
  const clasesPorCursoDia = {};
  for (const clase of clases) {
    const key = `${clase.cursoId}-${clase.dia}`;
    clasesPorCursoDia[key] = (clasesPorCursoDia[key] || 0) + 1;
  }

  for (const key in clasesPorCursoDia) {
    if (clasesPorCursoDia[key] > 6) {
      penalizaciones += PENALIZACION_BLANDA;
    }
  }

  // ============================================
  // CALCULAR FITNESS
  // ============================================
  const totalClases = clases.length * 3; // 3 restricciones duras por par
  const fitness = Math.max(0, 100 - (penalizaciones / Math.max(1, totalClases)) * 100);

  chromosome.fitness = Math.round(fitness * 100) / 100;
  chromosome.conflictos = conflictos;
  chromosome.restriccionesCumplidas = totalClases - conflictos;

  return chromosome.fitness;
}

// ============================================
// UTILIDADES
// ============================================

function seSolapan(inicio1, fin1, inicio2, fin2) {
  const i1 = horaAMinutos(inicio1);
  const f1 = horaAMinutos(fin1);
  const i2 = horaAMinutos(inicio2);
  const f2 = horaAMinutos(fin2);
  return i1 < f2 && i2 < f1;
}

function horaEnRango(hora, inicio, fin) {
  const h = horaAMinutos(hora);
  const i = horaAMinutos(inicio);
  const f = horaAMinutos(fin);
  return h >= i && h <= f;
}

function horaAMinutos(hora) {
  if (!hora) return 0;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}
// algorithms/genetic/fitness.js
const PENALIZACION_DURA = 100;
const PENALIZACION_BLANDA = 10;

export function calcularFitness(chromosome, disponibilidades = [], clasesOcupadas = []) {
  let penalizaciones = 0;
  let conflictos = 0;

  const clases = chromosome.clases;

  for (let i = 0; i < clases.length; i++) {
    const a = clases[i];

    // 1. Cruces dentro del mismo curso (las aulas no son restricción: cada curso tiene aula fija)
    for (let j = i + 1; j < clases.length; j++) {
      const b = clases[j];

      if (a.dia !== b.dia) continue;

      if (seSolapan(a.horaInicio, a.horaFin, b.horaInicio, b.horaFin)) {
        if (a.docenteId === b.docenteId) { penalizaciones += PENALIZACION_DURA; conflictos++; }
        if (a.cursoId === b.cursoId) { penalizaciones += PENALIZACION_DURA; conflictos++; }
      }
    }

    // 2. ✅ NUEVO: Cruce con OTROS cursos (Horarios ocupados)
    for (const ocupada of clasesOcupadas) {
      if (a.docenteId === ocupada.docenteId && a.dia === ocupada.dia) {
        if (seSolapan(a.horaInicio, a.horaFin, ocupada.horaInicio, ocupada.horaFin)) {
          penalizaciones += PENALIZACION_DURA;
          conflictos++;
        }
      }
    }

    // 3. Disponibilidad docente
    const disponible = disponibilidades.some(d => 
      d.docenteId === a.docenteId &&
      d.dia === a.dia &&
      horaEnRango(a.horaInicio, d.horaInicio, d.horaFin) &&
      horaEnRango(a.horaFin, d.horaInicio, d.horaFin)
    );

    if (!disponible && disponibilidades.length > 0) {
      penalizaciones += PENALIZACION_DURA;
      conflictos++;
    }
  }

  // 4. Distribución (Blanda)
  const clasesPorCursoDia = {};
  for (const clase of clases) {
    const key = `${clase.cursoId}-${clase.dia}`;
    clasesPorCursoDia[key] = (clasesPorCursoDia[key] || 0) + 1;
  }
  for (const key in clasesPorCursoDia) {
    if (clasesPorCursoDia[key] > 7) { // Máximo 7 clases al día
      penalizaciones += PENALIZACION_BLANDA;
    }
  }

  const totalClases = clases.length * 2;
  // Cada conflicto baja el fitness de forma gradual: 0 → 100; 1 duro → 50; 2 → 33,3; 1 blando → 90,9
  const fitness = 100 / (1 + penalizaciones / PENALIZACION_DURA);

  chromosome.fitness = Math.round(fitness * 100) / 100;
  chromosome.conflictos = conflictos;
  chromosome.restriccionesCumplidas = totalClases - conflictos;

  return chromosome.fitness;
}

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
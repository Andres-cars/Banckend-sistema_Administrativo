// algorithms/genetic/fitness.js
const PENALIZACION_DURA = 100;
const PENALIZACION_BLANDA = 10;
const MAX_PAUSA = 30; // minutos: el receso (20 o 30 min) no rompe la continuidad

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

    // 2. Cruce con OTROS cursos (horarios ya guardados)
    //    - Misma sección (RH-01): conflicto duro.
    //    - ✅ RB-03: colegio sobre escuela → solo penalización blanda (aviso), el colegio tiene prioridad.
    for (const ocupada of clasesOcupadas) {
      if (a.docenteId === ocupada.docenteId && a.dia === ocupada.dia) {
        if (seSolapan(a.horaInicio, a.horaFin, ocupada.horaInicio, ocupada.horaFin)) {
          if (ocupada.cruceBlando) {
            penalizaciones += PENALIZACION_BLANDA;
          } else {
            penalizaciones += PENALIZACION_DURA;
            conflictos++;
          }
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

  // 4. Restricciones deseables RB-01 y RB-02 (blandas), por curso, día y asignatura
  const grupos = {};
  for (const clase of clases) {
    const key = `${clase.cursoId}-${clase.dia}-${clase.asignaturaId}`;
    (grupos[key] = grupos[key] || []).push(clase);
  }
  for (const key in grupos) {
    const g = grupos[key];
    if (g.length < 2) continue;
    // RB-02: máximo 2 horas de la misma asignatura en un día
    if (g.length > 2) penalizaciones += PENALIZACION_BLANDA * (g.length - 2);
    // RB-01: las horas del mismo día van seguidas (se admite el receso entre ellas)
    const orden = g.map(c => [horaAMinutos(c.horaInicio), horaAMinutos(c.horaFin)]).sort((x, y) => x[0] - y[0]);
    for (let k = 1; k < orden.length; k++) {
      if (orden[k][0] - orden[k - 1][1] > MAX_PAUSA) penalizaciones += PENALIZACION_BLANDA;
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


// ✅ RB-03: lista de cruces entre secciones (escuela / colegio) que quedaron en el horario
export function detectarCrucesEntreSecciones(clases = [], clasesOcupadas = [], seccionActual = 'COLEGIO') {
  const avisos = [];
  const vistos = new Set();

  for (const a of clases) {
    for (const o of clasesOcupadas) {
      if (o.seccion === seccionActual) continue; // solo entre secciones distintas
      if (a.docenteId !== o.docenteId || a.dia !== o.dia) continue;
      if (!seSolapan(a.horaInicio, a.horaFin, o.horaInicio, o.horaFin)) continue;

      const clave = `${a.docenteId}|${a.dia}|${a.horaInicio}|${o.horaInicio}|${o.curso}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);

      avisos.push({
        docenteId: a.docenteId,
        cargaHorariaId: a.cargaHorariaId,
        dia: a.dia,
        horaInicio: a.horaInicio,
        horaFin: a.horaFin,
        otraSeccion: o.seccion,
        otroCurso: o.curso,
        otroHorario: o.horario,
        otraHoraInicio: o.horaInicio,
        otraHoraFin: o.horaFin,
      });
    }
  }
  return avisos;
}
// algorithms/genetic/validador.js — ✅ HU-12: valida un horario ajustado a mano
// Usa la MISMA función de aptitud del algoritmo genético (A2.5), así la regla es una sola.
import { cargarDatos, obtenerDias } from './data-loader.js';
import { calcularFitness, detectarCrucesEntreSecciones } from './fitness.js';
import { Chromosome, ClaseAsignada } from './chromosome.js';

const MAX_PAUSA = 30; // igual que en fitness.js (RB-01)
const aMin = (h) => { const [a, b] = String(h).slice(0, 5).split(':').map(Number); return a * 60 + b; };
const solapan = (a1, a2, b1, b2) => aMin(a1) < aMin(b2) && aMin(b1) < aMin(a2);

// Carga los datos del curso y valida
export async function validarHorario({ periodoId, cursoId, clases }) {
  if (!cursoId) throw new Error('Falta el curso del horario');
  const datos = await cargarDatos(periodoId, 1, cursoId);
  return validarClases(clases, datos);
}

// Función pura: recibe las clases del navegador y los datos ya cargados
export function validarClases(clasesEntrada = [], datos) {
  const { cargas, bloques, seccion, clasesOcupadas, disponibilidades = [] } = datos;
  const errores = [];
  const porId = new Map(cargas.map((c) => [Number(c.id), c]));
  const dias = obtenerDias();
  const bloqueValido = new Set(bloques.map((b) => `${b.inicio}|${b.fin}`));

  // 1. Se reconstruye cada clase desde su carga: el navegador solo decide día y hora.
  //    Así nadie puede cambiar docente, curso, asignatura ni aula desde el navegador.
  const clases = [];
  for (const e of clasesEntrada) {
    const carga = porId.get(Number(e.cargaHorariaId));
    if (!carga) { errores.push('Hay una clase que no pertenece a las cargas de este curso.'); continue; }
    const inicio = String(e.horaInicio).slice(0, 5), fin = String(e.horaFin).slice(0, 5);
    if (!dias.includes(e.dia) || !bloqueValido.has(`${inicio}|${fin}`)) {               // RH-04
      errores.push(`La clase de ${carga.asignatura?.nombre} está fuera de los bloques de la jornada.`); continue;
    }
    clases.push(new ClaseAsignada(carga.id, carga.docente_id, carga.curso_id, carga.asignatura_id,
      carga.curso.aula_id, e.dia, inicio, fin));
  }
  // RH-03: cada carga conserva exactamente sus horas
  for (const c of cargas) {
    const n = clases.filter((x) => x.cargaHorariaId === c.id).length;
    if (n !== c.horas_semanales) errores.push(`${c.asignatura?.nombre} debe tener ${c.horas_semanales} ${c.horas_semanales === 1 ? "hora" : "horas"} y tiene ${n}.`);
  }

  // 2. Aptitud y conflictos con la misma función del algoritmo
  const crom = new Chromosome(clases);
  calcularFitness(crom, disponibilidades, clasesOcupadas);

  // 3. Detalle de los cruces para mostrarlos en la tabla
  const nombre = (id) => { const c = porId.get(id); return { asignatura: c?.asignatura?.nombre || '', docente: c?.docente ? `${c.docente.nombres} ${c.docente.apellidos}` : '' }; };
  const cruces = [];
  for (let i = 0; i < clases.length; i++) {
    const a = clases[i];
    for (let j = i + 1; j < clases.length; j++) {                                        // RH-02 dentro del curso
      const b = clases[j];
      if (a.dia === b.dia && solapan(a.horaInicio, a.horaFin, b.horaInicio, b.horaFin)) {
        cruces.push({ tipo: 'RH-02', dia: a.dia, horaInicio: a.horaInicio, horaFin: a.horaFin, ...nombre(a.cargaHorariaId),
          mensaje: `Dos clases del curso en el mismo período (${nombre(a.cargaHorariaId).asignatura} y ${nombre(b.cargaHorariaId).asignatura}).` });
      }
    }
    for (const o of clasesOcupadas) {                                                      // RH-01 con otros cursos
      if (o.cruceBlando || a.docenteId !== o.docenteId || a.dia !== o.dia) continue;
      if (!solapan(a.horaInicio, a.horaFin, o.horaInicio, o.horaFin)) continue;
      const n = nombre(a.cargaHorariaId);
      cruces.push({ tipo: 'RH-01', dia: a.dia, horaInicio: a.horaInicio, horaFin: a.horaFin, ...n, otroCurso: o.curso, otroHorario: o.horario,
        mensaje: `${n.docente} ya tiene clase a esa hora en ${o.curso} (${o.horario}).` });
    }
  }

  // 4. Avisos que no impiden guardar
  const rb03 = detectarCrucesEntreSecciones(clases, clasesOcupadas, seccion).map((a) => ({ ...a, ...nombre(a.cargaHorariaId) }));
  const distribucion = [];
  const grupos = {};
  for (const c of clases) (grupos[`${c.dia}|${c.asignaturaId}`] ||= []).push(c);
  for (const g of Object.values(grupos)) {
    if (g.length < 2) continue;
    const n = nombre(g[0].cargaHorariaId).asignatura;
    if (g.length > 2) distribucion.push({ tipo: 'RB-02', dia: g[0].dia, asignatura: n, mensaje: `${n} tiene ${g.length} horas el mismo día (máximo 2).` });
    const o = g.map((c) => [aMin(c.horaInicio), aMin(c.horaFin), c.horaInicio]).sort((x, y) => x[0] - y[0]);
    for (let k = 1; k < o.length; k++) {
      if (o[k][0] - o[k - 1][1] > MAX_PAUSA) distribucion.push({ tipo: 'RB-01', dia: g[0].dia, asignatura: n, mensaje: `${n} queda con horas separadas (${o[k - 1][2]} y ${o[k][2]}).` });
    }
  }

  return {
    valido: errores.length === 0 && crom.conflictos === 0,
    fitness: Number(crom.fitness.toFixed(2)),
    conflictos: crom.conflictos + errores.length,
    errores,
    cruces,
    avisos: { rb03, distribucion },
    clases,               // clases reconstruidas desde las cargas (las que se guardan)
  };
}
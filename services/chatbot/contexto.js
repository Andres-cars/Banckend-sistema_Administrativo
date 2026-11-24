// services/chatbot/contexto.js
// ✅ Contexto mínimo por rol (lista blanca de campos) y seudónimos de docentes (LOPDP).
//    Esto es lo ÚNICO que se envía a la IA.
import { normalizar, nombreCurso } from './texto.js';
import { JORNADA } from './intenciones.js';

// DOCENTE: solo su horario publicado y su carga. No se envía su nombre ni su identificación.
export function contextoDocente(datos, pregunta) {
  const contexto = {
    periodo: datos.periodo?.nombre || null,
    jornada: JORNADA,
    totalHoras: datos.totalHoras || 0,
    cargas: (datos.cargas || []).map((c) => ({ asignatura: c.asignatura, curso: c.curso, horas: c.horas_semanales })),
    clases: (datos.clases || []).map((c) => ({
      dia: c.dia, inicio: c.hora_inicio, fin: c.hora_fin, asignatura: c.asignatura, curso: c.curso, aula: c.aula,
    })),
  };
  return { contexto, pregunta, seudonimos: new Map() };
}

// ADMINISTRADOR: resumen institucional con los docentes seudonimizados (DOC-01, DOC-02…).
export function contextoAdmin(d, pregunta) {
  const seudonimos = new Map(); // alias -> nombre real (NO sale del backend)
  const aliasPorId = new Map();
  d.docentes.forEach((x, i) => {
    const alias = `DOC-${String(i + 1).padStart(2, '0')}`;
    aliasPorId.set(Number(x.id), alias);
    seudonimos.set(alias, `${x.nombres} ${x.apellidos}`.trim());
  });

  const horas = new Map();
  const horasCurso = new Map();
  for (const c of d.cargas) {
    const idDoc = Number(c.docente_id ?? c.docente?.id);
    const idCurso = Number(c.curso_id ?? c.curso?.id);
    horas.set(idDoc, (horas.get(idDoc) || 0) + Number(c.horas_semanales || 0));
    horasCurso.set(idCurso, (horasCurso.get(idCurso) || 0) + Number(c.horas_semanales || 0));
  }

  const contexto = {
    periodo: d.periodo?.nombre || null,
    jornada: JORNADA,
    docentes: d.docentes.map((x) => ({
      docente: aliasPorId.get(Number(x.id)),
      especialidad: x.especialidad || null,
      horasSemanales: horas.get(Number(x.id)) || 0,
    })),
    cursos: d.cursos.map((c) => ({ curso: nombreCurso(c), nivel: c.nivel, horasAsignadas: horasCurso.get(Number(c.id)) || 0 })),
    cargas: d.cargas.map((c) => ({
      docente: aliasPorId.get(Number(c.docente_id ?? c.docente?.id)),
      asignatura: c.asignatura?.nombre,
      curso: nombreCurso(c.curso),
      horas: c.horas_semanales,
    })),
    asignaturas: d.asignaturas.map((a) => a.nombre),
    totalAulas: d.aulas.length,
  };
  return { contexto, pregunta: seudonimizarPregunta(pregunta, d.docentes, aliasPorId), seudonimos };
}

// Palabras comunes que nunca se reemplazan aunque formen parte de un nombre o apellido
const PALABRAS_COMUNES = new Set(['carga', 'cargas', 'horas', 'clases', 'curso', 'cursos', 'docente', 'docentes',
  'materia', 'materias', 'horario', 'horarios', 'compara', 'cuantas', 'cuantos', 'tiene', 'tienen']);

// Reemplaza en la pregunta (ya normalizada) los nombres de docentes por su alias
function seudonimizarPregunta(q, docentes, aliasPorId) {
  const variantes = [];
  for (const x of docentes) {
    const alias = aliasPorId.get(Number(x.id));
    const completo = normalizar(`${x.nombres} ${x.apellidos}`);
    const partes = [completo, normalizar(x.apellidos), normalizar(x.nombres), ...completo.split(' ')];
    for (const v of partes) if (v && v.length >= 4 && !PALABRAS_COMUNES.has(v)) variantes.push([v, alias]);
  }
  variantes.sort((a, b) => b[0].length - a[0].length); // primero las más largas
  let salida = ` ${q} `;
  for (const [v, alias] of variantes) salida = salida.split(` ${v} `).join(` ${alias} `);
  return salida.replace(/(DOC-\d{2})(?: \1)+/g, '$1').trim(); // «DOC-01 DOC-01» → «DOC-01»
}

// Cambia los alias de la respuesta por los nombres reales
export function restituir(texto, seudonimos) {
  return texto.replace(/DOC-\d{2}/g, (a) => seudonimos.get(a) || a);
}
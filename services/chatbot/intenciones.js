// services/chatbot/intenciones.js
// ✅ C-01 a C-17 · Reglas del chatbot (trasladadas del frontend).
//    Cada función devuelve el texto de la respuesta, o null si ninguna regla coincide
//    (en ese caso la pregunta pasa a la IA).
import {
  DIAS, normalizar, diaHoyEcuador, plural, listar,
  nombreDocente, nombreCurso, labelDia, ordenDia,
} from './texto.js';

// Horario institucional (cámbialo aquí si la institución lo modifica)
export const JORNADA =
  'Horario de la jornada (lunes a viernes):\n' +
  '• Entrada: 07:30 para todos\n' +
  '• Escuela (Inicial a 7mo): recreo 10:00–10:30, salida 12:00\n' +
  '• Colegio (8vo a 3ro BGU): recreo 10:30–10:50, salida 13:05';

// Palabras que no son nombres de docentes
const NO_NOMBRES = new Set([
  'docente', 'docentes', 'profesor', 'profesora', 'profe', 'carga', 'horas', 'clases',
  'tiene', 'tienen', 'que', 'cual', 'cuantas', 'cuantos', 'del', 'los', 'las', 'con', 'para',
]);

// ==========================================================
// C-01 a C-03 · Para los dos roles
// ==========================================================
export function respuestaComun(q, esAdmin) {
  if (/^(hola|buen|saludos|hey)/.test(q)) {
    return '¡Hola! ¿En qué te ayudo? Toca una de las sugerencias o escríbeme tu pregunta.';
  }
  if (q.includes('gracias')) {
    return '¡Con gusto! Si necesitas algo más, aquí estoy. 😊';
  }
  if (/(ayuda|que puedes|que sabes|que haces)/.test(q)) {
    return esAdmin
      ? 'Puedo ayudarte con:\n• Docentes sin carga horaria\n• Cursos sin materias\n• La carga de un docente (ej: "carga de Lorena Erazo")\n• Materias de un curso (ej: "materias de 8vo A")\n• Quién da una materia (ej: "quién da Inglés")\n• Quién tiene más horas\n• Resumen del sistema\n• Horario de la jornada y recreos\nTambién puedes preguntarme otras cosas sobre cargas y horarios.'
      : 'Puedo ayudarte con:\n• Tus clases de un día (ej: "clases del jueves")\n• Tus clases de hoy o mañana\n• Cuándo das una materia\n• Tus clases en un curso (ej: "clases en 8vo")\n• Tus horas semanales\n• Horario de la jornada y recreos\nTambién puedes preguntarme otras cosas sobre tu horario.';
  }
  if (/(recreo|receso|salida|hora de entrada|jornada|a que hora (salen|entran|terminan))/.test(q)) {
    return JORNADA;
  }
  return null;
}

// ==========================================================
// C-04 a C-09 · DOCENTE: solo sus datos (datos = getMisClases)
// ==========================================================
export function reglasDocente(q, datos) {
  const misClases = datos.clases || [];
  const misCargas = datos.cargas || [];
  const misHoras = datos.totalHoras || 0;

  if (misClases.length === 0 && misCargas.length === 0) {
    return 'Todavía no tienes clases ni carga horaria registradas. Cuando la coordinación publique el horario podré ayudarte. 🙂';
  }

  if (/(cuantas horas|mis horas|mi carga|cuantas materias)/.test(q)) {
    const lineas = misCargas.map((c) => `• ${c.asignatura} · ${c.curso} → ${c.horas_semanales} h`);
    return `Tienes ${misHoras} horas semanales en ${plural(misCargas.length, 'materia', 'materias')}:\n${lineas.join('\n')}`;
  }

  const dia = detectarDia(q);
  if (dia?.finDeSemana) return `${dia.prefijo} es fin de semana, no tienes clases. 🎉`;

  const materia = detectarMateria(q, misClases.map((c) => c.asignatura));
  const curso = detectarCurso(q);

  if (!dia && !materia && !curso) return null; // ← ninguna regla: pasa a la IA

  let lista = misClases;
  if (dia) lista = lista.filter((c) => c.dia === dia.clave);
  if (materia) lista = lista.filter((c) => normalizar(c.asignatura) === normalizar(materia));
  if (curso) {
    const buscado = curso.paralelo ? `${curso.grado} ${curso.paralelo}` : curso.grado;
    lista = lista.filter((c) => normalizar(c.curso).startsWith(buscado));
  }

  const quePide = [materia || '', curso ? `en ${curso.texto}` : ''].filter(Boolean).join(' ');

  if (lista.length === 0) {
    return dia
      ? `${dia.prefijo} no tienes ${quePide ? 'clases de ' + quePide : 'clases'}. 🎉`
      : `No encontré clases de ${quePide} en tu horario.`;
  }

  lista = [...lista].sort((a, b) =>
    (ordenDia(a.dia) - ordenDia(b.dia)) || a.hora_inicio.localeCompare(b.hora_inicio));

  if (dia && /(primera|empiez|entro|inicio)/.test(q)) {
    const c = lista[0];
    return `${dia.prefijo} tu primera clase es a las ${c.hora_inicio}: ${c.asignatura} con ${c.curso}${c.aula ? ' en ' + c.aula : ''}.`;
  }

  const lineas = lista.map((c) =>
    `• ${dia ? '' : labelDia(c.dia) + ' '}${c.hora_inicio}–${c.hora_fin}  ${c.asignatura} · ${c.curso}${c.aula ? ' · ' + c.aula : ''}`);

  const cuantas = plural(lista.length, 'clase', 'clases');
  const encabezado = dia
    ? `${dia.prefijo} tienes ${cuantas}${quePide ? ' de ' + quePide : ''}:`
    : `Tienes ${cuantas} de ${quePide} por semana:`;

  return `${encabezado}\n${lineas.join('\n')}`;
}

// ==========================================================
// C-10 a C-17 · ADMINISTRADOR: datos del sistema
//   datos = { docentes, cursos, asignaturas, aulas, cargas }
// ==========================================================
export function reglasAdmin(q, datos) {
  const { docentes = [], cursos = [], asignaturas = [], aulas = [], cargas = [] } = datos;

  const horasPorDocente = new Map();
  const cursosConCarga = new Set();
  for (const c of cargas) {
    const id = Number(c.docente_id ?? c.docente?.id);
    horasPorDocente.set(id, (horasPorDocente.get(id) || 0) + Number(c.horas_semanales || 0));
    cursosConCarga.add(Number(c.curso_id ?? c.curso?.id));
  }
  const docentesSinCarga = docentes.filter((d) => !horasPorDocente.has(Number(d.id)));
  const cursosSinMaterias = cursos.filter((c) => !cursosConCarga.has(Number(c.id)));
  const totalHoras = cargas.reduce((s, c) => s + Number(c.horas_semanales || 0), 0);

  const resumen = () => 'Resumen del sistema:\n' +
    `• Docentes: ${docentes.length} (${docentesSinCarga.length} sin carga)\n` +
    `• Cursos: ${cursos.length} (${cursosSinMaterias.length} sin materias)\n` +
    `• Asignaturas: ${asignaturas.length}\n` +
    `• Aulas: ${aulas.length}\n` +
    `• Cargas horarias: ${cargas.length} (${totalHoras} h semanales)`;

  // C-11 · Cursos sin materias
  if (/(sin materias|no tienen materias|cursos sin)/.test(q)) {
    if (cursosSinMaterias.length === 0) return 'Todos los cursos tienen al menos una materia asignada. ✅';
    return `Hay ${plural(cursosSinMaterias.length, 'curso', 'cursos')} sin materias asignadas:\n` +
      listar(cursosSinMaterias.map((c) => `• ${nombreCurso(c)} · ${c.nivel}`));
  }

  // C-10 · Docentes sin carga
  if (/(sin carga|no tienen carga|no tiene carga)/.test(q)) {
    if (docentesSinCarga.length === 0) return 'Todos los docentes tienen carga horaria asignada. ✅';
    return `Hay ${plural(docentesSinCarga.length, 'docente', 'docentes')} sin carga horaria:\n` +
      listar(docentesSinCarga.map((d) => `• ${nombreDocente(d)}`));
  }

  // C-12 · Quién tiene más horas
  if (/(mas horas|mayor carga|mas carga)/.test(q)) {
    const top = docentes
      .filter((d) => horasPorDocente.has(Number(d.id)))
      .sort((a, b) => horasPorDocente.get(Number(b.id)) - horasPorDocente.get(Number(a.id)))
      .slice(0, 5);
    if (top.length === 0) return 'Todavía no hay cargas horarias registradas.';
    return 'Docentes con más horas semanales:\n' +
      top.map((d, i) => `${i + 1}. ${nombreDocente(d)} → ${horasPorDocente.get(Number(d.id))} h`).join('\n');
  }

  // C-13 · Conteos (si no reconoce qué contar, sigue con las demás reglas)
  if (/cuant/.test(q)) {
    if (/(docente|profesor)/.test(q)) {
      return `Hay ${plural(docentes.length, 'docente registrado', 'docentes registrados')} (${docentesSinCarga.length} sin carga horaria).`;
    }
    if (q.includes('curso')) {
      return `Hay ${plural(cursos.length, 'curso', 'cursos')} (${cursosSinMaterias.length} sin materias asignadas).`;
    }
    if (/(asignatura|materia)/.test(q)) {
      return `Hay ${plural(asignaturas.length, 'asignatura registrada', 'asignaturas registradas')}.`;
    }
    if (q.includes('aula')) {
      return `Hay ${plural(aulas.length, 'aula registrada', 'aulas registradas')}.`;
    }
    if (q.includes('carga')) {
      return `Hay ${plural(cargas.length, 'carga horaria', 'cargas horarias')} (${totalHoras} h semanales en total).`;
    }
  }

  // C-14 · Resumen
  if (/(resumen|estado del sistema|como va|como esta)/.test(q)) {
    return resumen();
  }

  // C-15 · Carga de un docente (por nombre)
  const { candidatos, mismasPalabras } = detectarDocentes(q, docentes);
  if (candidatos.length > 1) {
    // Docentes distintos nombrados a la vez (p. ej. una comparación) → pasa a la IA
    if (!mismasPalabras) return null;
    return 'Encontré varios docentes con ese nombre:\n' +
      candidatos.map((d) => `• ${nombreDocente(d)}`).join('\n') + '\n¿A cuál te refieres? Escribe nombre y apellido.';
  }
  if (candidatos.length === 1) {
    const d = candidatos[0];
    const suyas = cargas.filter((c) => Number(c.docente_id ?? c.docente?.id) === Number(d.id));
    if (suyas.length === 0) return `${nombreDocente(d)} todavía no tiene carga horaria asignada.`;
    const total = suyas.reduce((s, c) => s + Number(c.horas_semanales || 0), 0);
    return `${nombreDocente(d)} tiene ${total} h semanales en ${plural(suyas.length, 'materia', 'materias')}:\n` +
      suyas.map((c) => `• ${c.asignatura?.nombre} · ${nombreCurso(c.curso)} → ${c.horas_semanales} h`).join('\n');
  }

  // C-16 · Materias de un curso
  const curso = detectarCurso(q);
  if (curso) {
    const encontrados = cursos.filter((c) =>
      normalizar(c.grado) === curso.grado && (!curso.paralelo || normalizar(c.paralelo) === curso.paralelo));
    if (encontrados.length === 0) return `No encontré el curso ${curso.texto}.`;

    const ids = new Set(encontrados.map((c) => Number(c.id)));
    const delCurso = cargas.filter((c) => ids.has(Number(c.curso_id ?? c.curso?.id)));
    const etiqueta = curso.paralelo ? curso.texto : `${curso.texto} (todos los paralelos)`;

    if (delCurso.length === 0) return `${etiqueta} todavía no tiene materias asignadas.`;
    const horasCurso = delCurso.reduce((s, c) => s + Number(c.horas_semanales || 0), 0);
    return `Materias de ${etiqueta} (${horasCurso} h semanales):\n` + listar(delCurso.map((c) =>
      `• ${c.asignatura?.nombre}${curso.paralelo ? '' : ' · ' + nombreCurso(c.curso)} → ${nombreDocente(c.docente)} (${c.horas_semanales} h)`), 15);
  }

  // C-17 · Quién da una materia
  const materia = detectarMateria(q, asignaturas.map((a) => a.nombre));
  if (materia) {
    const deMateria = cargas.filter((c) => normalizar(c.asignatura?.nombre) === normalizar(materia));
    if (deMateria.length === 0) return `Nadie tiene asignada ${materia} todavía.`;
    return `${materia} la dan:\n` + listar(deMateria.map((c) =>
      `• ${nombreCurso(c.curso)} → ${nombreDocente(c.docente)} (${c.horas_semanales} h)`), 15);
  }

  return null; // ← ninguna regla: pasa a la IA
}

// ==========================================================
// DETECTORES
// ==========================================================
function detectarDia(q) {
  const hoy = diaHoyEcuador(); // ✅ hora de Ecuador, no la del servidor
  let indice = null;
  let prefijo = '';

  if (q.includes('pasado manana')) { indice = (hoy + 2) % 7; prefijo = 'Pasado mañana'; }
  else if (q.includes('manana')) { indice = (hoy + 1) % 7; prefijo = 'Mañana'; }
  else if (q.includes('hoy')) { indice = hoy; prefijo = 'Hoy'; }

  if (indice !== null) {
    if (indice === 0 || indice === 6) return { clave: '', prefijo, finDeSemana: true };
    const d = DIAS[indice - 1];
    return { clave: d.clave, prefijo: `${prefijo} (${d.label})` };
  }

  const encontrado = DIAS.find((d) => q.includes(normalizar(d.label)));
  if (encontrado) return { clave: encontrado.clave, prefijo: `El ${encontrado.label}` };

  if (q.includes('sabado') || q.includes('domingo')) {
    return { clave: '', prefijo: 'Ese día', finDeSemana: true };
  }
  return null;
}

// Ej: "8vo", "8vo a", "1ro bgu b", "inicial"
function detectarCurso(q) {
  const m = q.match(/\b(inicial|\d{1,2}(?:ro|do|to|vo|no|mo))(\s+bgu)?(?:\s+([a-d]))?(?=\s|$)/);
  if (!m) return null;
  const grado = m[1] + (m[2] ? ' bgu' : '');
  const paralelo = m[3] || null;
  const texto = `${grado.replace('bgu', 'BGU')}${paralelo ? ' ' + paralelo.toUpperCase() : ''}`;
  return { grado, paralelo, texto };
}

// Devuelve el nombre original de la materia mencionada (acepta singular/plural)
function detectarMateria(q, nombres) {
  const unicos = [...new Set(nombres.filter(Boolean))].sort((a, b) => b.length - a.length);
  return unicos.find((n) => {
    const raiz = normalizar(n).replace(/s$/, '');
    return raiz.length >= 3 && q.includes(raiz);
  }) || null;
}

// Docentes cuyo nombre o apellido aparece en la pregunta.
// mismasPalabras = true si todos los candidatos coinciden con las MISMAS palabras
// (p. ej. dos "María") → hay que pedir que precise; si no, son docentes distintos nombrados a la vez.
function detectarDocentes(q, docentes) {
  const palabras = new Set(q.split(' '));
  let mejor = 0;
  let candidatos = [];
  const coincidencias = new Map();

  for (const d of docentes) {
    const partes = normalizar(`${d.nombres} ${d.apellidos}`).split(' ')
      .filter((p) => p.length >= 3 && !NO_NOMBRES.has(p));
    const encontradas = partes.filter((p) => palabras.has(p));
    const puntos = encontradas.length;
    coincidencias.set(d.id, encontradas.sort().join(' '));

    if (puntos > mejor) { mejor = puntos; candidatos = [d]; }
    else if (puntos === mejor && puntos > 0) { candidatos.push(d); }
  }
  const claves = new Set(candidatos.map((d) => coincidencias.get(d.id)));
  return { candidatos, mismasPalabras: claves.size <= 1 };
}
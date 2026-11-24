// services/chatbot/chatbot.service.js
// ✅ Orquestador del chatbot híbrido (A2.6):
//    filtro → comunes → datos del rol → reglas → IA → respaldo
import HorarioService from '../horario.service.js';
import DocenteService from '../docente.service.js';
import CursoService from '../curso.service.js';
import AsignaturaService from '../asignatura.service.js';
import AulaService from '../aula.service.js';
import CargaHorariaService from '../cargaHoraria.service.js';
import PeriodoService from '../periodo.service.js';
import { normalizar } from './texto.js';
import { pidePrivado, RESPUESTA_FUERA_DE_ALCANCE } from './privacidad.js';
import { respuestaComun, reglasDocente, reglasAdmin } from './intenciones.js';
import { contextoDocente, contextoAdmin, restituir } from './contexto.js';
import { preguntarIA } from './openai.client.js';

const horarios = new HorarioService();
const json = (lista) => lista.map((x) => (x?.toJSON ? x.toJSON() : x));

export const SUGERENCIAS = {
  ADMINISTRADOR: ['¿Qué docentes no tienen carga?', '¿Qué cursos no tienen materias?', '¿Quién tiene más horas?', 'Resumen del sistema', '¿A qué hora es el recreo?'],
  DOCENTE: ['¿Qué clases tengo hoy?', '¿Y mañana?', '¿Cuántas horas tengo?', '¿A qué hora es el recreo?'],
};

const RESPALDO = 'Por ahora no puedo responder esa pregunta. Prueba con una de las sugerencias o escríbela de otra forma.';

// ✅ Estadísticas en memoria (sin el texto de las preguntas): sirven para la evaluación del OE4
const estadisticas = { regla: 0, ia: 0, respaldo: 0, bloqueada: 0, desde: new Date().toISOString() };
export function obtenerEstadisticas() {
  const total = estadisticas.regla + estadisticas.ia + estadisticas.respaldo + estadisticas.bloqueada;
  return { ...estadisticas, total };
}

// Datos del ADMINISTRADOR: solo las cargas del periodo actual
async function datosAdmin() {
  const periodo = await new PeriodoService().getActual();
  const [docentes, cursos, asignaturas, aulas, cargas] = await Promise.all([
    new DocenteService().getAll(), new CursoService().getAll(), new AsignaturaService().getAll(),
    new AulaService().getAll(), new CargaHorariaService().getAll(),
  ]);
  const cargasPeriodo = json(cargas).filter((c) => !periodo || Number(c.periodo_id) === Number(periodo.id));
  return {
    periodo: periodo ? { id: periodo.id, nombre: periodo.nombre } : null,
    docentes: json(docentes), cursos: json(cursos), asignaturas: json(asignaturas), aulas: json(aulas),
    cargas: cargasPeriodo,
  };
}

export async function responder(usuario, mensaje, deps = {}) {
  const ia = deps.preguntarIA || preguntarIA;
  const esAdmin = usuario.rol === 'ADMINISTRADOR';
  const sugerencias = SUGERENCIAS[esAdmin ? 'ADMINISTRADOR' : 'DOCENTE'];
  const salida = (respuesta, origen) => {
    estadisticas[origen] += 1;
    return { respuesta, origen: origen === 'bloqueada' ? 'regla' : origen, sugerencias };
  };

  const q = normalizar(mensaje);

  // 1. C-20 · Filtro de privacidad (antes de consultar nada)
  if (pidePrivado(q)) return salida(RESPUESTA_FUERA_DE_ALCANCE, 'bloqueada');

  // 2. C-01 a C-03 · Comunes
  const comun = respuestaComun(q, esAdmin);
  if (comun) return salida(comun, 'regla');

  // 3. Datos que ese rol puede ver
  const datos = deps.datos || (esAdmin ? await datosAdmin() : await horarios.getMisClases(usuario.id));

  // 4. C-04 a C-17 · Reglas
  const regla = esAdmin ? reglasAdmin(q, datos) : reglasDocente(q, datos);
  if (regla) return salida(regla, 'regla');

  // 5. C-18 / C-19 · IA con contexto mínimo
  try {
    const { contexto, pregunta, seudonimos } = esAdmin ? contextoAdmin(datos, q) : contextoDocente(datos, q);
    const texto = await ia(contexto, pregunta);
    return salida(restituir(texto, seudonimos), 'ia');
  } catch (error) {
    // 6. Respaldo (no se registra el texto de la pregunta)
    console.warn('Chatbot: respaldo por fallo de la IA →', error.message);
    return salida(RESPALDO, 'respaldo');
  }
}
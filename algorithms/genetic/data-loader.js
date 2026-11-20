// algorithms/genetic/data-loader.js
import CargaHoraria from '../../models/cargaHoraria.model.js';
import Aula from '../../models/aula.model.js';
import Disponibilidad from '../../models/disponibilidad.model.js';
import BloqueHorario from '../../models/bloqueHorario.model.js';
import Curso from '../../models/curso.model.js';
import Horario from '../../models/horario.model.js';
import DetalleHorario from '../../models/detalleHorario.model.js';

// ✅ RB-03: la escuela (Inicial a 7mo) y el colegio (8vo a 3ro BGU) son secciones distintas
export function seccionDe(tipoEducacion) {
  return tipoEducacion === 'ESCUELA' ? 'ESCUELA' : 'COLEGIO';
}

// ✅ A2.5: de cada curso solo cuenta UN horario vigente (el publicado o, si no hay, el más reciente).
// Así las versiones viejas o de prueba no bloquean dos veces a los mismos docentes.
export function elegirHorariosVigentes(horarios, detalles) {
  const horarioPorId = new Map(horarios.map(h => [h.id, h]));
  const horariosPorCurso = new Map(); // cursoId -> Set(horarioId)

  for (const d of detalles) {
    const cursoId = d.carga_horaria?.curso_id;
    if (!cursoId || !horarioPorId.has(d.horario_id)) continue;
    if (!horariosPorCurso.has(cursoId)) horariosPorCurso.set(cursoId, new Set());
    horariosPorCurso.get(cursoId).add(d.horario_id);
  }

  const vigentePorCurso = new Map(); // cursoId -> horarioId
  for (const [cursoId, ids] of horariosPorCurso) {
    const candidatos = [...ids].map(id => horarioPorId.get(id));
    candidatos.sort((a, b) => (Number(!!b.publicado) - Number(!!a.publicado)) || (b.id - a.id));
    vigentePorCurso.set(cursoId, candidatos[0].id);
  }
  return vigentePorCurso;
}

export async function cargarDatos(periodoId = 1, jornadaId = 1, cursoId = null, escenario = 'General') {
  
  // 1. Cargar cargas horarias (Si hay cursoId, filtramos solo ese curso)
  const whereCarga = { periodo_id: periodoId, estado: true };
  if (cursoId) {
    whereCarga.curso_id = cursoId;
  }

  const cargas = await CargaHoraria.findAll({
    where: whereCarga,
    include: [
      { association: 'docente' },
      ({ association: 'asignatura', where: { estado: true } }),
      { association: 'curso' },
    ],
  });

  if (cargas.length === 0) {
    throw new Error('No hay cargas horarias registradas para este curso o período');
  }

  // 2. Determinar el tipo de educación del curso
  let tipoEducacion = 'BASICA';
  if (cursoId) {
    const curso = await Curso.findByPk(cursoId);
    tipoEducacion = curso?.tipo_educacion || 'BASICA';
  } else {
    tipoEducacion = cargas[0].curso?.tipo_educacion || 'BASICA';
  }

  // 3. Cargar los bloques horarios reales de la base de datos
  const bloquesDB = await BloqueHorario.findAll({
    where: { 
      tipo_educacion: tipoEducacion,
      tipo: 'CLASE',
      estado: true,
    },
    order: [['orden', 'ASC']],
  });

  const bloques = bloquesDB.map(b => ({
    inicio: b.hora_inicio.substring(0, 5),
    fin: b.hora_fin.substring(0, 5),
  }));

  // 4. Cargar aulas
  const aulas = await Aula.findAll({ where: { estado: true } });

  // 5. Cargar disponibilidades docentes
  const disponibilidadesRaw = await Disponibilidad.findAll({
    where: { disponible: true },
  });

  const disponibilidades = disponibilidadesRaw.map(d => ({
    docenteId: d.docente_id,
    dia: d.dia_semana,
    horaInicio: d.hora_inicio,
    horaFin: d.hora_fin,
  }));

  // =========================================================
  // 6. Cargar horarios ocupados de OTROS cursos
  //    ✅ A2.5: mismo período y escenario, y una sola versión por curso
  // =========================================================
  const horariosGuardados = await Horario.findAll({
    where: { periodo_id: periodoId, escenario, estado: true }
  });

  const horarioIds = horariosGuardados.map(h => h.id);

  const clasesOcupadas = [];
  if (horarioIds.length > 0) {
    const detallesGuardados = await DetalleHorario.findAll({
      where: { horario_id: horarioIds },
      include: [{ association: 'carga_horaria', include: [{ association: 'curso' }] }] // ✅ curso para saber su sección
    });

    const nombreHorario = new Map(horariosGuardados.map(h => [h.id, h.nombre]));
    const vigentePorCurso = elegirHorariosVigentes(horariosGuardados, detallesGuardados);

    for (const d of detallesGuardados) {
      // ✅ A2.5: solo el horario vigente de cada curso ocupa a sus docentes
      if (vigentePorCurso.get(d.carga_horaria.curso_id) !== d.horario_id) continue;
      // El horario anterior del mismo curso no ocupa a sus docentes: se va a reemplazar
      if (cursoId && d.carga_horaria.curso_id === Number(cursoId)) continue;
      const cursoOcupado = d.carga_horaria.curso;
      const seccionOcupada = seccionDe(cursoOcupado?.tipo_educacion);

      clasesOcupadas.push({
        docenteId: d.carga_horaria.docente_id,
        dia: d.dia_semana,
        horaInicio: d.hora_inicio.substring(0, 5),
        horaFin: d.hora_fin.substring(0, 5),
        // ✅ RB-03: datos para el aviso y la prioridad
        seccion: seccionOcupada,
        curso: cursoOcupado ? `${cursoOcupado.grado} "${cursoOcupado.paralelo}"` : '',
        horario: nombreHorario.get(d.horario_id) || '',
        // Si se genera un curso del COLEGIO y esta clase es de la ESCUELA,
        // el colegio tiene prioridad: el cruce no bloquea, solo se avisa.
        cruceBlando: seccionDe(tipoEducacion) === 'COLEGIO' && seccionOcupada === 'ESCUELA',
      });
    }
  }

  console.log(`📚 Cargas: ${cargas.length} | Bloques: ${bloques.length} | Tipo: ${tipoEducacion}`);
  console.log(`🔒 Clases ya ocupadas en otros cursos: ${clasesOcupadas.length} (escenario ${escenario}, una versión por curso)`);

  return {
    cargas,
    aulas,
    disponibilidades,
    bloques,
    tipoEducacion,
    seccion: seccionDe(tipoEducacion), // ✅ RB-03
    clasesOcupadas
  };
}

export function obtenerDias() {
  return ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
}
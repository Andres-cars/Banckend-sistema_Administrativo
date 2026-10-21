// algorithms/genetic/data-loader.js
import CargaHoraria from '../../models/cargaHoraria.model.js';
import Aula from '../../models/aula.model.js';
import Disponibilidad from '../../models/disponibilidad.model.js';
import BloqueHorario from '../../models/bloqueHorario.model.js';
import Curso from '../../models/curso.model.js';
import Horario from '../../models/horario.model.js';
import DetalleHorario from '../../models/detalleHorario.model.js';

export async function cargarDatos(periodoId = 1, jornadaId = 1, cursoId = null) {
  
  // 1. Cargar cargas horarias (Si hay cursoId, filtramos solo ese curso)
  const whereCarga = { periodo_id: periodoId, estado: true };
  if (cursoId) {
    whereCarga.curso_id = cursoId;
  }

  const cargas = await CargaHoraria.findAll({
    where: whereCarga,
    include: [
      { association: 'docente' },
      { association: 'asignatura' },
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
  // ✅ 6. NUEVO: Cargar horarios ocupados de OTROS cursos
  // =========================================================
  // Buscamos todos los horarios guardados de este período
  const horariosGuardados = await Horario.findAll({
    where: { periodo_id: periodoId, estado: true }
  });

  const horarioIds = horariosGuardados.map(h => h.id);

  const clasesOcupadas = [];
  if (horarioIds.length > 0) {
    const detallesGuardados = await DetalleHorario.findAll({
      where: { horario_id: horarioIds },
      include: [{ association: 'carga_horaria' }]
    });

    for (const d of detallesGuardados) {
      clasesOcupadas.push({
        docenteId: d.carga_horaria.docente_id,
        dia: d.dia_semana,
        horaInicio: d.hora_inicio.substring(0, 5),
        horaFin: d.hora_fin.substring(0, 5),
      });
    }
  }

  console.log(`📚 Cargas: ${cargas.length} | Bloques: ${bloques.length} | Tipo: ${tipoEducacion}`);
  console.log(`🔒 Clases ya ocupadas en otros cursos: ${clasesOcupadas.length}`);

  return {
    cargas,
    aulas,
    disponibilidades,
    bloques,
    tipoEducacion,
    clasesOcupadas // ✅ Enviamos las clases ocupadas al algoritmo
  };
}

export function obtenerDias() {
  return ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
}
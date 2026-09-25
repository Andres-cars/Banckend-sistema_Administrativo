// src/algorithms/genetic/data-loader.js
import CargaHoraria from '../../models/cargaHoraria.model.js';
import Aula from '../../models/aula.model.js';
import Disponibilidad from '../../models/disponibilidad.model.js';
import Jornada from '../../models/jornada.model.js';

/**
 * Carga todos los datos necesarios para el algoritmo
 */
export async function cargarDatos(periodoId = 1, jornadaId = 1) {
  
  // 1. Cargar cargas horarias
  const cargas = await CargaHoraria.findAll({
    where: { periodo_id: periodoId, estado: true },
    include: [
      { association: 'docente' },
      { association: 'asignatura' },
      { association: 'curso' },
    ],
  });

  // 2. Cargar aulas
  const aulas = await Aula.findAll({
    where: { estado: true },
  });

  // 3. Cargar disponibilidades
  const disponibilidadesRaw = await Disponibilidad.findAll({
    where: { disponible: true },
  });

  const disponibilidades = disponibilidadesRaw.map(d => ({
    docenteId: d.docente_id,
    dia: d.dia_semana,
    horaInicio: d.hora_inicio,
    horaFin: d.hora_fin,
  }));

  // 4. Cargar jornada
  const jornada = await Jornada.findByPk(jornadaId);

  return {
    cargas,
    aulas,
    disponibilidades,
    jornada,
  };
}

/**
 * Genera los bloques horarios según la jornada
 * Ej: Jornada 07:00 - 13:00 → bloques de 1 hora
 */
export function generarBloquesHorarios(jornada, duracionBloque = 60) {
  const bloques = [];
  const [horaIni] = jornada.hora_inicio.split(':').map(Number);
  const [horaFin] = jornada.hora_fin.split(':').map(Number);

  let hora = horaIni;
  while (hora + duracionBloque / 60 <= horaFin) {
    const inicio = `${String(hora).padStart(2, '0')}:00`;
    const fin = `${String(hora + duracionBloque / 60).padStart(2, '0')}:00`;
    bloques.push({ inicio, fin });
    hora += duracionBloque / 60;
  }

  return bloques;
}

/**
 * Genera los días de la semana
 */
export function obtenerDias() {
  return ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];
}
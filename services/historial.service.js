// services/historial.service.js
// ✅ RN-12: registrar y consultar el historial de cambios
import HistorialCambio from '../models/historialCambio.model.js';
import Usuario from '../models/usuario.model.js';

class HistorialService {

  // 📝 Registrar un cambio.
  // Nunca lanza error: si falla el registro, la operación principal sigue funcionando.
  async registrar({ usuarioId = null, tabla, registroId, accion, descripcion }) {
    try {
      await HistorialCambio.create({
        usuario_id: usuarioId || null,
        tabla,
        registro_id: registroId,
        accion,
        descripcion: String(descripcion || '').slice(0, 500),
      });
    } catch (error) {
      console.error('⚠️ No se pudo registrar el historial:', error.message);
    }
  }

  // 📋 Listar el historial (lo más reciente primero)
  async getAll({ tabla = null, limite = 500 } = {}) {
    const where = {};
    if (tabla) where.tabla = tabla;

    return await HistorialCambio.findAll({
      where,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'usuario'] }],
      order: [['fecha', 'DESC'], ['id', 'DESC']],
      limit: Math.min(Number(limite) || 500, 2000),
    });
  }

  // 🧾 Texto corto para describir una carga horaria
  // Ej: Matemática · 8vo "A" · Lorena Erazo (5 h)
  describirCarga(carga) {
    if (!carga) return 'carga horaria';
    const asignatura = carga.asignatura?.nombre || `asignatura ${carga.asignatura_id}`;
    const curso = carga.curso ? `${carga.curso.grado} "${carga.curso.paralelo}"` : `curso ${carga.curso_id}`;
    const docente = carga.docente
      ? `${carga.docente.nombres} ${carga.docente.apellidos}`
      : `docente ${carga.docente_id}`;
    return `${asignatura} · ${curso} · ${docente} (${carga.horas_semanales} h)`;
  }

  // 🔍 Qué cambió entre la carga anterior y la nueva
  // Ej: horas 5 → 6; docente Ana Pérez → Luis Mora
  cambiosCarga(antes, despues) {
    const cambios = [];
    const nombreDocente = d => (d ? `${d.nombres} ${d.apellidos}` : '—');
    const nombreCurso = c => (c ? `${c.grado} "${c.paralelo}"` : '—');

    if (Number(antes.horas_semanales) !== Number(despues.horas_semanales)) {
      cambios.push(`horas ${antes.horas_semanales} → ${despues.horas_semanales}`);
    }
    if (antes.docente_id !== despues.docente_id) {
      cambios.push(`docente ${nombreDocente(antes.docente)} → ${nombreDocente(despues.docente)}`);
    }
    if (antes.asignatura_id !== despues.asignatura_id) {
      cambios.push(`asignatura ${antes.asignatura?.nombre || '—'} → ${despues.asignatura?.nombre || '—'}`);
    }
    if (antes.curso_id !== despues.curso_id) {
      cambios.push(`curso ${nombreCurso(antes.curso)} → ${nombreCurso(despues.curso)}`);
    }
    if (antes.periodo_id !== despues.periodo_id) {
      cambios.push(`periodo ${antes.periodo?.nombre || antes.periodo_id} → ${despues.periodo?.nombre || despues.periodo_id}`);
    }
    return cambios.length ? cambios.join('; ') : 'sin cambios en los datos';
  }
}

export default HistorialService;
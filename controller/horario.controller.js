import HorarioService from '../services/horario.service.js';
import HistorialService from '../services/historial.service.js'; // ✅ RN-12

const horarioService = new HorarioService();
const historial = new HistorialService(); // ✅ RN-12

// 🧬 Generar horario (sin guardar)
export const generar = async (req, res) => {
  try {
    const { periodoId = 1, jornadaId = 1, cursoId = null  } = req.body;

    const resultado = await horarioService.generar(periodoId, jornadaId, cursoId);

    return res.json({
      success: true,
      message: 'Horario generado correctamente',
      data: resultado,
    });
  } catch (error) {
    console.error('❌ Error al generar horario:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al generar horario',
    });
  }
};

// 💾 Guardar horario
// ✅ HU-12: validar un horario ajustado a mano (no guarda)
export const validar = async (req, res) => {
  try {
    const { periodoId, cursoId, clases } = req.body;
    if (!cursoId || !Array.isArray(clases)) {
      return res.status(400).json({ success: false, message: 'Curso y clases son obligatorios' });
    }
    const data = await horarioService.validar(periodoId, cursoId, clases);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error al validar horario:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error al validar el horario' });
  }
};

// 💾 Guardar horario (✅ HU-12: valida antes de guardar y registra los ajustes manuales)
export const guardar = async (req, res) => {
  try {
    const { periodoId, jornadaId, nombre, clases, cursoId = null, ajustesManuales = 0 } = req.body;

    if (!nombre || !clases || !Array.isArray(clases)) {
      return res.status(400).json({ success: false, message: 'Nombre y clases son obligatorios' });
    }

    const resultado = await horarioService.guardar(periodoId, jornadaId, nombre, clases, cursoId);

    // ✅ RN-12: registrar en el historial, indicando los ajustes manuales (HU-12)
    const ajustes = Number(ajustesManuales) || 0;
    await historial.registrar({
      usuarioId: req.user?.id,
      tabla: 'horarios',
      registroId: resultado.id,
      accion: 'CREAR',
      descripcion: `Guardó el ${resultado.nombre} como borrador (${resultado.totalClases} clases` +
        (ajustes ? `, ${ajustes} ${ajustes === 1 ? 'ajuste manual' : 'ajustes manuales'})` : ')'),
    });

    return res.status(201).json({ success: true, message: 'Horario guardado correctamente', data: resultado });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message || 'Error al guardar horario',
      detalle: error.detalle,   // ✅ HU-12: cruces que impidieron guardar
    });
  }
};

// 📋 Listar horarios
export const getAll = async (req, res) => {
  try {
    const horarios = await horarioService.getAll();
    return res.json({
      success: true,
      data: horarios,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener horarios',
    });
  }
};

// 🔍 Obtener horario por ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const horario = await horarioService.getById(Number(id));
    return res.json({
      success: true,
      data: horario,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'Horario no encontrado',
    });
  }
};

// 🗑️ Eliminar horario
export const deleteHorario = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await horarioService.delete(Number(id));
    
    // ✅ RN-12: registrar en el historial
    await historial.registrar({
      usuarioId: req.user?.id,
      tabla: 'horarios',
      registroId: Number(id),
      accion: 'ELIMINAR',
      descripcion: `Eliminó el ${result.nombre || '#' + id}${result.estabaPublicado ? ' (estaba publicado)' : ''}`,
    });
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar horario',
    });
  }
};


// 👨‍🏫 Mis clases (solo DOCENTE): su horario y su carga horaria
export const misClases = async (req, res) => {
  try {
    const resultado = await horarioService.getMisClases(req.user.id);
    return res.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'No se pudo obtener tu horario',
    });
  }
};

// 👨‍🏫 Horario de un docente (solo ADMIN)
export const clasesDocente = async (req, res) => {
  try {
    const resultado = await horarioService.getClasesDocente(Number(req.params.docenteId));
    return res.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || 'No se pudo obtener el horario del docente',
    });
  }
};

// 📢 HU-13: Publicar o retirar un horario (solo ADMIN)
export const cambiarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { publicado } = req.body;

    if (typeof publicado !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El campo "publicado" debe ser true o false',
      });
    }

    const resultado = await horarioService.cambiarPublicacion(Number(id), publicado);
    
    // ✅ RN-12: registrar en el historial
    await historial.registrar({
      usuarioId: req.user?.id,
      tabla: 'horarios',
      registroId: resultado.id,
      accion: publicado ? 'PUBLICAR' : 'RETIRAR',
      descripcion: publicado
        ? `Publicó  ${resultado.nombre}` +
          (resultado.retirados?.length ? `; se retiró la versión anterior: ${resultado.retirados.join(', ')}` : '')
        : `Retiró  ${resultado.nombre} (vuelve a borrador)`,
    });

    return res.json({
      success: true,
      message: publicado
        ? 'Horario publicado: los docentes ya pueden verlo'
        : 'Horario retirado: vuelve a ser borrador',
      data: resultado,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al cambiar la publicación',
    });
  }
};
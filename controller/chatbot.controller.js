// controller/chatbot.controller.js
// ✅ Chatbot híbrido: valida el mensaje, limita las consultas y llama al orquestador
import { responder, obtenerEstadisticas } from '../services/chatbot/chatbot.service.js';

const MAX_CARACTERES = 300;
const MAX_POR_MINUTO = 20;
const consultas = new Map(); // usuarioId -> marcas de tiempo del último minuto

export const preguntar = async (req, res) => {
  try {
    const mensaje = (req.body?.mensaje ?? '').toString().trim();
    if (!mensaje) {
      return res.status(400).json({ success: false, message: 'Escribe tu pregunta.' });
    }
    if (mensaje.length > MAX_CARACTERES) {
      return res.status(400).json({ success: false, message: `La pregunta no puede pasar de ${MAX_CARACTERES} caracteres.` });
    }

    const ahora = Date.now();
    const recientes = (consultas.get(req.user.id) || []).filter((t) => ahora - t < 60000);
    if (recientes.length >= MAX_POR_MINUTO) {
      return res.status(429).json({ success: false, message: 'Hiciste muchas preguntas seguidas. Espera un momento.' });
    }
    consultas.set(req.user.id, [...recientes, ahora]);

    const data = await responder(req.user, mensaje);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error en el chatbot:', error.message);
    return res.status(500).json({ success: false, message: 'No pude consultar los datos en este momento.' });
  }
};

// 📊 Cuántas preguntas respondió cada parte (solo ADMIN)
export const estadisticas = (req, res) => {
  return res.json({ success: true, data: obtenerEstadisticas() });
};
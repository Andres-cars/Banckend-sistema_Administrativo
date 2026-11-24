// services/chatbot/texto.js
// Utilidades de texto del chatbot (trasladadas del componente chat-asistente del frontend)

export const DIAS = [
  { clave: 'LUNES', label: 'lunes' },
  { clave: 'MARTES', label: 'martes' },
  { clave: 'MIERCOLES', label: 'miércoles' },
  { clave: 'JUEVES', label: 'jueves' },
  { clave: 'VIERNES', label: 'viernes' },
];

// "¿Qué clases tengo HOY?" → minúsculas, sin tildes ni signos
export function normalizar(texto) {
  return (texto ?? '').toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,"()]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Día de la semana en Ecuador (0 domingo … 6 sábado), aunque el servidor esté en otra zona horaria
export function diaHoyEcuador() {
  const nombre = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Guayaquil' }).format(new Date());
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(nombre);
}

export function plural(n, singular, pluralTexto) {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

export function listar(lineas, max = 10) {
  const visibles = lineas.slice(0, max).join('\n');
  return lineas.length > max ? `${visibles}\n…y ${lineas.length - max} más` : visibles;
}

export function nombreDocente(d) {
  return d ? `${d.nombres || ''} ${d.apellidos || ''}`.trim() : 'Sin docente';
}

export function nombreCurso(c) {
  return c ? `${c.grado} "${c.paralelo}"` : '';
}

export function labelDia(clave) {
  const d = DIAS.find((x) => x.clave === clave);
  return d ? d.label.charAt(0).toUpperCase() + d.label.slice(1) : clave;
}

export function ordenDia(clave) {
  return DIAS.findIndex((d) => d.clave === clave);
}
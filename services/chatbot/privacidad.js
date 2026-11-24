// services/chatbot/privacidad.js
// ✅ C-20 · Filtro previo (LOPDP): se aplica a la pregunta ya normalizada,
//    ANTES de consultar la base de datos o la IA.

const PROHIBIDO = [
  /\b\d{10,13}\b/,                                         // cédulas o RUC
  /[\w.+-]+@[\w-]+\.[\w.]+/,                               // correos
  /(contrasena|password|clave de acceso|token)/,           // credenciales
  /(cedula|identificacion|telefono|celular|direccion)/,     // datos personales
  /(estudiante|alumno|alumna|calificacion|notas?\b|asistencia|representante|matricula)/, // estudiantes
  /\b(crea|crear|elimina|eliminar|borra|borrar|modifica|modificar|edita|editar|publica|publicar|retira|retirar)\b/, // acciones
];

export const RESPUESTA_FUERA_DE_ALCANCE =
  'Solo puedo consultar horarios, cargas horarias, cursos, asignaturas y la jornada. ' +
  'No manejo datos personales, contraseñas ni información de estudiantes, y no realizo cambios en el sistema: ' +
  'para eso usa los módulos correspondientes.';

export function pidePrivado(q) {
  return PROHIBIDO.some((re) => re.test(q));
}
// src/algorithms/genetic/genetic-algorithm.js
import { Chromosome, ClaseAsignada } from './chromosome.js';
import { calcularFitness } from './fitness.js';
import { seleccionTorneo, cruce, mutar, elitismo } from './operators.js';
import { cargarDatos, generarBloquesHorarios, obtenerDias } from './data-loader.js';

/**
 * ALGORITMO GENÉTICO PRINCIPAL
 * 
 * @param {Object} opciones
 * @param {number} opciones.periodoId - ID del período académico
 * @param {number} opciones.jornadaId - ID de la jornada
 * @param {number} opciones.tamañoPoblacion - Tamaño de la población (default: 100)
 * @param {number} opciones.generaciones - Número máximo de generaciones (default: 500)
 * @param {number} opciones.tasaCruce - Tasa de cruce (default: 0.8)
 * @param {number} opciones.tasaMutacion - Tasa de mutación (default: 0.05)
 * @param {number} opciones.fitnessMinimo - Fitness mínimo para detener (default: 95)
 */
export async function generarHorario(opciones = {}) {
  const {
    periodoId = 1,
    jornadaId = 1,
    tamañoPoblacion = 100,
    generaciones = 500,
    tasaCruce = 0.8,
    tasaMutacion = 0.05,
    fitnessMinimo = 95,
  } = opciones;

  console.log('🧬 Iniciando Algoritmo Genético...');

  // ============================================
  // 1. CARGAR DATOS
  // ============================================
  const { cargas, aulas, disponibilidades, jornada } = await cargarDatos(periodoId, jornadaId);

  console.log(`📚 Cargas horarias: ${cargas.length}`);
  console.log(`🏫 Aulas: ${aulas.length}`);
  console.log(`👨‍🏫 Disponibilidades: ${disponibilidades.length}`);

  if (cargas.length === 0) {
    throw new Error('No hay cargas horarias registradas para este período');
  }

  const dias = obtenerDias();
  const bloques = generarBloquesHorarios(jornada);
  const aulaIds = aulas.map(a => a.id);

  // ============================================
  // 2. INICIALIZAR POBLACIÓN
  // ============================================
  let poblacion = [];
  for (let i = 0; i < tamañoPoblacion; i++) {
    poblacion.push(generarIndividuoAleatorio(cargas, dias, bloques, aulaIds));
  }

  // Evaluar población inicial
  for (const ind of poblacion) {
    calcularFitness(ind, disponibilidades);
  }

  // ============================================
  // 3. EVOLUCIÓN
  // ============================================
  let mejorGlobal = null;
  let generacionActual = 0;

  for (generacionActual = 0; generacionActual < generaciones; generacionActual++) {

    // Ordenar población por fitness
    poblacion.sort((a, b) => b.fitness - a.fitness);

    // Guardar el mejor
    const mejorActual = poblacion[0];
    if (!mejorGlobal || mejorActual.fitness > mejorGlobal.fitness) {
      mejorGlobal = mejorActual.clone();
    }

    // Imprimir progreso cada 50 generaciones
    if (generacionActual % 50 === 0) {
      console.log(`Gen ${generacionActual}: Fitness = ${mejorActual.fitness.toFixed(2)}% | Conflictos = ${mejorActual.conflictos}`);
    }

    // ¿Alcanzamos el fitness mínimo?
    if (mejorActual.fitness >= fitnessMinimo) {
      console.log(`✅ Fitness mínimo alcanzado en generación ${generacionActual}`);
      break;
    }

    // ============================================
    // 3.1 ELITISMO
    // ============================================
    const nuevaPoblacion = elitismo(poblacion, 2);

    // ============================================
    // 3.2 SELECCIÓN, CRUCE Y MUTACIÓN
    // ============================================
    while (nuevaPoblacion.length < tamañoPoblacion) {
      
      // Seleccionar padres
      const padre1 = seleccionTorneo(poblacion, 3);
      const padre2 = seleccionTorneo(poblacion, 3);

      // Cruzar
      const [hijo1, hijo2] = cruce(padre1, padre2, tasaCruce);

      // Mutar
      const hijo1Mutado = mutar(hijo1, tasaMutacion, dias, bloques, aulaIds);
      const hijo2Mutado = mutar(hijo2, tasaMutacion, dias, bloques, aulaIds);

      // Evaluar
      calcularFitness(hijo1Mutado, disponibilidades);
      calcularFitness(hijo2Mutado, disponibilidades);

      // Agregar a la nueva población
      nuevaPoblacion.push(hijo1Mutado);
      if (nuevaPoblacion.length < tamañoPoblacion) {
        nuevaPoblacion.push(hijo2Mutado);
      }
    }

    // Actualizar población
    poblacion = nuevaPoblacion;
  }

  // ============================================
  // 4. RESULTADO FINAL
  // ============================================
  console.log(`🏁 Algoritmo finalizado después de ${generacionActual} generaciones`);
  console.log(`📊 Mejor fitness: ${mejorGlobal.fitness.toFixed(2)}%`);
  console.log(`⚠️ Conflictos: ${mejorGlobal.conflictos}`);

  return {
    exito: mejorGlobal.fitness >= fitnessMinimo,
    fitness: mejorGlobal.fitness,
    conflictos: mejorGlobal.conflictos,
    generaciones: generacionActual,
    totalClases: mejorGlobal.clases.length,
    clases: mejorGlobal.clases,
  };
}

// ============================================
// GENERADOR DE INDIVIDUO ALEATORIO
// ============================================
function generarIndividuoAleatorio(cargas, dias, bloques, aulaIds) {
  const clases = [];

  for (const carga of cargas) {
    // Generar una clase por cada hora semanal de la carga
    const horasRequeridas = carga.horas_semanales || 1;

    for (let h = 0; h < horasRequeridas; h++) {
      const dia = dias[Math.floor(Math.random() * dias.length)];
      const bloque = bloques[Math.floor(Math.random() * bloques.length)];
      const aulaId = aulaIds.length > 0 
        ? aulaIds[Math.floor(Math.random() * aulaIds.length)] 
        : null;

      clases.push(new ClaseAsignada(
        carga.id,
        carga.docente_id,
        carga.curso_id,
        carga.asignatura_id,
        aulaId,
        dia,
        bloque.inicio,
        bloque.fin
      ));
    }
  }

  return new Chromosome(clases);
}
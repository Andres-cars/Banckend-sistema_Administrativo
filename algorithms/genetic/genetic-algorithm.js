// algorithms/genetic/genetic-algorithm.js
import { Chromosome, ClaseAsignada } from './chromosome.js';
import { calcularFitness } from './fitness.js';
import { seleccionTorneo, cruce, mutar, elitismo } from './operators.js';
import { cargarDatos, obtenerDias } from './data-loader.js';

export async function generarHorario(opciones = {}) {
  const {
    periodoId = 1,
    jornadaId = 1,
    cursoId = null,
    tamañoPoblacion = 100,
    generaciones = 500,
    tasaCruce = 0.8,
    tasaMutacion = 0.05,
    fitnessMinimo = 95,
  } = opciones;

  console.log('🧬 Iniciando Algoritmo Genético...');
  if (cursoId) console.log(`📚 Curso específico ID: ${cursoId}`);

  // 1. Cargar datos
  const { cargas, aulas, disponibilidades, bloques, tipoEducacion, clasesOcupadas } = 
    await cargarDatos(periodoId, jornadaId, cursoId);

  if (cargas.length === 0) {
    throw new Error('No hay cargas horarias registradas para este curso');
  }

  const horasRequeridas = cargas.reduce((sum, c) => sum + (c.horas_semanales || 0), 0);
  const dias = obtenerDias();
  const capacidadSemanal = bloques.length * dias.length;

  console.log(`📊 Horas requeridas: ${horasRequeridas}`);
  console.log(`📅 Capacidad semanal: ${capacidadSemanal} bloques`);

  if (capacidadSemanal < horasRequeridas) {
    throw new Error(`Faltan bloques horarios. Capacidad: ${capacidadSemanal}, Requeridas: ${horasRequeridas}`);
  }

  const aulaIds = aulas.map(a => a.id);

  // 2. Inicializar población (pasando clasesOcupadas)
  let poblacion = [];
  for (let i = 0; i < tamañoPoblacion; i++) {
    poblacion.push(generarIndividuoAleatorio(cargas, dias, bloques, aulaIds));
  }

  for (const ind of poblacion) {
    calcularFitness(ind, disponibilidades, clasesOcupadas); // ✅ Pasamos ocupadas
  }

  // 3. Evolución
  let mejorGlobal = null;
  let generacionActual = 0;

  for (generacionActual = 0; generacionActual < generaciones; generacionActual++) {
    poblacion.sort((a, b) => b.fitness - a.fitness);

    const mejorActual = poblacion[0];
    if (!mejorGlobal || mejorActual.fitness > mejorGlobal.fitness) {
      mejorGlobal = mejorActual.clone();
    }

    if (generacionActual % 50 === 0) {
      console.log(`Gen ${generacionActual}: Fitness = ${mejorActual.fitness.toFixed(2)}% | Conflictos = ${mejorActual.conflictos}`);
    }

    if (mejorActual.fitness >= fitnessMinimo) break;

    const nuevaPoblacion = elitismo(poblacion, 2);

    while (nuevaPoblacion.length < tamañoPoblacion) {
      const padre1 = seleccionTorneo(poblacion, 3);
      const padre2 = seleccionTorneo(poblacion, 3);

      const [hijo1, hijo2] = cruce(padre1, padre2, tasaCruce);
      const hijo1Mutado = mutar(hijo1, tasaMutacion, dias, bloques, aulaIds);
      const hijo2Mutado = mutar(hijo2, tasaMutacion, dias, bloques, aulaIds);

      calcularFitness(hijo1Mutado, disponibilidades, clasesOcupadas); // ✅
      calcularFitness(hijo2Mutado, disponibilidades, clasesOcupadas); // ✅

      nuevaPoblacion.push(hijo1Mutado);
      if (nuevaPoblacion.length < tamañoPoblacion) nuevaPoblacion.push(hijo2Mutado);
    }

    poblacion = nuevaPoblacion;
  }

  const completo = mejorGlobal.clases.length >= horasRequeridas;

  return {
    exito: mejorGlobal.fitness >= fitnessMinimo && completo,
    fitness: mejorGlobal.fitness,
    conflictos: mejorGlobal.conflictos,
    generaciones: generacionActual,
    totalClases: mejorGlobal.clases.length,
    horasRequeridas,
    completo,
    clases: mejorGlobal.clases,
  };
}

function generarIndividuoAleatorio(cargas, dias, bloques, aulaIds) {
  const clases = [];
  
  // Creamos la matriz de días y bloques
  const espaciosDisponibles = [];
  for (const dia of dias) {
    for (const bloque of bloques) {
      espaciosDisponibles.push({ dia, bloque });
    }
  }
  espaciosDisponibles.sort(() => Math.random() - 0.5);

  let espacioIndex = 0;

  for (const carga of cargas) {
    const horasRequeridas = carga.horas_semanales || 1;

    for (let h = 0; h < horasRequeridas; h++) {
      if (espacioIndex >= espaciosDisponibles.length) espacioIndex = 0;

      const { dia, bloque } = espaciosDisponibles[espacioIndex];
      espacioIndex++;

      const aulaId = carga.curso?.aula_id || (aulaIds.length > 0 ? aulaIds[0] : null);

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
// algorithms/genetic/genetic-algorithm.js
import { Chromosome, ClaseAsignada } from './chromosome.js';
import { calcularFitness, detectarCrucesEntreSecciones  } from './fitness.js';
import { seleccionTorneo, cruce, mutar, elitismo, reparar } from './operators.js';
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
    maxIntentos = 5,
  } = opciones;

  console.log('🧬 Iniciando Algoritmo Genético...');
  if (cursoId) console.log(`📚 Curso específico ID: ${cursoId}`);

  // 1. Cargar datos
    const { cargas, aulas, disponibilidades, bloques, tipoEducacion, seccion, clasesOcupadas } = 
    await cargarDatos(periodoId, jornadaId, cursoId);

  if (cargas.length === 0) {
    throw new Error('No hay cargas horarias registradas para este curso');
  }

  // Cada curso usa su aula fija (detalle_horarios.aula_id es obligatorio)
  const sinAula = cargas.find(c => !c.curso?.aula_id);
  if (sinAula) {
    const c = sinAula.curso;
    throw new Error(`El curso ${c ? `${c.grado} "${c.paralelo}"` : sinAula.curso_id} no tiene aula fija. Asígnela en Cursos antes de generar el horario.`);
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

  // 2 y 3. Evolución con reintentos: si un intento termina con conflictos,
  // se repite con una población nueva y se conserva el mejor resultado.
  let mejorGlobal = null;
  let generacionActual = 0;
  let intentosUsados = 0;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    intentosUsados = intento;

    let poblacion = [];
    for (let i = 0; i < tamañoPoblacion; i++) {
      poblacion.push(generarIndividuoAleatorio(cargas, dias, bloques, aulaIds));
    }
    for (const ind of poblacion) {
      calcularFitness(ind, disponibilidades, clasesOcupadas);
    }

    let mejorIntento = null;
    let mejorFitnessVisto = -1, sinMejora = 0;
    for (generacionActual = 0; generacionActual < generaciones; generacionActual++) {
      poblacion.sort((a, b) => b.fitness - a.fitness);

      const mejorActual = poblacion[0];
      if (!mejorIntento || mejorActual.fitness > mejorIntento.fitness) {
        mejorIntento = mejorActual.clone();
      }

      if (generacionActual % 50 === 0) {
        console.log(`Intento ${intento} · Gen ${generacionActual}: Fitness = ${mejorActual.fitness.toFixed(2)}% | Conflictos = ${mejorActual.conflictos}`);
      }

      // Se detiene con el horario perfecto, o si ya no tiene conflictos duros y lleva
      // 100 generaciones sin mejorar las restricciones deseables
      if (mejorActual.fitness >= 100) break;
      if (mejorActual.fitness > mejorFitnessVisto) { mejorFitnessVisto = mejorActual.fitness; sinMejora = 0; } else sinMejora++;
      if (mejorActual.conflictos === 0 && sinMejora >= 100) break;

      const nuevaPoblacion = elitismo(poblacion, 2);

      while (nuevaPoblacion.length < tamañoPoblacion) {
        const padre1 = seleccionTorneo(poblacion, 3);
        const padre2 = seleccionTorneo(poblacion, 3);

        const [hijo1, hijo2] = cruce(padre1, padre2, tasaCruce);
        const hijo1Mutado = mutar(hijo1, tasaMutacion, dias, bloques, aulaIds);
        const hijo2Mutado = mutar(hijo2, tasaMutacion, dias, bloques, aulaIds);

        calcularFitness(hijo1Mutado, disponibilidades, clasesOcupadas);
        calcularFitness(hijo2Mutado, disponibilidades, clasesOcupadas);

        nuevaPoblacion.push(hijo1Mutado);
        if (nuevaPoblacion.length < tamañoPoblacion) nuevaPoblacion.push(hijo2Mutado);
      }

      poblacion = nuevaPoblacion;
    }

        // Reparación final: intercambios que eliminan conflictos y, si se puede, los cruces RB-03
    if (mejorIntento.fitness < 100) {
      reparar(mejorIntento, disponibilidades, clasesOcupadas);
      console.log(`🔧 Intento ${intento} tras reparación: Conflictos = ${mejorIntento.conflictos}`);
    }

    if (!mejorGlobal || mejorIntento.fitness > mejorGlobal.fitness) {
      mejorGlobal = mejorIntento;
    }
    if (mejorGlobal.conflictos === 0) break;
  }

  const completo = mejorGlobal.clases.length >= horasRequeridas;

  // ✅ RB-03: cruces con la otra sección que quedaron (el colegio tuvo prioridad)
  const nombreDocente = new Map(cargas.map(c => [c.id, c.docente ? `${c.docente.nombres} ${c.docente.apellidos}` : '']));
  const nombreCurso = new Map(cargas.map(c => [c.id, c.curso ? `${c.curso.grado} "${c.curso.paralelo}"` : '']));
    const nombreAsignatura = new Map(cargas.map(c => [c.id, c.asignatura?.nombre || ''])); // ✅ HU-12
  const avisos = detectarCrucesEntreSecciones(mejorGlobal.clases, clasesOcupadas, seccion).map(a => ({
    ...a,
    docente: nombreDocente.get(a.cargaHorariaId) || '',
    curso: nombreCurso.get(a.cargaHorariaId) || '',
    seccion,
  }));
  if (avisos.length) console.log(`⚠️ RB-03: ${avisos.length} cruce(s) con la otra sección`);

  return {
    exito: mejorGlobal.conflictos === 0 && completo,
    fitness: mejorGlobal.fitness,
    conflictos: mejorGlobal.conflictos,
    generaciones: generacionActual,
    intentos: intentosUsados,
    totalClases: mejorGlobal.clases.length,
    horasRequeridas,
    completo,
    seccion,   
    avisos,    
       bloques,   // ✅ HU-12: filas de la tabla de ajuste manual
    clases: mejorGlobal.clases.map(c => ({
      ...c,
      asignatura: nombreAsignatura.get(c.cargaHorariaId) || '',   // ✅ HU-12: para mostrar en la tabla
      docente: nombreDocente.get(c.cargaHorariaId) || '',
    })),
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

      const aulaId = carga.curso.aula_id; // aula fija del curso

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
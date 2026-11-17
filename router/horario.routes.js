// src/routes/horario.routes.js
import { Router } from 'express';
import {
  generar,
  guardar,
  getAll,
  getById,
  deleteHorario,
  misClases,
  clasesDocente,
  cambiarPublicacion,
} from '../controller/horario.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin, isDocente } from '../middlewares/role.middleware.js';

const router = Router();

router.use(verifyToken);

// ✅ Ruta para DOCENTES (va ANTES de '/:id' para que no la confunda con un id)
router.get('/mis-clases', isDocente, misClases);

// Rutas para administradores
router.post('/generar', isAdmin, generar);
router.post('/guardar', isAdmin, guardar);
router.get('/', isAdmin, getAll);
router.get('/docente/:docenteId', isAdmin, clasesDocente); // ✅ (antes de '/:id')
router.get('/:id', isAdmin, getById);
router.patch('/:id/publicar', isAdmin, cambiarPublicacion); // ✅ HU-13
router.delete('/:id', isAdmin, deleteHorario);

export default router;
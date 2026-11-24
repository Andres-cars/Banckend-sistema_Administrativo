// router/chatbot.routes.js
// ✅ Chatbot híbrido
import { Router } from 'express';
import { preguntar, estadisticas } from '../controller/chatbot.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { hasRole, isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

router.post('/', verifyToken, hasRole(['ADMINISTRADOR', 'DOCENTE']), preguntar);
router.get('/estadisticas', verifyToken, isAdmin, estadisticas);

export default router;
// router/historial.routes.js
// ✅ RN-12: historial de cambios (solo ADMIN)
import { Router } from 'express';
import { getAll } from '../controller/historial.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

const router = Router();

router.use(verifyToken);
router.use(isAdmin);

router.get('/', getAll);

export default router;
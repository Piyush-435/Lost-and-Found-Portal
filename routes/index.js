import { Router } from 'express';
import authRoutes  from './authRoutes.js';
import itemRoutes  from './ItemRoutes.js';
 
const router = Router();
 
router.use('/', authRoutes);
router.use('/',     itemRoutes);
 
export default router;
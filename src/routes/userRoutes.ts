import { Router } from 'express';
import { getUserProfile, updateUserProfile, deleteUser } from '../controllers/userController';

const router = Router();

// Obtener perfil del usuario autenticado
// router.get('/profile', authenticateToken, getUserProfile);

// Actualizar perfil del usuario autenticado (actualización parcial)
// router.patch('/profile', authenticateToken, updateUserProfile);

// Eliminar cuenta del usuario autenticado
// router.delete('/profile', authenticateToken, deleteUser);

// Rutas temporales sin autenticación (para testing)
router.get('/profile/:id', getUserProfile);
router.patch('/profile/:id', updateUserProfile);
router.delete('/:id', deleteUser);

export default router; 
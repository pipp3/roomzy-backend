import { Router } from 'express';
import { getUserProfile, updateUserProfile, updateProfilePhoto, getUserProfilePhoto } from '../controllers/userController';
import { authenticateToken, requireEmailVerified } from '../middleware/authMiddleware';
import { uploadProfilePhoto, handleMulterError } from '../middleware/uploadMiddleware';

const router = Router();

// Rutas protegidas que requieren autenticación y email verificado
router.get('/profile', authenticateToken, requireEmailVerified, getUserProfile);
router.patch('/profile', authenticateToken, requireEmailVerified, updateUserProfile);

// Rutas específicas para foto de perfil
router.get('/profile/photo', authenticateToken, requireEmailVerified, getUserProfilePhoto);
router.patch('/profile/photo', 
    authenticateToken, 
    requireEmailVerified, 
    uploadProfilePhoto, 
    handleMulterError, 
    updateProfilePhoto
);

// Nota: La eliminación de cuenta solo puede ser realizada por administradores
// a través de las rutas administrativas por motivos de seguridad

export default router; 
import { Router } from 'express';
import { register, verifyEmail, resendVerificationCode, login, logout, refreshToken, getCurrentUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Rutas protegidas (requieren autenticación)
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);

export default router; 
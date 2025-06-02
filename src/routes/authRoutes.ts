import { Router } from 'express';
import { register, verifyEmail, resendVerificationCode, login, logout, refreshToken, getCurrentUser, changePassword, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Rutas protegidas (requieren autenticación)
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/change-password', authenticateToken, changePassword);

export default router; 
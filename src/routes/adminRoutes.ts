import { Router } from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserStats
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Aplicar middleware de autenticación y verificación de admin a todas las rutas
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users/stats
 * @desc    Obtener estadísticas de usuarios
 * @access  Admin
 * @important Esta ruta DEBE ir ANTES que /users/:id para evitar conflictos
 */
router.get('/users/stats', getUserStats);

/**
 * @route   GET /api/admin/users
 * @desc    Listar todos los usuarios con paginación y filtros
 * @access  Admin
 * @query   page: número de página (default: 1)
 * @query   limit: límite por página (default: 10)
 * @query   role: filtrar por rol (admin|seeker|host)
 * @query   search: buscar por nombre, apellido o email
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Obtener datos de un usuario específico
 * @access  Admin
 */
router.get('/users/:id', getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Crear un nuevo usuario
 * @access  Admin
 */
router.post('/users', createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Actualizar datos de un usuario
 * @access  Admin
 */
router.put('/users/:id', updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Eliminar un usuario
 * @access  Admin
 */
router.delete('/users/:id', deleteUser);

export default router; 
import { Request, Response } from 'express';
import { initModels } from '../models';
import sequelize from '../config/database';

// Inicializar modelos
const { User } = initModels(sequelize);

interface CreateUserRequest {
    name: string;
    lastName: string;
    email: string;
    region: string;
    city: string;
    phone: string;
    password: string;
    role: 'admin' | 'seeker' | 'host';
    bio?: string;
    habits?: string;
}

interface UpdateUserRequest {
    name?: string;
    lastName?: string;
    email?: string;
    region?: string;
    city?: string;
    phone?: string;
    role?: 'admin' | 'seeker' | 'host';
    bio?: string;
    habits?: string;
    isEmailVerified?: boolean;
}

/**
 * Listar todos los usuarios con paginación
 */
export async function getAllUsers(req: Request, res: Response): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const role = req.query.role as string;
        const search = req.query.search as string;

        const offset = (page - 1) * limit;

        // Construir filtros
        const whereConditions: any = {};
        
        if (role && ['admin', 'seeker', 'host'].includes(role)) {
            whereConditions.role = role;
        }

        if (search) {
            whereConditions[Symbol.for('sequelize.or')] = [
                { name: { [Symbol.for('sequelize.iLike')]: `%${search}%` } },
                { lastName: { [Symbol.for('sequelize.iLike')]: `%${search}%` } },
                { email: { [Symbol.for('sequelize.iLike')]: `%${search}%` } }
            ];
        }

        const { count, rows: users } = await User.findAndCountAll({
            where: whereConditions,
            limit,
            offset,
            attributes: { exclude: ['password', 'emailVerificationCode', 'passwordResetCode'] },
            order: [['createdAt', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalUsers: count,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error: any) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
}

/**
 * Obtener datos de un usuario específico
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            res.status(400).json({
                success: false,
                message: 'ID de usuario inválido'
            });
            return;
        }

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'emailVerificationCode', 'passwordResetCode'] }
        });

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error: any) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
}

/**
 * Crear un nuevo usuario
 */
export async function createUser(req: Request, res: Response): Promise<void> {
    try {
        const userData: CreateUserRequest = req.body;

        // Validar campos requeridos
        const requiredFields = ['name', 'lastName', 'email', 'region', 'city', 'phone', 'password', 'role'];
        const missingFields = requiredFields.filter(field => !userData[field as keyof CreateUserRequest]);

        if (missingFields.length > 0) {
            res.status(400).json({
                success: false,
                message: 'Campos requeridos faltantes',
                missingFields
            });
            return;
        }

        // Verificar si el email ya existe
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'Ya existe un usuario con este email'
            });
            return;
        }

        // Crear el usuario
        const newUser = await User.create({
            ...userData,
            isEmailVerified: true // Los usuarios creados por admin están verificados por defecto
        });

        // Hashear la contraseña después de crear
        await newUser.hashPassword();
        await newUser.save();

        // Responder sin incluir la contraseña
        const userResponse = await User.findByPk(newUser.id, {
            attributes: { exclude: ['password', 'emailVerificationCode', 'passwordResetCode'] }
        });

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: { user: userResponse }
        });
    } catch (error: any) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
}

/**
 * Actualizar datos de un usuario
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        const updateData: UpdateUserRequest = req.body;

        if (isNaN(userId)) {
            res.status(400).json({
                success: false,
                message: 'ID de usuario inválido'
            });
            return;
        }

        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
            return;
        }

        // Verificar si se está cambiando el email y si ya existe
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await User.findOne({ where: { email: updateData.email } });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'Ya existe un usuario con este email'
                });
                return;
            }
        }

        // Actualizar los campos
        await user.update(updateData);

        // Responder con los datos actualizados
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password', 'emailVerificationCode', 'passwordResetCode'] }
        });

        res.status(200).json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: { user: updatedUser }
        });
    } catch (error: any) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
}

/**
 * Eliminar un usuario
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            res.status(400).json({
                success: false,
                message: 'ID de usuario inválido'
            });
            return;
        }

        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
            return;
        }

        // Prevenir que un admin se elimine a sí mismo
        if (req.user && req.user.userId === userId) {
            res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
            });
            return;
        }

        await user.destroy();

        res.status(200).json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
}

/**
 * Obtener estadísticas de usuarios
 */
export async function getUserStats(req: Request, res: Response): Promise<void> {
    try {
        const [totalUsers, adminCount, seekerCount, hostCount, verifiedUsers] = await Promise.all([
            User.count(),
            User.count({ where: { role: 'admin' } }),
            User.count({ where: { role: 'seeker' } }),
            User.count({ where: { role: 'host' } }),
            User.count({ where: { isEmailVerified: true } })
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    usersByRole: {
                        admin: adminCount,
                        seeker: seekerCount,
                        host: hostCount
                    },
                    verifiedUsers,
                    unverifiedUsers: totalUsers - verifiedUsers
                }
            }
        });
    } catch (error: any) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
} 
import { Request, Response } from 'express';
import { initModels } from '../models';
import sequelize from '../config/database';
import { ChileanPhoneUtils } from '../utils/phoneUtils';

// Inicializar modelos
const { User } = initModels(sequelize);

// Obtener perfil de usuario
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] } // Excluir contraseña
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Formatear teléfono para mostrar
    const userResponse = {
      ...user.toJSON(),
      phone: ChileanPhoneUtils.formatForDisplay(user.phone)
    };

    res.json({
      success: true,
      user: userResponse
    });

  } catch (error: any) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar perfil de usuario
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // No permitir actualizar email, id o password desde esta ruta
    delete updateData.id;
    delete updateData.email;
    delete updateData.password;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Actualizar usuario
    await user.update(updateData);

    // Obtener usuario actualizado sin contraseña
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Error actualizando perfil:', error);

    // Manejar errores de validación
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map((err: any) => ({
          field: err.path,
          message: err.message
        }))
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Eliminar usuario
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 
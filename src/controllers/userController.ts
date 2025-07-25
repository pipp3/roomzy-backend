import { Request, Response } from 'express';
import { initModels } from '../models';
import sequelize from '../config/database';
import { ChileanPhoneUtils } from '../utils/phoneUtils';
import { CloudinaryService } from '../services/cloudinaryService';

// Inicializar modelos
const { User } = initModels(sequelize);

// Obtener perfil de usuario
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Usar el ID del usuario autenticado desde el token
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const user = await User.findByPk(userId, {
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
    // Usar el ID del usuario autenticado desde el token
    const userId = req.user?.userId;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Validar que se envíen datos para actualizar
    if (!updateData || Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionaron datos para actualizar'
      });
      return;
    }

    // No permitir actualizar email, id o password desde esta ruta
    delete updateData.id;
    delete updateData.email;
    delete updateData.password;

    // Validar y formatear teléfono si se proporciona
    if (updateData.phone) {
      if (!ChileanPhoneUtils.isValidInput(updateData.phone)) {
        res.status(400).json({
          success: false,
          message: 'Formato de teléfono inválido'
        });
        return;
      }
      // Formatear teléfono para almacenamiento en base de datos
      updateData.phone = ChileanPhoneUtils.formatForDatabase(updateData.phone);
    }

    // Validar bio si se proporciona
    if (updateData.bio !== undefined) {
      if (typeof updateData.bio !== 'string') {
        res.status(400).json({
          success: false,
          message: 'La biografía debe ser texto'
        });
        return;
      }
      if (updateData.bio.length > 500) {
        res.status(400).json({
          success: false,
          message: 'La biografía no puede exceder 500 caracteres'
        });
        return;
      }
      // Limpiar espacios en blanco innecesarios
      updateData.bio = updateData.bio.trim();
    }

    // Validar habits si se proporciona
    if (updateData.habits !== undefined) {
      if (typeof updateData.habits !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Los hábitos deben ser texto'
        });
        return;
      }
      if (updateData.habits.length > 1000) {
        res.status(400).json({
          success: false,
          message: 'Los hábitos no pueden exceder 1000 caracteres'
        });
        return;
      }
      // Limpiar espacios en blanco innecesarios
      updateData.habits = updateData.habits.trim();
    }

    const user = await User.findByPk(userId);

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
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    // Formatear teléfono para respuesta
    const userResponse = {
      ...updatedUser!.toJSON(),
      phone: ChileanPhoneUtils.formatForDisplay(updatedUser!.phone)
    };

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: userResponse
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

// Obtener foto de perfil del usuario
export const getUserProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    // Usar el ID del usuario autenticado desde el token
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'lastName', 'profilePhoto']
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto || null,
        hasProfilePhoto: !!user.profilePhoto
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo foto de perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar foto de perfil
export const updateProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    // Usar el ID del usuario autenticado desde el token
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Verificar que se subió un archivo
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
      return;
    }

    // Validar el archivo
    try {
      CloudinaryService.validateImageFile(req.file);
    } catch (validationError: any) {
      res.status(400).json({
        success: false,
        message: validationError.message
      });
      return;
    }

    // Buscar el usuario
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Eliminar imagen anterior si existe
    if (user.profilePhoto) {
      const oldPublicId = CloudinaryService.extractPublicIdFromUrl(user.profilePhoto);
      if (oldPublicId) {
        await CloudinaryService.deleteImage(oldPublicId);
      }
    }

    // Subir nueva imagen a Cloudinary
    const uploadResult = await CloudinaryService.uploadProfilePhoto(req.file.buffer, userId);

    // Actualizar URL en la base de datos
    await user.update({ profilePhoto: uploadResult.secure_url });

    // Obtener usuario actualizado sin contraseña
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'emailVerificationCode', 'passwordResetCode'] }
    });

    // Formatear teléfono para respuesta
    const userResponse = {
      ...updatedUser!.toJSON(),
      phone: ChileanPhoneUtils.formatForDisplay(updatedUser!.phone)
    };

    res.json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      user: userResponse,
      uploadInfo: {
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format
      }
    });

  } catch (error: any) {
    console.error('Error actualizando foto de perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 
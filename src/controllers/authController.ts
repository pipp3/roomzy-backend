import { Request, Response } from 'express';
import { initModels } from '../models';
import sequelize from '../config/database';
import { EmailService } from '../services/emailService';
import { ChileanPhoneUtils } from '../utils/phoneUtils';
import { JWTService } from '../services/jwtService';

// Inicializar modelos
const { User } = initModels(sequelize);

// Registro de usuario (ahora envía código de verificación)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      lastName,
      email,
      region,
      city,
      phone,
      password,
      role = 'seeker'
    } = req.body;

    // Validar campos requeridos
    if (!name || !lastName || !email || !region || !city || !phone || !password) {
      res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
        requiredFields: ['name', 'lastName', 'email', 'region', 'city', 'phone', 'password']
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
      return;
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
      return;
    }

    // Validar número de teléfono chileno
    if (!ChileanPhoneUtils.isValidInput(phone)) {
      res.status(400).json({
        success: false,
        message: ChileanPhoneUtils.getValidationMessage(),
        examples: ChileanPhoneUtils.getExamples()
      });
      return;
    }

    // Normalizar datos
    const normalizedEmail = email.toLowerCase().trim();
    const formattedPhone = ChileanPhoneUtils.formatForDatabase(phone);

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
      return;
    }

    // Verificar si el teléfono ya existe
    const existingPhone = await User.findOne({ where: { phone: formattedPhone } });
    if (existingPhone) {
      res.status(409).json({
        success: false,
        message: 'El número de teléfono ya está registrado'
      });
      return;
    }

    // Crear usuario sin verificar
    const newUser = await User.create({
      name: name.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      region: region.trim(),
      city: city.trim(),
      phone: formattedPhone, // Guardamos con +56
      password,
      role,
      isEmailVerified: false
    });

    // Generar y enviar código de verificación
    const verificationCode = await newUser.setVerificationCode();
    
    const emailSent = await EmailService.sendVerificationEmail({
      to: normalizedEmail,
      name: name.trim(),
      verificationCode
    });

    if (!emailSent) {
      console.error('Error enviando email de verificación');
      // No fallamos el registro, pero notificamos que pueden reenviar
    }

    // Respuesta sin contraseña ni códigos sensibles
    const { password: _, emailVerificationCode: __, ...userWithoutSensitiveData } = newUser.toJSON();

    // Formatear teléfono para mostrar
    const userResponse = {
      ...userWithoutSensitiveData,
      phone: ChileanPhoneUtils.formatForDisplay(userWithoutSensitiveData.phone)
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Revisa tu email para el código de verificación.',
      user: userResponse,
      emailSent
    });

  } catch (error: any) {
    console.error('Error en registro:', error);
    
    // Manejar errores de validación de Sequelize
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

    // Manejar errores de unicidad (email duplicado)
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
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

// Verificar código de email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        message: 'Email y código son requeridos'
      });
      return;
    }

    // Buscar usuario por email
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'El email ya está verificado'
      });
      return;
    }

    // Verificar el código
    const isValidCode = await user.verifyEmailCode(code.toString().toUpperCase());

    if (!isValidCode) {
      res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
      return;
    }

    // Respuesta exitosa
    const { password: _, emailVerificationCode: __, ...userWithoutSensitiveData } = user.toJSON();

    res.json({
      success: true,
      message: 'Email verificado exitosamente',
      user: userWithoutSensitiveData
    });

  } catch (error: any) {
    console.error('Error verificando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reenviar código de verificación
export const resendVerificationCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
      return;
    }

    // Buscar usuario por email
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'El email ya está verificado'
      });
      return;
    }

    // Generar nuevo código y enviarlo
    const verificationCode = await user.setVerificationCode();
    
    const emailSent = await EmailService.resendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationCode
    });

    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Error enviando el email. Inténtalo de nuevo.'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Código de verificación reenviado exitosamente'
    });

  } catch (error: any) {
    console.error('Error reenviando código:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login de usuario
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos',
        requiredFields: ['email', 'password']
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
      return;
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario por email
    const user = await User.findOne({ 
      where: { email: normalizedEmail }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    // Verificar contraseña
    const isValidPassword = await user.checkPassword(password);
    
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    // Crear payload para JWT
    const jwtPayload = JWTService.createPayloadFromUser(user);
    
    // Generar tokens
    const { accessToken, refreshToken } = JWTService.generateTokenPair(jwtPayload);

    // Preparar respuesta del usuario (sin datos sensibles)
    const { password: _, emailVerificationCode: __, ...userWithoutSensitiveData } = user.toJSON();
    
    // Formatear teléfono para mostrar
    const userResponse = {
      ...userWithoutSensitiveData,
      phone: ChileanPhoneUtils.formatForDisplay(userWithoutSensitiveData.phone)
    };

    res.json({
      success: true,
      message: 'Login exitoso',
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
      },
      // Información adicional útil para el frontend
      requiresEmailVerification: !user.isEmailVerified
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token es requerido'
      });
      return;
    }

    // Verificar refresh token
    const decoded = JWTService.verifyRefreshToken(refreshToken);

    // Buscar usuario actualizado
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Crear nuevo payload con datos actualizados
    const jwtPayload = JWTService.createPayloadFromUser(user);
    
    // Generar nuevos tokens
    const tokens = JWTService.generateTokenPair(jwtPayload);

    res.json({
      success: true,
      message: 'Tokens renovados exitosamente',
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
      }
    });

  } catch (error: any) {
    console.error('Error renovando token:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido o expirado',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout de usuario
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // En una implementación más robusta, aquí podrías:
    // 1. Agregar el token a una blacklist en Redis/DB
    // 2. Invalidar todos los refresh tokens del usuario
    // 3. Registrar el logout en logs de auditoría
    
    // Por ahora, simplemente confirmamos el logout
    // El frontend debe eliminar los tokens del almacenamiento local
    
    res.json({
      success: true,
      message: 'Logout exitoso',
      instructions: 'Por favor elimina los tokens del almacenamiento local'
    });

  } catch (error: any) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener usuario actual
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // El middleware ya verificó el token y agregó req.user
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    // Buscar usuario actualizado en la base de datos
    const user = await User.findByPk(req.user.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Preparar respuesta del usuario (sin datos sensibles)
    const { password: _, emailVerificationCode: __, ...userWithoutSensitiveData } = user.toJSON();
    
    // Formatear teléfono para mostrar
    const userResponse = {
      ...userWithoutSensitiveData,
      phone: ChileanPhoneUtils.formatForDisplay(userWithoutSensitiveData.phone)
    };

    res.json({
      success: true,
      message: 'Usuario obtenido exitosamente',
      user: userResponse
    });

  } catch (error: any) {
    console.error('Error obteniendo usuario actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 
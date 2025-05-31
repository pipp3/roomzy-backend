import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../services/jwtService';

// Extender el tipo Request para incluir user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

/**
 * Middleware para verificar token JWT
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        const token = JWTService.extractTokenFromHeader(authHeader);

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
            return;
        }

        const decoded = JWTService.verifyAccessToken(token);
        req.user = decoded;
        
        next();
    } catch (error: any) {
        res.status(401).json({
            success: false,
            message: 'Token inválido o expirado',
            error: error.message
        });
    }
};

/**
 * Middleware para verificar que el email esté verificado
 */
export const requireEmailVerified = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
        return;
    }

    if (!req.user.isEmailVerified) {
        res.status(403).json({
            success: false,
            message: 'Email no verificado. Por favor verifica tu email antes de continuar.',
            requiresEmailVerification: true
        });
        return;
    }

    next();
};

/**
 * Middleware para verificar roles específicos
 */
export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
            return;
        }

        next();
    };
};

/**
 * Middleware opcional - no falla si no hay token
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        const token = JWTService.extractTokenFromHeader(authHeader);

        if (token) {
            const decoded = JWTService.verifyAccessToken(token);
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        // Si hay error, simplemente continúa sin usuario
        next();
    }
}; 
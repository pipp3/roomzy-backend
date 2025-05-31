import jwt from 'jsonwebtoken';

export interface JWTPayload {
    userId: number;
    email: string;
    role: string;
    isEmailVerified: boolean;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export class JWTService {
    private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
    private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    /**
     * Generar par de tokens (access + refresh)
     */
    static generateTokenPair(payload: JWTPayload): TokenPair {
        const accessToken = jwt.sign(
            payload,
            this.ACCESS_TOKEN_SECRET,
            { 
                expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
                issuer: 'roomzy-api',
                audience: 'roomzy-app'
            } as jwt.SignOptions
        );

        const refreshToken = jwt.sign(
            { userId: payload.userId, email: payload.email },
            this.REFRESH_TOKEN_SECRET,
            { 
                expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
                issuer: 'roomzy-api',
                audience: 'roomzy-app'
            } as jwt.SignOptions
        );

        return { accessToken, refreshToken };
    }

    /**
     * Verificar access token
     */
    static verifyAccessToken(token: string): JWTPayload {
        try {
            const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
                issuer: 'roomzy-api',
                audience: 'roomzy-app'
            }) as JWTPayload;
            
            return decoded;
        } catch (error) {
            throw new Error('Token inválido o expirado');
        }
    }

    /**
     * Verificar refresh token
     */
    static verifyRefreshToken(token: string): { userId: number; email: string } {
        try {
            const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
                issuer: 'roomzy-api',
                audience: 'roomzy-app'
            }) as { userId: number; email: string };
            
            return decoded;
        } catch (error) {
            throw new Error('Refresh token inválido o expirado');
        }
    }

    /**
     * Extraer token del header Authorization
     */
    static extractTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        
        return authHeader.substring(7); // Remover "Bearer "
    }

    /**
     * Generar payload desde usuario
     */
    static createPayloadFromUser(user: any): JWTPayload {
        return {
            userId: user.id,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified
        };
    }

    /**
     * Verificar si el token está próximo a expirar (últimos 5 minutos)
     */
    static isTokenNearExpiry(token: string): boolean {
        try {
            const decoded = jwt.decode(token) as any;
            if (!decoded || !decoded.exp) return true;
            
            const now = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = decoded.exp - now;
            
            // Si quedan menos de 5 minutos (300 segundos)
            return timeUntilExpiry < 300;
        } catch {
            return true;
        }
    }
} 
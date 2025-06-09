import multer from 'multer';
import { Request } from 'express';

// Configuración de Multer para mantener archivos en memoria
const storage = multer.memoryStorage();

// Filtro para validar tipos de archivo
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no válido. Solo se permiten JPG, PNG y WebP'));
    }
};

// Configurar Multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
        files: 1 // Solo un archivo por request
    }
});

// Middleware específico para foto de perfil
export const uploadProfilePhoto = upload.single('profilePhoto');

// Middleware para manejar errores de Multer
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Solo se permite subir un archivo'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Campo de archivo inesperado. Usa "profilePhoto"'
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Error al procesar el archivo'
                });
        }
    }

    if (error.message.includes('Formato de archivo no válido')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next(error);
}; 
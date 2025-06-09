import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
}

export class CloudinaryService {
    /**
     * Subir imagen de perfil de usuario
     */
    static async uploadProfilePhoto(fileBuffer: Buffer, userId: number): Promise<CloudinaryUploadResult> {
        try {
            return new Promise((resolve, reject) => {
                const uploadOptions = {
                    folder: 'roomzy/profile-photos',
                    public_id: `user_${userId}_${Date.now()}`,
                    transformation: [
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ],
                    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                    resource_type: 'image' as const
                };

                cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) {
                            console.error('Error subiendo a Cloudinary:', error);
                            reject(new Error('Error al procesar la imagen'));
                        } else if (result) {
                            resolve({
                                public_id: result.public_id,
                                secure_url: result.secure_url,
                                width: result.width,
                                height: result.height,
                                format: result.format,
                                resource_type: result.resource_type
                            });
                        } else {
                            reject(new Error('No se recibió respuesta de Cloudinary'));
                        }
                    }
                ).end(fileBuffer);
            });
        } catch (error) {
            console.error('Error en uploadProfilePhoto:', error);
            throw new Error('Error al subir la imagen');
        }
    }

    /**
     * Eliminar imagen anterior (cleanup)
     */
    static async deleteImage(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Error eliminando imagen de Cloudinary:', error);
            // No lanzamos error aquí para no interrumpir el flujo principal
        }
    }

    /**
     * Extraer public_id de una URL de Cloudinary
     */
    static extractPublicIdFromUrl(url: string): string | null {
        try {
            const regex = /\/v\d+\/(.+)\.[a-z]+$/;
            const match = url.match(regex);
            return match ? match[1] : null;
        } catch (error) {
            console.error('Error extrayendo public_id:', error);
            return null;
        }
    }

    /**
     * Validar que el archivo sea una imagen válida
     */
    static validateImageFile(file: Express.Multer.File): void {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error('Formato de archivo no válido. Solo se permiten JPG, PNG y WebP');
        }

        if (file.size > maxSizeInBytes) {
            throw new Error('El archivo es demasiado grande. Tamaño máximo: 5MB');
        }
    }
} 
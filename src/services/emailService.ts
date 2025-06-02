import nodemailer from 'nodemailer';

export interface EmailVerificationData {
    to: string;
    name: string;
    verificationCode: string;
}

export class EmailService {
    private static transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.MAILTRAP_PORT || '2525'),
        secure: false, // Mailtrap usa STARTTLS
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
        },
    });

    static async sendVerificationEmail({ to, name, verificationCode }: EmailVerificationData): Promise<boolean> {
        try {
            const mailOptions = {
                from: `"Roomzy" <${process.env.FROM_EMAIL || 'noreply@roomzy.com'}>`,
                to: to,
                subject: '🏠 Confirma tu cuenta en Roomzy',
                html: this.getVerificationEmailTemplate(name, verificationCode),
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email enviado exitosamente a Mailtrap:', info.messageId);
            return true;
        } catch (error) {
            console.error('❌ Error enviando email:', error);
            return false;
        }
    }

    private static getVerificationEmailTemplate(name: string, code: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Confirma tu cuenta - Roomzy</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .code-box { 
                    background: #f8f9fa; 
                    border: 2px dashed #007bff; 
                    padding: 20px; 
                    text-align: center; 
                    margin: 20px 0; 
                    border-radius: 8px;
                }
                .code { 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #007bff; 
                    letter-spacing: 5px; 
                    margin: 10px 0;
                }
                .footer { margin-top: 30px; font-size: 14px; color: #666; }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏠 ¡Bienvenido a Roomzy, ${name}!</h1>
                    <p>Estás a un paso de completar tu registro</p>
                </div>
                
                <p>Hola <strong>${name}</strong>,</p>
                
                <p>Gracias por registrarte en Roomzy. Para completar tu registro y comenzar a buscar tu hogar ideal, necesitamos verificar tu dirección de email.</p>
                
                <div class="code-box">
                    <p><strong>Tu código de verificación es:</strong></p>
                    <div class="code">${code}</div>
                    <p><small>Este código expira en 30 minutos</small></p>
                </div>
                
                <p>Introduce este código en la aplicación para activar tu cuenta.</p>
                
                <div class="footer">
                    <p><strong>¿No solicitaste este código?</strong><br>
                    Si no te registraste en Roomzy, puedes ignorar este email de forma segura.</p>
                    
                    <p><small>Este es un email automático, por favor no respondas a este mensaje.</small></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Método para reenviar código de verificación
    static async resendVerificationEmail({ to, name, verificationCode }: EmailVerificationData): Promise<boolean> {
        try {
            const mailOptions = {
                from: `"Roomzy" <${process.env.FROM_EMAIL || 'noreply@roomzy.com'}>`,
                to: to,
                subject: '🔄 Nuevo código de verificación - Roomzy',
                html: this.getResendEmailTemplate(name, verificationCode),
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email reenviado exitosamente a Mailtrap:', info.messageId);
            return true;
        } catch (error) {
            console.error('❌ Error reenviando email:', error);
            return false;
        }
    }

    private static getResendEmailTemplate(name: string, code: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Nuevo código de verificación - Roomzy</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .code-box { 
                    background: #fff3cd; 
                    border: 2px dashed #ffc107; 
                    padding: 20px; 
                    text-align: center; 
                    margin: 20px 0; 
                    border-radius: 8px;
                }
                .code { 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #856404; 
                    letter-spacing: 5px; 
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔄 Nuevo código de verificación</h1>
                </div>
                
                <p>Hola <strong>${name}</strong>,</p>
                
                <p>Has solicitado un nuevo código de verificación para tu cuenta en Roomzy.</p>
                
                <div class="code-box">
                    <p><strong>Tu nuevo código es:</strong></p>
                    <div class="code">${code}</div>
                    <p><small>Este código expira en 30 minutos</small></p>
                </div>
                
                <p>Tu código anterior ha sido invalidado. Usa únicamente este nuevo código.</p>
            </div>
        </body>
        </html>
        `;
    }

    // Método para verificar la configuración SMTP
    static async verifyConnection(): Promise<boolean> {
        try {
            // Log de debug para verificar variables
            console.log('🔍 Verificando configuración SMTP de Mailtrap:');
            console.log('- Host:', process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io');
            console.log('- Port:', process.env.MAILTRAP_PORT || '2525');
            console.log('- User:', process.env.MAILTRAP_USER ? '✅ Configurado' : '❌ No configurado');
            console.log('- Pass:', process.env.MAILTRAP_PASS ? '✅ Configurado' : '❌ No configurado');
            console.log('- From Email:', process.env.FROM_EMAIL || 'noreply@roomzy.com');
            
            await this.transporter.verify();
            console.log('✅ Conexión SMTP con Mailtrap verificada exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error conectando con Mailtrap:', error);
            return false;
        }
    }

    // Método para enviar email de restablecimiento de contraseña
    static async sendPasswordResetEmail({ to, name, verificationCode }: EmailVerificationData): Promise<boolean> {
        try {
            const mailOptions = {
                from: `"Roomzy" <${process.env.FROM_EMAIL || 'noreply@roomzy.com'}>`,
                to: to,
                subject: '🔐 Restablece tu contraseña - Roomzy',
                html: this.getPasswordResetEmailTemplate(name, verificationCode),
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email de restablecimiento enviado exitosamente a Mailtrap:', info.messageId);
            return true;
        } catch (error) {
            console.error('❌ Error enviando email de restablecimiento:', error);
            return false;
        }
    }

    private static getPasswordResetEmailTemplate(name: string, code: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Restablece tu contraseña - Roomzy</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .code-box { 
                    background: #fff5f5; 
                    border: 2px dashed #dc3545; 
                    padding: 20px; 
                    text-align: center; 
                    margin: 20px 0; 
                    border-radius: 8px;
                }
                .code { 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #dc3545; 
                    letter-spacing: 5px; 
                    margin: 10px 0;
                }
                .warning {
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }
                .footer { margin-top: 30px; font-size: 14px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Restablece tu contraseña</h1>
                </div>
                
                <p>Hola <strong>${name}</strong>,</p>
                
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Roomzy.</p>
                
                <div class="code-box">
                    <p><strong>Tu código de restablecimiento es:</strong></p>
                    <div class="code">${code}</div>
                    <p><small>Este código expira en 30 minutos</small></p>
                </div>
                
                <p>Usa este código en la aplicación para crear una nueva contraseña.</p>
                
                <div class="warning">
                    <p><strong>⚠️ Importante:</strong></p>
                    <ul>
                        <li>Si no solicitaste este restablecimiento, ignora este email</li>
                        <li>Nunca compartas este código con nadie</li>
                        <li>El código expira en 30 minutos por seguridad</li>
                    </ul>
                </div>
                
                <div class="footer">
                    <p><small>Este es un email automático, por favor no respondas a este mensaje.</small></p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
} 
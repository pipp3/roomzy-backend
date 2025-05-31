import 'dotenv/config';
import express from 'express';
import sequelize from './config/database';
import { initModels, syncDatabase } from './models';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { EmailService } from './services/emailService';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

async function initialize(){
    try{
        // Autenticar conexión a la base de datos
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida');
        
        // Verificar conexión SMTP (opcional)
        if (process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS) {
            await EmailService.verifyConnection();
        } else {
            console.log('⚠️  Variables de entorno de Mailtrap no configuradas');
        }
        
        // Inicializar modelos
        const models = initModels(sequelize);
        console.log('🔧 Modelos inicializados');
        
     
        await syncDatabase(sequelize, false);
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
        });
        
    } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
        process.exit(1);
    }
}

initialize();


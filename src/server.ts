import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sequelize from './config/database';
import { initModels, syncDatabase } from './models';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import { EmailService } from './services/emailService';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

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


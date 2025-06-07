import sequelize from '../config/database';
import { initModels } from '../models';
import bcrypt from 'bcrypt';

// Datos de usuarios para la migración
const usersData = [
  {
    name: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@email.com',
    region: 'Metropolitana',
    city: 'Santiago',
    phone: '+56912345678',
    password: 'MiPassword123!',
    role: 'seeker' as const,
    bio: 'Estudiante de ingeniería buscando habitación cerca de la universidad.',
    habits: 'No fumo, soy ordenada y me gusta estudiar en casa.',
    isEmailVerified: true,
  },
  {
    name: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@email.com',
    region: 'Valparaíso',
    city: 'Viña del Mar',
    phone: '+56923456789',
    password: 'CarlosPass456!',
    role: 'host' as const,
    bio: 'Propietario de departamento céntrico con vista al mar.',
    habits: 'Tranquilo, respeto el espacio personal y soy muy comunicativo.',
    isEmailVerified: true,
  },
  {
    name: 'Ana',
    lastName: 'Martínez',
    email: 'ana.martinez@email.com',
    region: 'Biobío',
    city: 'Concepción',
    phone: '+56934567890',
    password: 'AnaSecure789!',
    role: 'seeker' as const,
    bio: 'Profesional joven trabajando en el centro de la ciudad.',
    habits: 'Deportista, madrugadora y muy limpia.',
    isEmailVerified: true,
  },
  {
    name: 'Luis',
    lastName: 'Fernández',
    email: 'luis.fernandez@email.com',
    region: 'Valparaíso',
    city: 'Valparaíso',
    phone: '+56945678901',
    password: 'LuisKey012!',
    role: 'host' as const,
    bio: 'Anfitrión experimentado con múltiples propiedades en el puerto.',
    habits: 'Sociable, me gusta cocinar y organizar asados los fines de semana.',
    isEmailVerified: true,
  },
  {
    name: 'Sofía',
    lastName: 'López',
    email: 'sofia.lopez@email.com',
    region: 'Metropolitana',
    city: 'Las Condes',
    phone: '+56956789012',
    password: 'SofiaPass345!',
    role: 'seeker' as const,
    bio: 'Profesional en marketing digital buscando ambiente tranquilo.',
    habits: 'Vegetariana, practico yoga y trabajo desde casa ocasionalmente.',
    isEmailVerified: false,
  },
  {
    name: 'Diego',
    lastName: 'Vargas',
    email: 'diego.vargas@email.com',
    region: 'Coquimbo',
    city: 'La Serena',
    phone: '+56967890123',
    password: 'Diego678Pass!',
    role: 'host' as const,
    bio: 'Dueño de casa familiar con habitaciones disponibles.',
    habits: 'Tranquilo, responsable y me gusta mantener la casa ordenada.',
    isEmailVerified: true,
  },
  {
    name: 'Valentina',
    lastName: 'Silva',
    email: 'valentina.silva@email.com',
    region: 'La Araucanía',
    city: 'Temuco',
    phone: '+56978901234',
    password: 'ValeSecure901!',
    role: 'seeker' as const,
    bio: 'Estudiante de medicina en búsqueda de habitación cerca del hospital.',
    habits: 'Estudiosa, no hago fiestas y soy muy respetuosa con los horarios.',
    isEmailVerified: true,
  },
  {
    name: 'Andrés',
    lastName: 'Morales',
    email: 'andres.morales@email.com',
    region: 'Maule',
    city: 'Talca',
    phone: '+56989012345',
    password: 'AndresKey234!',
    role: 'host' as const,
    bio: 'Propietario de casa grande con patio y estacionamiento.',
    habits: 'Me gusta la música, tengo mascotas y soy muy flexible con las reglas.',
    isEmailVerified: false,
  },
  {
    name: 'Camila',
    lastName: 'Herrera',
    email: 'camila.herrera@email.com',
    region: 'Metropolitana',
    city: 'Providencia',
    phone: '+56990123456',
    password: 'CamilaPass567!',
    role: 'seeker' as const,
    bio: 'Diseñadora gráfica freelance buscando ambiente creativo.',
    habits: 'Artística, trabajo en horarios flexibles y me gusta la decoración.',
    isEmailVerified: true,
  },
  {
    name: 'Javier',
    lastName: 'Castro',
    email: 'javier.castro@email.com',
    region: 'Los Lagos',
    city: 'Puerto Montt',
    phone: '+56901234567',
    password: 'JavierSafe890!',
    role: 'host' as const,
    bio: 'Anfitrión con departamento amoblado cerca del centro.',
    habits: 'Puntual, ordenado y me gusta conocer gente de diferentes culturas.',
    isEmailVerified: true,
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Iniciando migración de usuarios...');

    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    // Inicializar modelos
    const models = initModels(sequelize);
    const { User } = models;

    let usersCreated = 0;
    let usersSkipped = 0;

    for (const userData of usersData) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ 
          where: { email: userData.email } 
        });

        if (existingUser) {
          console.log(`⚠️  Usuario ${userData.email} ya existe, omitiendo...`);
          usersSkipped++;
          continue;
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Crear el usuario
        const newUser = await User.create({
          ...userData,
          password: hashedPassword,
          profilePhoto: '', // Campo vacío por defecto
        });

        console.log(`✅ Usuario creado: ${newUser.name} ${newUser.lastName} (${newUser.email})`);
        usersCreated++;

      } catch (userError: any) {
        console.error(`❌ Error creando usuario ${userData.email}:`, userError.message);
      }
    }

    console.log('\n📊 Resumen de la migración:');
    console.log(`   - Usuarios creados: ${usersCreated}`);
    console.log(`   - Usuarios omitidos: ${usersSkipped}`);
    console.log(`   - Total procesados: ${usersData.length}`);

    if (usersCreated > 0) {
      console.log('\n🎉 Migración de usuarios completada exitosamente');
    } else {
      console.log('\nℹ️  No se crearon nuevos usuarios (todos ya existían)');
    }

  } catch (error: any) {
    console.error('❌ Error en la migración de usuarios:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión a la base de datos cerrada');
  }
}

// Ejecutar la migración si el script se ejecuta directamente
if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log('✅ Script de migración ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script de migración:', error);
      process.exit(1);
    });
}

export default seedUsers; 
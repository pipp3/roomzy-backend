import { Sequelize } from 'sequelize';
import UserModel, { User } from './User';

// Interfaz para los modelos
interface Models {
  User: typeof User;
}

// Función para inicializar todos los modelos
export const initModels = (sequelize: Sequelize): Models => {
  // Inicializar el modelo User
  const User = UserModel(sequelize);

  // Aquí puedes agregar más modelos en el futuro
  // const Property = PropertyModel(sequelize);
  // const Booking = BookingModel(sequelize);

  // Definir asociaciones aquí cuando tengas más modelos
  // User.hasMany(Property);
  // Property.belongsTo(User);

  return {
    User,
    // Agregar más modelos aquí cuando los tengas
  };
};

// Función para sincronizar la base de datos
export const syncDatabase = async (sequelize: Sequelize, force: boolean = false): Promise<void> => {
  try {
    // force: true elimina las tablas existentes y las recrea
    // force: false solo crea las tablas si no existen
    await sequelize.sync({ force });
    
    if (force) {
      console.log('🗄️  Base de datos reiniciada y sincronizada');
    } else {
      console.log('🗄️  Base de datos sincronizada');
    }
  } catch (error) {
    console.error('❌ Error sincronizando la base de datos:', error);
    throw error;
  }
};

export default initModels; 
import sequelize from '../config/database';
import { QueryInterface, DataTypes } from 'sequelize';

async function addPasswordResetFields() {
  const queryInterface: QueryInterface = sequelize.getQueryInterface();

  try {
    console.log('🔄 Agregando campos de restablecimiento de contraseña...');

    // Verificar si los campos ya existen
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.passwordResetCode) {
      await queryInterface.addColumn('users', 'passwordResetCode', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      });
      console.log('✅ Campo passwordResetCode agregado');
    } else {
      console.log('ℹ️  Campo passwordResetCode ya existe');
    }

    if (!tableDescription.passwordResetExpires) {
      await queryInterface.addColumn('users', 'passwordResetExpires', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      });
      console.log('✅ Campo passwordResetExpires agregado');
    } else {
      console.log('ℹ️  Campo passwordResetExpires ya existe');
    }

    console.log('🎉 Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar la migración si el script se ejecuta directamente
if (require.main === module) {
  addPasswordResetFields()
    .then(() => {
      console.log('✅ Script de migración ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script de migración:', error);
      process.exit(1);
    });
}

export default addPasswordResetFields; 
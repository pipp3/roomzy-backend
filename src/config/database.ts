import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseURL= process.env.DATABASE_URL as string;

if(!databaseURL){
    throw new Error('DATABASE_URL is not set');
}

const sequelize = new Sequelize(databaseURL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

export default sequelize;


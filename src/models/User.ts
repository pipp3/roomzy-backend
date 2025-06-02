import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import bcrypt from 'bcrypt';

// Definir los atributos del usuario
interface UserAttributes {
    id: number;
    name: string;
    lastName: string;
    email: string;
    region: string;
    city: string;
    phone: string;
    bio: string;
    habits: string;
    profilePhoto: string;
    password: string;
    role: 'admin' | 'seeker' | 'host';
    isEmailVerified: boolean;
    emailVerificationCode: string | null;
    emailVerificationExpires: Date | null;
    passwordResetCode: string | null;
    passwordResetExpires: Date | null;
}

// Definir los atributos de creación (sin id y con campos opcionales)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'bio' | 'habits' | 'profilePhoto' | 'isEmailVerified' | 'emailVerificationCode' | 'emailVerificationExpires' | 'passwordResetCode' | 'passwordResetExpires'> {}

// Definir la clase del modelo
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public name!: string;
    public lastName!: string;
    public email!: string;
    public region!: string;
    public city!: string;
    public phone!: string;
    public bio!: string;
    public habits!: string;
    public profilePhoto!: string;
    public password!: string;
    public role!: 'admin' | 'seeker' | 'host';
    public isEmailVerified!: boolean;
    public emailVerificationCode!: string | null;
    public emailVerificationExpires!: Date | null;
    public passwordResetCode!: string | null;
    public passwordResetExpires!: Date | null;

    // Timestamps opcionales
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Método para verificar contraseña
    public async checkPassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }

    // Método para hashear contraseña antes de guardar
    public async hashPassword(): Promise<void> {
        if (this.password) {
            const saltRounds = 10;
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
    }

    // Generar código de verificación de email
    public generateEmailVerificationCode(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    }

    // Establecer código de verificación con expiración
    public async setVerificationCode(): Promise<string> {
        const code = this.generateEmailVerificationCode();
        const hashedCode = await bcrypt.hash(code, 10);
        
        this.emailVerificationCode = hashedCode;
        this.emailVerificationExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
        
        await this.save();
        return code; // Retornamos el código sin hashear para enviarlo por email
    }

    // Verificar código de verificación
    public async verifyEmailCode(inputCode: string): Promise<boolean> {
        if (!this.emailVerificationCode || !this.emailVerificationExpires) {
            return false;
        }

        // Verificar si el código ha expirado
        if (new Date() > this.emailVerificationExpires) {
            await this.clearVerificationCode();
            return false;
        }

        // Verificar el código
        const isValid = await bcrypt.compare(inputCode.toUpperCase(), this.emailVerificationCode);
        
        if (isValid) {
            // Marcar como verificado y limpiar código
            this.isEmailVerified = true;
            await this.clearVerificationCode();
            await this.save();
        }

        return isValid;
    }

    // Limpiar código de verificación
    public async clearVerificationCode(): Promise<void> {
        this.emailVerificationCode = null;
        this.emailVerificationExpires = null;
        await this.save();
    }

    // Establecer código de restablecimiento de contraseña
    public async setPasswordResetCode(): Promise<string> {
        const code = this.generateEmailVerificationCode(); // Reutilizamos el mismo generador
        const hashedCode = await bcrypt.hash(code, 10);
        
        this.passwordResetCode = hashedCode;
        this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
        
        await this.save();
        return code; // Retornamos el código sin hashear para enviarlo por email
    }

    // Verificar código de restablecimiento de contraseña
    public async verifyPasswordResetCode(inputCode: string): Promise<boolean> {
        if (!this.passwordResetCode || !this.passwordResetExpires) {
            return false;
        }

        // Verificar si el código ha expirado
        if (new Date() > this.passwordResetExpires) {
            await this.clearPasswordResetCode();
            return false;
        }

        // Verificar el código
        const isValid = await bcrypt.compare(inputCode.toUpperCase(), this.passwordResetCode);
        
        return isValid;
    }

    // Limpiar código de restablecimiento de contraseña
    public async clearPasswordResetCode(): Promise<void> {
        this.passwordResetCode = null;
        this.passwordResetExpires = null;
        await this.save();
    }

    // Restablecer contraseña con código
    public async resetPasswordWithCode(inputCode: string, newPassword: string): Promise<boolean> {
        const isValidCode = await this.verifyPasswordResetCode(inputCode);
        
        if (!isValidCode) {
            return false;
        }

        // Cambiar la contraseña
        this.password = newPassword;
        await this.clearPasswordResetCode();
        await this.save();
        
        return true;
    }
}

// Función para inicializar el modelo
export default (sequelize: Sequelize) => {
    User.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [2, 50],
                },
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [2, 50],
                },
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                    notEmpty: true,
                    isLowercase: true,
                },
            },
            region: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            city: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                },
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [12, 12], // +56 + 9 dígitos = 12 caracteres exactos
                    isChileanPhone(value: string) {
                        // Validar formato +56 seguido de 9 dígitos que empiecen con 9
                        const chileanPhoneRegex = /^\+569[0-9]{8}$/;
                        if (!chileanPhoneRegex.test(value)) {
                            throw new Error('El teléfono debe ser un número chileno válido (+569XXXXXXXX)');
                        }
                    }
                },
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: '',
                validate: {
                    len: [0, 500],
                },
            },
            habits: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: '',
            },
            profilePhoto: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: '',
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [8, 100],
                    isStrongPassword(value: string) {
                        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                            throw new Error('La contraseña debe contener al menos una minúscula, una mayúscula y un número');
                        }
                    }
                },
            },
            role: {
                type: DataTypes.ENUM('admin', 'seeker', 'host'),
                allowNull: false,
                defaultValue: 'seeker',
            },
            isEmailVerified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            emailVerificationCode: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: null,
            },
            emailVerificationExpires: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: null,
            },
            passwordResetCode: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: null,
            },
            passwordResetExpires: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: null,
            },
        },
        {
            sequelize,
            modelName: 'User',
            tableName: 'users',
            timestamps: true,
            hooks: {
                beforeCreate: async (user: User) => {
                    await user.hashPassword();
                },
                beforeUpdate: async (user: User) => {
                    if (user.changed('password')) {
                        await user.hashPassword();
                    }
                },
            },
        }
    );

    return User;
};

export { User, UserAttributes, UserCreationAttributes };

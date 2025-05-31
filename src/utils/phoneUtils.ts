export class ChileanPhoneUtils {
    
    /**
     * Valida que el número ingresado tenga el formato correcto para Chile
     * Acepta: 9XXXXXXXX (9 dígitos empezando con 9)
     */
    static isValidInput(phone: string): boolean {
        // Remover espacios y caracteres especiales
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        
        // Debe tener exactamente 9 dígitos y empezar con 9
        const inputRegex = /^9[0-9]{8}$/;
        return inputRegex.test(cleaned);
    }

    /**
     * Formatea el número chileno agregando +56
     * Input: 987654321 -> Output: +56987654321
     */
    static formatForDatabase(phone: string): string {
        // Limpiar el input
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        
        // Validar antes de formatear
        if (!this.isValidInput(cleaned)) {
            throw new Error('Número de teléfono chileno inválido');
        }
        
        return `+56${cleaned}`;
    }

    /**
     * Formatea el número para mostrar al usuario
     * Input: +56987654321 -> Output: +56 9 8765 4321
     */
    static formatForDisplay(phone: string): string {
        if (phone.startsWith('+56')) {
            const number = phone.substring(3); // Remover +56
            // Formatear como: +56 9 XXXX XXXX
            return `+56 ${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
        }
        return phone;
    }

    /**
     * Obtiene solo el número sin código de país
     * Input: +56987654321 -> Output: 987654321
     */
    static getNumberOnly(phone: string): string {
        if (phone.startsWith('+56')) {
            return phone.substring(3);
        }
        return phone;
    }

    /**
     * Valida números de teléfono chilenos comunes
     */
    static getValidationMessage(): string {
        return 'El número debe tener 9 dígitos y empezar con 9 (ej: 987654321)';
    }

    /**
     * Ejemplos de números válidos para mostrar al usuario
     */
    static getExamples(): string[] {
        return [
            '987654321',
            '912345678', 
            '956789012',
            '998877665'
        ];
    }
} 
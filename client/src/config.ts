/**
 * Application Configuration
 * Automatically switches between development and production based on MODE
 */

// Check if we're in production mode
const isProduction = import.meta.env.MODE === 'production';

// API Base URL
export const getApiUrl = (): string => {
    return isProduction
        ? import.meta.env.VITE_PROD_BASE_URL || 'http://196.189.23.33:4000'
        : import.meta.env.VITE_DEV_BASE_URL || 'http://localhost:4000';
};

// Asterisk Server URL
export const getAsteriskUrl = (): string => {
    return isProduction
        ? import.meta.env.VITE_PROD_ASTERISK_URL || '196.189.23.33'
        : import.meta.env.VITE_DEV_ASTERISK_URL || '127.0.0.1';
};

// Export as constants for convenience
export const API_URL = getApiUrl();
export const ASTERISK_URL = getAsteriskUrl();
export const IS_PRODUCTION = isProduction;

// Log current environment (only in development)
if (!isProduction) {
    console.log('🔧 Environment:', import.meta.env.MODE);
    console.log('🌐 API URL:', API_URL);
    console.log('📞 Asterisk URL:', ASTERISK_URL);
}

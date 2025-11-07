
const isProduction = process.env.NODE_ENV === 'production';
// Default to 127.0.0.1 - can be overridden via environment variable
export const SIP_SERVER = process.env.REACT_APP_SIP_SERVER || '127.0.0.1';
export const baseUrl = isProduction
  ? process.env.REACT_APP_PROD_BASE_URL || 'https://127.0.0.1:4000/api'
  : process.env.REACT_APP_DEV_BASE_URL || 'http://127.0.0.1:4000/api';

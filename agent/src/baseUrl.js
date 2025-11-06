
const isProduction = process.env.NODE_ENV === 'production';
// Default to 192.168.1.2 - can be overridden via environment variable
export const SIP_SERVER = process.env.REACT_APP_SIP_SERVER || '192.168.1.2';
export const baseUrl = isProduction
  ? process.env.REACT_APP_PROD_BASE_URL || 'https://192.168.1.2:4000/api'
  : process.env.REACT_APP_DEV_BASE_URL || 'http://192.168.1.2:4000/api';

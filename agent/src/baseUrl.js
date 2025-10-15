
const isProduction = process.env.NODE_ENV === 'production';
export const SIP_SERVER = process.env.SIP_SERVER || '127.0.0.1';
export const baseUrl = isProduction
  ? process.env.REACT_APP_PROD_BASE_URL || 'https://localhost:4000/api'
  : process.env.REACT_APP_DEV_BASE_URL || 'http://localhost:4000/api';

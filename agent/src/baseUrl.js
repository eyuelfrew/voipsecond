
const isProduction = process.env.NODE_ENV === 'production';
export const baseUrl = isProduction 
  ? process.env.REACT_APP_PROD_BASE_URL || 'https://172.20.47.53:4000/api'
  : process.env.REACT_APP_DEV_BASE_URL || 'http://localhost:4000/api';

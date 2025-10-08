
const isProduction = process.env.NODE_ENV === 'production';
export const baseUrl = isProduction 
  ? process.env.REACT_APP_PROD_BASE_URL || 'https://10.42.0.1:4000/api'
  : process.env.REACT_APP_DEV_BASE_URL || 'http://localhost:4000/api';

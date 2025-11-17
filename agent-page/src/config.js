// API Configuration
export const getApiUrl = () => {
  const isProduction = import.meta.env.MODE === 'production';
  return isProduction
    ? import.meta.env.VITE_PROD_BASE_URL || 'https://127.0.0.1:4000/api'
    : import.meta.env.VITE_DEV_BASE_URL || 'http://127.0.0.1:4000/api';
};

// SIP Configuration
export const getSipServer = () => import.meta.env.VITE_SIP_SERVER || '127.0.0.1';
export const getSipPort = () => import.meta.env.VITE_SIP_SERVER_PORT || 8088;

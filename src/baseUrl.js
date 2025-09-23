
// Dynamic API URL based on environment
const getApiUrl = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return process.env.REACT_APP_PROD_BASE_URL || 'http://172.20.47.53:4000/api';
  }
  return process.env.REACT_APP_DEV_BASE_URL || 'http://localhost:4000/api';
};

export const baseUrl = getApiUrl();

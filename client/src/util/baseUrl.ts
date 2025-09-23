function getBaseUrl() { 
const isProduction = import.meta.env.MODE === 'production';

  return isProduction 
    ? import.meta.env.VITE_PROD_BASE_URL || "https://172.20.47.53:4000"
    : import.meta.env.VITE_DEV_BASE_URL || "http://localhost:4000";
}
export default getBaseUrl();
    
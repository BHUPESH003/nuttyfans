export const env = {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    APP_NAME: import.meta.env.VITE_APP_NAME || 'NuttyFans',
    NODE_ENV: import.meta.env.MODE || 'development',
    IS_DEV: import.meta.env.DEV,
    IS_PROD: import.meta.env.PROD,
} as const;

// Type for environment variables
export type Env = typeof env; 
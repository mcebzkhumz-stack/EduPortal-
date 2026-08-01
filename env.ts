import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || '3000',
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING || 'mongodb://localhost:27017/mydatabase',
  API_KEY: process.env.API_KEY || 'dev-api-key',
  BACKUP_PATH: process.env.BACKUP_PATH || './backups',
  SYNC_INTERVAL: Number.parseInt(process.env.SYNC_INTERVAL || '60000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  REMOTE_SYNC_ENABLED: (process.env.REMOTE_SYNC_ENABLED || 'false').toLowerCase() === 'true',
  REMOTE_SYNC_ENDPOINT: process.env.REMOTE_SYNC_ENDPOINT || '',
  REMOTE_SYNC_API_KEY: process.env.REMOTE_SYNC_API_KEY || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  FIREBASE_URL: process.env.FIREBASE_URL || '',
  FIREBASE_AUTH_TOKEN: process.env.FIREBASE_AUTH_TOKEN || ''
};

export const ENV = config;
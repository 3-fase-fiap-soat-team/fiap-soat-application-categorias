import { registerAs } from '@nestjs/config';

/**
 * Database configuration for cloud-native deployment (EKS + RDS)
 * All environment variables are required - no fallback to localhost
 */
export const databaseConfig = registerAs('database', () => {
  // Validate required database variables
  const requiredVars = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
  ];

  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}`
    );
  }

  return {
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DATABASE_PORT!, 10),
    username: process.env.DATABASE_USERNAME!,
    password: process.env.DATABASE_PASSWORD!,
    name: process.env.DATABASE_NAME!,
    ssl: process.env.DATABASE_SSL !== 'false', // Default to true for AWS RDS
  };
});

/**
 * Application configuration
 */
export const appConfig = registerAs('app', () => ({
  environment: process.env.NODE_ENV || 'production',
  port: parseInt(process.env.PORT || '3000', 10),
}));

/**
 * AWS configuration (optional - for Parameter Store or Secrets Manager)
 */
export const awsConfig = registerAs('aws', () => ({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
}));

/**
 * TypeORM configuration for cloud deployment
 * Optimized for production environments (EKS + RDS)
 */
export const getTypeOrmConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const dbHost = process.env.DATABASE_HOST;
  const dbPort = parseInt(process.env.DATABASE_PORT!, 10);
  const dbUsername = process.env.DATABASE_USERNAME;
  const dbPassword = process.env.DATABASE_PASSWORD;
  const dbName = process.env.DATABASE_NAME;

  // Validate required variables
  if (!dbHost || !dbPort || !dbUsername || !dbPassword || !dbName) {
    throw new Error('Missing required database configuration');
  }

  return {
    type: 'postgres' as const,
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    database: dbName,

    // SSL configuration - required for AWS RDS
    ssl: process.env.DATABASE_SSL !== 'false' ? {
      rejectUnauthorized: false, // AWS RDS requires this
    } : false,

    // Connection pool settings for production
    extra: {
      connectionLimit: isProduction ? 10 : 5,
      acquireTimeout: 60000,
      timeout: 60000,
    },

    // Logging configuration
    logging: isProduction ? ['error'] as any : ['query', 'error', 'warn'] as any,

    // Performance monitoring
    maxQueryExecutionTime: isProduction ? 5000 : 1000,

    // Entity and migration settings
    autoLoadEntities: true,
    synchronize: false, // Always false for safety
    migrationsRun: false, // Run migrations manually

    // Retry configuration for cloud environments
    retryAttempts: 3,
    retryDelay: 3000,
  };
};
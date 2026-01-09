import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'postgres',
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false, // Para AWS RDS
  } : false,
  entities: [],
  migrations: isProduction ? ['dist/migrations/*.js'] : ['migrations/*.ts'],
});

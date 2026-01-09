import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async getHealth() {
    const startTime = Date.now();
    
    try {
      // Teste de conectividade básico
      await this.dataSource.query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;

      const options = this.dataSource.options as any; // Type assertion para acessar propriedades

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          host: options.host || 'unknown',
          port: options.port || 'unknown',
          database: options.database || 'unknown',
          ssl: !!options.ssl,
          responseTime: `${responseTime}ms`,
        },
        application: {
          environment: process.env?.NODE_ENV || 'development',
          version: '1.0.0',
        }
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const options = this.dataSource.options as any;
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          host: options.host || 'unknown',
          port: options.port || 'unknown',
          error: error.message || 'Unknown error',
          responseTime: `${responseTime}ms`,
        },
        application: {
          environment: process.env?.NODE_ENV || 'development',
          version: '1.0.0',
        }
      };
    }
  }

  @Get('database')
  async getDatabaseHealth() {
    const startTime = Date.now();
    
    try {
      // Teste detalhado do banco
      const version = await this.dataSource.query('SELECT version() as version');
      const timestamp = await this.dataSource.query('SELECT current_timestamp as timestamp');
      const connections = await this.dataSource.query(
        'SELECT count(*) as count FROM pg_stat_activity WHERE state = \'active\''
      );
      
      const responseTime = Date.now() - startTime;
      const options = this.dataSource.options as any;

      return {
        status: 'healthy',
        connection: {
          host: options.host || 'unknown',
          port: options.port || 'unknown',
          database: options.database || 'unknown',
          ssl: !!options.ssl,
          responseTime: `${responseTime}ms`,
        },
        server: {
          version: version[0]?.version || 'unknown',
          timestamp: timestamp[0]?.timestamp || new Date().toISOString(),
          activeConnections: connections[0]?.count || 0,
        }
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const options = this.dataSource.options as any;
      
      return {
        status: 'unhealthy',
        connection: {
          host: options.host || 'unknown',
          port: options.port || 'unknown',
          error: error.message || 'Unknown error',
          responseTime: `${responseTime}ms`,
        }
      };
    }
  }
}
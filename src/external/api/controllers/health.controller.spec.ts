import { HealthController } from './health.controller';

describe('HealthController', () => {
  const mockDataSource: any = { query: jest.fn(), options: { host: 'h', port: 1, database: 'db', ssl: false } };
  const controller = new HealthController(mockDataSource as any);

  afterEach(() => jest.restoreAllMocks());

  it('getHealth returns healthy when query succeeds', async () => {
    (mockDataSource.query as jest.Mock).mockResolvedValue([{ hello: 'ok' }]);
    const res = await controller.getHealth();
    expect(res.status).toBe('healthy');
    expect(res.database.status).toBe('connected');
  });

  it('getHealth returns unhealthy on error', async () => {
    (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('fail'));
    const res = await controller.getHealth();
    expect(res.status).toBe('unhealthy');
    expect(res.database.status).toBe('disconnected');
  });

  it('getDatabaseHealth returns healthy on success', async () => {
    (mockDataSource.query as jest.Mock).mockResolvedValueOnce([{ version: 'v' }]).mockResolvedValueOnce([{ timestamp: 't' }]).mockResolvedValueOnce([{ count: 2 }]);
    const res = await controller.getDatabaseHealth();
    expect(res.status).toBe('healthy');
    expect(res.server).toBeDefined();
    expect((res as any).server.version).toBe('v');
  });

  it('getDatabaseHealth returns unhealthy on error', async () => {
    (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('fail'));
    const res = await controller.getDatabaseHealth();
    expect(res.status).toBe('unhealthy');
  });
});

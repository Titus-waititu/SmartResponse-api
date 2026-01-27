import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { ConfigService } from '@nestjs/config';

//mock the neon function
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => jest.fn()),
}));
describe('DatabaseService', () => {
  let service: DatabaseService;
  let mocksql: jest.Mock;
  let configService: ConfigService;

  beforeEach(async () => {
    //create a mock sql function
    mocksql = jest.fn();

    //mock the neon module
    const { neon } = await import('@neondatabase/serverless');
    (neon as jest.Mock).mockReturnValue(mocksql);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest
              .fn()
              .mockReturnValue('postgresql://mock-database-url'),
          },
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    configService = module.get<ConfigService>(ConfigService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with database URL from config', () => {
    expect(configService.getOrThrow).toHaveBeenCalledWith('DATABASE_URL');
  });

  describe('getData', () => {
    it('should fetch data from database', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      mocksql.mockResolvedValueOnce(mockData);

      const result = await service.getData();

      expect(result).toEqual(mockData);
      expect(mocksql).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      mocksql.mockRejectedValueOnce(mockError);

      await expect(service.getData()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});

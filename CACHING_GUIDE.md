# Redis Caching Guide

## Overview

The application uses a multi-tier caching strategy with both in-memory (CacheableMemory) and distributed (Redis) caching.

## Configuration

### Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
REDIS_URL=redis://:redispassword@localhost:6379
CACHE_TTL=60000  # Default cache TTL in milliseconds
```

### Cache Setup

The cache is configured globally in `app.module.ts` with:

- **Memory Store**: Fast local cache (30s TTL, 5000 items max)
- **Redis Store**: Distributed cache for scaling
- **Default TTL**: 60 seconds (60000ms)

## Usage Methods

### 1. Global Caching (Automatic)

The `CacheInterceptor` is registered globally, so ALL GET requests are automatically cached by default.

**To disable caching on specific routes:**

```typescript
import { SetMetadata } from '@nestjs/common';

export const NO_CACHE_KEY = 'no_cache';
export const NoCache = () => SetMetadata(NO_CACHE_KEY, true);

// In controller:
@Get()
@NoCache()
findAll() {
  // This endpoint will NOT be cached
}
```

### 2. Controller-Level Caching

Apply caching to all routes in a controller:

```typescript
import { Controller, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('users')
@UseInterceptors(CacheInterceptor)
@CacheTTL(120000) // 2 minutes for all routes
export class UsersController {
  // All GET routes here will be cached for 2 minutes
}
```

### 3. Route-Level Caching

Apply caching to specific routes with custom TTL:

```typescript
import { Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL, CacheKey } from '@nestjs/cache-manager';

@Get('stats')
@UseInterceptors(CacheInterceptor)
@CacheTTL(300000) // Cache for 5 minutes
@CacheKey('user_stats') // Custom cache key
getStats() {
  return this.usersService.getStatistics();
}
```

### 4. Manual Cache Management in Services

Inject the cache manager to manually control caching:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async findOne(id: string) {
    // Try to get from cache
    const cacheKey = `user_${id}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      console.log('Cache hit:', cacheKey);
      return cached;
    }

    // If not in cache, fetch from database
    const user = await this.userRepository.findOne({ where: { id } });

    // Store in cache for 5 minutes
    await this.cacheManager.set(cacheKey, user, 300000);

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto) {
    const user = await this.userRepository.update(id, data);

    // Invalidate cache after update
    await this.cacheManager.del(`user_${id}`);

    return user;
  }

  async clearAllUserCache() {
    // Clear all cache (use carefully!)
    await this.cacheManager.reset();
  }
}
```

### 5. Cache with Query Parameters

When caching routes with query parameters, the cache key automatically includes them:

```typescript
@Get()
@UseInterceptors(CacheInterceptor)
@CacheTTL(60000)
findAll(@Query('page') page: number, @Query('limit') limit: number) {
  // Cache key will be: /users?page=1&limit=10
  return this.usersService.findAll(page, limit);
}
```

### 6. Custom Cache Key Strategy

Create custom cache keys based on request data:

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { httpAdapter } = this.httpAdapterHost;

    // Include user ID in cache key
    const userId = request.user?.id;
    const url = httpAdapter.getRequestUrl(request);

    return userId ? `${userId}_${url}` : url;
  }
}

// Use in controller:
@UseInterceptors(HttpCacheInterceptor)
```

## Cache Manager API

### Available Methods

```typescript
// Set cache with TTL (milliseconds)
await cacheManager.set('key', value, 60000);

// Get cache
const value = await cacheManager.get('key');

// Delete specific cache
await cacheManager.del('key');

// Delete multiple caches
await cacheManager.del(['key1', 'key2']);

// Clear all cache
await cacheManager.reset();

// Get cache store (for advanced operations)
const store = cacheManager.store;
```

## Best Practices

### 1. Cache What's Expensive

Cache data that is:

- Expensive to compute
- Rarely changes
- Frequently accessed
- Not user-specific (or properly keyed by user)

```typescript
// Good candidates for caching:
- Statistics and analytics
- Configuration data
- Lookup tables
- Paginated list views
- External API responses
```

### 2. Set Appropriate TTLs

```typescript
// Short TTL (30s - 2min) - Frequently changing data
@CacheTTL(60000) // 1 minute
getRecentAccidents() {}

// Medium TTL (5min - 30min) - Moderately dynamic data
@CacheTTL(300000) // 5 minutes
getUserStatistics() {}

// Long TTL (1hr+) - Static/rare changes
@CacheTTL(3600000) // 1 hour
getEmergencyServices() {}
```

### 3. Cache Invalidation

Always invalidate cache when data changes:

```typescript
@Patch(':id')
async update(@Param('id') id: string, @Body() dto: UpdateDto) {
  const result = await this.service.update(id, dto);

  // Invalidate related caches
  await this.cacheManager.del(`user_${id}`);
  await this.cacheManager.del('user_list');
  await this.cacheManager.del('user_stats');

  return result;
}
```

### 4. Cache Warming

Pre-populate cache for frequently accessed data:

```typescript
@Injectable()
export class CacheWarmupService implements OnModuleInit {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private usersService: UsersService,
  ) {}

  async onModuleInit() {
    // Warm up cache on application start
    const stats = await this.usersService.getStatistics();
    await this.cacheManager.set('user_stats', stats, 300000);
  }
}
```

### 5. Avoid Caching Sensitive Data

```typescript
// DON'T cache:
- Passwords or tokens
- Personal sensitive information (unless encrypted)
- Real-time critical data
- User-specific private data without proper isolation

// DO cache:
- Public data
- Aggregated statistics
- Static content
- Properly isolated user data with user-specific keys
```

## Monitoring Cache

### Check Cache Hit/Miss Rates

Add logging to track cache performance:

```typescript
@Injectable()
export class CacheMonitorInterceptor extends CacheInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const key = this.trackBy(context);
    const cached = await this.cacheManager.get(key);

    if (cached) {
      console.log(`[CACHE HIT] ${key}`);
    } else {
      console.log(`[CACHE MISS] ${key}`);
    }

    return super.intercept(context, next);
  }
}
```

### Redis CLI Commands

```bash
# Connect to Redis
docker exec -it smartresponse-redis-dev redis-cli -a redispassword

# View all keys
KEYS *

# Get specific key
GET user_stats

# Get key TTL
TTL user_stats

# Delete key
DEL user_stats

# Flush all cache
FLUSHALL

# Get cache info
INFO

# Monitor cache activity (real-time)
MONITOR
```

### Check Cache from Application

```typescript
@Get('cache/info')
async getCacheInfo(@Inject(CACHE_MANAGER) cacheManager: Cache) {
  const store = cacheManager.store;
  // Implementation depends on cache store type
  return {
    message: 'Cache is working',
    redisConnection: 'Connected'
  };
}
```

## Testing Cache

### Test Cache Functionality

```typescript
// users.controller.spec.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('UsersController', () => {
  let controller: UsersController;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should use cache on second call', async () => {
    const mockData = { id: '1', name: 'John' };

    // First call - cache miss
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

    await controller.findOne('1');
    expect(cacheManager.set).toHaveBeenCalled();

    // Second call - cache hit
    jest.spyOn(cacheManager, 'get').mockResolvedValue(mockData);

    const result = await controller.findOne('1');
    expect(result).toEqual(mockData);
  });
});
```

## Troubleshooting

### Cache Not Working

1. **Check Redis connection:**

   ```bash
   docker exec smartresponse-redis-dev redis-cli -a redispassword ping
   ```

2. **Verify environment variables:**

   ```bash
   echo $REDIS_URL
   ```

3. **Check application logs:**
   Look for "Cache configuration - Redis URL:" log on startup

4. **Test cache manually:**
   ```typescript
   @Get('test-cache')
   async testCache(@Inject(CACHE_MANAGER) cacheManager: Cache) {
     await cacheManager.set('test_key', 'test_value', 60000);
     const value = await cacheManager.get('test_key');
     return { cached: value };
   }
   ```

### Cache Not Invalidating

Ensure you're calling `cacheManager.del()` or `cacheManager.reset()` when data changes.

### Memory Issues

If memory usage is too high:

1. Reduce `lruSize` in memory store
2. Reduce TTL values
3. Be more selective about what you cache

## Performance Tips

1. **Use Redis for distributed caching** - Essential for multi-instance deployments
2. **Use memory cache for hot data** - Faster than Redis for frequently accessed data
3. **Monitor cache size** - Don't cache everything
4. **Set reasonable TTLs** - Balance freshness vs performance
5. **Use cache warming** - Pre-populate cache for common queries
6. **Implement cache tags** - Group related cache entries for bulk invalidation

## Example Implementation

See [users.controller.ts](src/users/users.controller.ts#L82-L87) for a working example of caching with custom TTL and cache key.

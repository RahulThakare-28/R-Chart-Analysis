/**
 * Configuration Management
 * Loads and validates environment variables and configuration files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database: string;
  url?: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
}

export interface BrokerConfig {
  [key: string]: {
    apiKey: string;
    apiSecret?: string;
    endpoint: string;
    enabled: boolean;
  };
}

export interface GeminiConfig {
  apiKey?: string;
  enabled: boolean;
  model: string;
  cache: {
    enabled: boolean;
    ttl: number;
  };
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  wsPort: number;
  apiTimeout: number;
  maxRetries: number;
  logLevel: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  brokers: BrokerConfig;
  gemini: GeminiConfig;
  cors: {
    origin: string[];
  };
}

class ConfigLoader {
  private config: AppConfig = {} as AppConfig;

  /**
   * Initialize configuration
   */
  initialize(): void {
    // Load env file based on NODE_ENV
    const nodeEnv = process.env.NODE_ENV || 'development';
    const envFile = path.join(process.cwd(), `.env.${nodeEnv}`);

    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
    } else {
      console.warn(`Environment file not found: ${envFile}`);
    }

    // Load configuration
    this.loadEnvironmentConfig();
    this.loadBrokerConfig();
    this.validateConfig();
  }

  /**
   * Load configuration from environment variables
   */
  private loadEnvironmentConfig(): void {
    const dbType = process.env.DB_TYPE || 'sqlite';

    this.config = {
      nodeEnv: (process.env.NODE_ENV as any) || 'development',
      port: parseInt(process.env.API_PORT || '3000', 10),
      wsPort: parseInt(process.env.WS_PORT || '3001', 10),
      apiTimeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      logLevel: process.env.LOG_LEVEL || 'info',
      database: this.loadDatabaseConfig(dbType),
      redis: this.loadRedisConfig(),
      brokers: {},
      gemini: this.loadGeminiConfig(),
      cors: {
        origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(','),
      },
    };
  }

  /**
   * Load database configuration
   */
  private loadDatabaseConfig(type: string): DatabaseConfig {
    if (type === 'postgresql') {
      return {
        type: 'postgresql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'chartscanai',
        url: process.env.DATABASE_URL,
      };
    }

    // Default to SQLite
    return {
      type: 'sqlite',
      database: process.env.SQLITE_PATH || path.join(process.cwd(), 'data/chartscanai.db'),
    };
  }

  /**
   * Load Redis configuration
   */
  private loadRedisConfig(): RedisConfig {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      // Parse Redis URL
      try {
        const url = new URL(redisUrl);
        return {
          host: url.hostname,
          port: parseInt(url.port, 10) || 6379,
          password: url.password || undefined,
          db: 0,
          ttl: parseInt(process.env.REDIS_TTL || '300', 10),
        };
      } catch (error) {
        console.warn('Failed to parse REDIS_URL, using defaults');
      }
    }

    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      ttl: parseInt(process.env.REDIS_TTL || '300', 10),
    };
  }

  /**
   * Load Gemini AI configuration
   */
  private loadGeminiConfig(): GeminiConfig {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const enabled = process.env.GEMINI_ENABLED !== 'false' && !!apiKey;

    return {
      apiKey,
      enabled,
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      cache: {
        enabled: process.env.GEMINI_CACHE_ENABLED !== 'false',
        ttl: parseInt(process.env.GEMINI_CACHE_TTL || '3600', 10),
      },
      rateLimits: {
        requestsPerMinute: parseInt(process.env.GEMINI_RPM || '60', 10),
        tokensPerMinute: parseInt(process.env.GEMINI_TPM || '60000', 10),
      },
    };
  }

  /**
   * Load broker configuration from api-keys.json
   */
  private loadBrokerConfig(): void {
    const apiKeysPath = path.join(process.cwd(), 'config/api-keys.json');

    try {
      if (fs.existsSync(apiKeysPath)) {
        const content = fs.readFileSync(apiKeysPath, 'utf-8');
        this.config.brokers = JSON.parse(content);
      } else {
        console.warn(`API keys file not found: ${apiKeysPath}`);
        this.config.brokers = {};
      }
    } catch (error) {
      console.error(`Failed to load broker configuration: ${error}`);
      this.config.brokers = {};
    }
  }

  /**
   * Validate required configuration
   */
  private validateConfig(): void {
    const errors: string[] = [];

    if (!this.config.database) {
      errors.push('Database configuration is missing');
    }

    if (!this.config.redis) {
      errors.push('Redis configuration is missing');
    }

    if (!this.config.port || this.config.port < 1 || this.config.port > 65535) {
      errors.push('Invalid API port');
    }

    if (!this.config.wsPort || this.config.wsPort < 1 || this.config.wsPort > 65535) {
      errors.push('Invalid WebSocket port');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Get the full configuration object
   */
  getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Get database configuration
   */
  getDatabase(): DatabaseConfig {
    return this.config.database;
  }

  /**
   * Get Redis configuration
   */
  getRedis(): RedisConfig {
    return this.config.redis;
  }

  /**
   * Get broker configuration
   */
  getBrokers(): BrokerConfig {
    return this.config.brokers;
  }

  /**
   * Get specific broker configuration
   */
  getBrokerConfig(brokerName: string) {
    return this.config.brokers[brokerName];
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.config.port;
  }

  /**
   * Get WebSocket port
   */
  getWsPort(): number {
    return this.config.wsPort;
  }

  /**
   * Get environment
   */
  getEnvironment(): string {
    return this.config.nodeEnv;
  }

  /**
   * Is production environment
   */
  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  /**
   * Is development environment
   */
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  /**
   * Get CORS origins
   */
  getCorsOrigins(): string[] {
    return this.config.cors.origin;
  }

  /**
   * Get Gemini AI configuration
   */
  getGemini(): GeminiConfig {
    return this.config.gemini;
  }
}

// Export singleton instance
const configLoader = new ConfigLoader();
configLoader.initialize();

export default configLoader;
export { ConfigLoader };

/**
 * Unit tests for Data Gateway Types
 */

import { describe, it, expect } from 'vitest';
import {
  OpenSearchQuerySchema,
  SQLQuerySchema,
  RestAPIQuerySchema,
  DataSourceQuerySchema,
  OpenSearchConfigSchema,
  SQLConfigSchema,
  RestAPIConfigSchema,
  DataSourceConfigSchema,
} from './types';

describe('Data Gateway Types', () => {
  describe('OpenSearchQuerySchema', () => {
    it('should validate minimal OpenSearch query', () => {
      const query = {
        type: 'opensearch',
      };

      const result = OpenSearchQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it('should validate complete OpenSearch query', () => {
      const query = {
        type: 'opensearch',
        index: 'analytics',
        query: { match_all: {} },
        filters: { range: { date: { gte: '2024-01-01' } } },
        aggregations: { avg_value: { avg: { field: 'value' } } },
        size: 100,
        from: 20,
        timeout: 60000,
        limit: 100,
        offset: 20,
      };

      const result = OpenSearchQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const query = {
        type: 'invalid',
      };

      const result = OpenSearchQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });
  });

  describe('SQLQuerySchema', () => {
    it('should validate minimal SQL query', () => {
      const query = {
        type: 'sql',
        query: 'SELECT * FROM users',
      };

      const result = SQLQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it('should validate SQL query with parameters', () => {
      const query = {
        type: 'sql',
        query: 'SELECT * FROM users WHERE id = ?',
        params: [123],
        timeout: 30000,
        limit: 50,
        offset: 10,
      };

      const result = SQLQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it('should reject query without query field', () => {
      const query = {
        type: 'sql',
      };

      const result = SQLQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });
  });

  describe('RestAPIQuerySchema', () => {
    it('should validate minimal REST API query', () => {
      const query = {
        type: 'rest',
        endpoint: '/api/users',
      };

      const result = RestAPIQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it('should validate complete REST API query', () => {
      const query = {
        type: 'rest',
        endpoint: '/api/users',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { name: 'John' },
        timeout: 15000,
        limit: 20,
        offset: 0,
      };

      const result = RestAPIQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it('should reject invalid method', () => {
      const query = {
        type: 'rest',
        endpoint: '/api/users',
        method: 'INVALID',
      };

      const result = RestAPIQuerySchema.safeParse(query);

      expect(result.success).toBe(false);
    });
  });

  describe('DataSourceQuerySchema', () => {
    it('should validate OpenSearch query', () => {
      const query = {
        type: 'opensearch',
        index: 'test',
      };

      const result = DataSourceQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it('should validate SQL query', () => {
      const query = {
        type: 'sql',
        query: 'SELECT 1',
      };

      const result = DataSourceQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });

    it('should validate REST query', () => {
      const query = {
        type: 'rest',
        endpoint: '/api/test',
      };

      const result = DataSourceQuerySchema.safeParse(query);

      expect(result.success).toBe(true);
    });
  });

  describe('OpenSearchConfigSchema', () => {
    it('should validate minimal OpenSearch config', () => {
      const config = {
        type: 'opensearch',
        name: 'test-opensearch',
        windmillToken: 'test-token',
      };

      const result = OpenSearchConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should validate complete OpenSearch config', () => {
      const config = {
        type: 'opensearch',
        name: 'test-opensearch',
        windmillToken: 'test-token',
        windmillBaseUrl: 'https://test.windmill.dev',
        windmillWorkspace: 'test-workspace',
        windmillScriptPath: 'test/script',
      };

      const result = OpenSearchConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should reject config without token', () => {
      const config = {
        type: 'opensearch',
        name: 'test-opensearch',
      };

      const result = OpenSearchConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });
  });

  describe('SQLConfigSchema', () => {
    it('should validate minimal SQL config', () => {
      const config = {
        type: 'sql',
        name: 'test-postgres',
        driver: 'postgres',
        database: 'testdb',
      };

      const result = SQLConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should validate complete SQL config', () => {
      const config = {
        type: 'sql',
        name: 'test-postgres',
        driver: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'admin',
        password: 'secret',
        connectionString: 'postgresql://localhost/testdb',
      };

      const result = SQLConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should reject invalid driver', () => {
      const config = {
        type: 'sql',
        name: 'test-db',
        driver: 'oracle',
        database: 'testdb',
      };

      const result = SQLConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });
  });

  describe('RestAPIConfigSchema', () => {
    it('should validate minimal REST config', () => {
      const config = {
        type: 'rest',
        name: 'test-api',
        baseUrl: 'https://api.example.com',
      };

      const result = RestAPIConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should validate complete REST config', () => {
      const config = {
        type: 'rest',
        name: 'test-api',
        baseUrl: 'https://api.example.com',
        authType: 'bearer',
        authToken: 'test-token',
        defaultHeaders: { 'X-API-Version': 'v1' },
      };

      const result = RestAPIConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should reject invalid authType', () => {
      const config = {
        type: 'rest',
        name: 'test-api',
        baseUrl: 'https://api.example.com',
        authType: 'oauth',
      };

      const result = RestAPIConfigSchema.safeParse(config);

      expect(result.success).toBe(false);
    });
  });

  describe('DataSourceConfigSchema', () => {
    it('should validate OpenSearch config', () => {
      const config = {
        type: 'opensearch',
        name: 'test',
        windmillToken: 'token',
      };

      const result = DataSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should validate SQL config', () => {
      const config = {
        type: 'sql',
        name: 'test',
        driver: 'postgres',
        database: 'testdb',
      };

      const result = DataSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });

    it('should validate REST config', () => {
      const config = {
        type: 'rest',
        name: 'test',
        baseUrl: 'https://api.test.com',
      };

      const result = DataSourceConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
    });
  });
});

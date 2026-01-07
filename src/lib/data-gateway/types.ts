/**
 * Data Gateway Types
 *
 * Core type definitions for the data gateway plugin system.
 * Provides abstraction for multiple data source types.
 *
 * @packageDocumentation
 */

import { z } from 'zod';

// ============================================================================
// Query Types
// ============================================================================

/**
 * Base query interface that all data source queries must extend.
 */
export interface BaseQuery {
  /**
   * Optional timeout for the query in milliseconds.
   */
  timeout?: number;

  /**
   * Optional limit on number of results.
   */
  limit?: number;

  /**
   * Optional offset for pagination.
   */
  offset?: number;
}

/**
 * OpenSearch-specific query structure.
 */
export interface OpenSearchQuery extends BaseQuery {
  type: 'opensearch';
  index?: string;
  query?: any;
  filters?: any;
  aggregations?: any;
  size?: number;
  from?: number;
}

/**
 * SQL query structure for relational databases.
 */
export interface SQLQuery extends BaseQuery {
  type: 'sql';
  query: string;
  params?: any[];
}

/**
 * REST API query structure.
 */
export interface RestAPIQuery extends BaseQuery {
  type: 'rest';
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Union of all supported query types.
 */
export type DataSourceQuery = OpenSearchQuery | SQLQuery | RestAPIQuery;

// ============================================================================
// Result Types
// ============================================================================

/**
 * Successful query result.
 */
export interface QuerySuccess<T = any> {
  success: true;
  data: T[];
  metadata: {
    source: string;
    executionTime: number;
    recordCount: number;
    hasMore?: boolean;
  };
}

/**
 * Query error result.
 */
export interface QueryError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    source: string;
    executionTime: number;
  };
}

/**
 * Union type for query results.
 */
export type QueryResult<T = any> = QuerySuccess<T> | QueryError;

// ============================================================================
// Data Source Configuration
// ============================================================================

/**
 * Configuration for OpenSearch/Windmill data source.
 */
export interface OpenSearchConfig {
  type: 'opensearch';
  name: string;
  windmillToken: string;
  windmillBaseUrl?: string;
  windmillWorkspace?: string;
  windmillScriptPath?: string;
}

/**
 * Configuration for SQL data source.
 */
export interface SQLConfig {
  type: 'sql';
  name: string;
  driver: 'postgres' | 'mysql' | 'mssql' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  connectionString?: string;
}

/**
 * Configuration for REST API data source.
 */
export interface RestAPIConfig {
  type: 'rest';
  name: string;
  baseUrl: string;
  authType?: 'none' | 'bearer' | 'basic' | 'apikey';
  authToken?: string;
  defaultHeaders?: Record<string, string>;
}

/**
 * Union of all data source configurations.
 */
export type DataSourceConfig = OpenSearchConfig | SQLConfig | RestAPIConfig;

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const OpenSearchQuerySchema = z.object({
  type: z.literal('opensearch'),
  timeout: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  index: z.string().optional(),
  query: z.any().optional(),
  filters: z.any().optional(),
  aggregations: z.any().optional(),
  size: z.number().optional(),
  from: z.number().optional(),
});

export const SQLQuerySchema = z.object({
  type: z.literal('sql'),
  timeout: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  query: z.string(),
  params: z.array(z.any()).optional(),
});

export const RestAPIQuerySchema = z.object({
  type: z.literal('rest'),
  timeout: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
});

export const DataSourceQuerySchema = z.union([
  OpenSearchQuerySchema,
  SQLQuerySchema,
  RestAPIQuerySchema,
]);

export const OpenSearchConfigSchema = z.object({
  type: z.literal('opensearch'),
  name: z.string(),
  windmillToken: z.string(),
  windmillBaseUrl: z.string().optional(),
  windmillWorkspace: z.string().optional(),
  windmillScriptPath: z.string().optional(),
});

export const SQLConfigSchema = z.object({
  type: z.literal('sql'),
  name: z.string(),
  driver: z.enum(['postgres', 'mysql', 'mssql', 'sqlite']),
  host: z.string().optional(),
  port: z.number().optional(),
  database: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  connectionString: z.string().optional(),
});

export const RestAPIConfigSchema = z.object({
  type: z.literal('rest'),
  name: z.string(),
  baseUrl: z.string(),
  authType: z.enum(['none', 'bearer', 'basic', 'apikey']).optional(),
  authToken: z.string().optional(),
  defaultHeaders: z.record(z.string(), z.string()).optional(),
});

export const DataSourceConfigSchema = z.union([
  OpenSearchConfigSchema,
  SQLConfigSchema,
  RestAPIConfigSchema,
]);

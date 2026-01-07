/**
 * OpenSearch Data Source Plugin
 *
 * Plugin for querying OpenSearch/Elasticsearch through Windmill.
 * Uses the existing Windmill client for job execution.
 *
 * @packageDocumentation
 */

import { WindmillClient } from '@/lib/windmill-client';
import { BaseDataSourcePlugin } from '../base-plugin';
import type {
  OpenSearchConfig,
  OpenSearchQuery,
  QueryResult,
} from '../types';

/**
 * OpenSearch data source plugin using Windmill for execution.
 *
 * This plugin integrates with Windmill to execute OpenSearch queries.
 * It handles job triggering, polling, and result transformation.
 */
export class OpenSearchPlugin extends BaseDataSourcePlugin<
  OpenSearchConfig,
  OpenSearchQuery
> {
  private client: WindmillClient;

  constructor(config: OpenSearchConfig) {
    super(config);

    // Initialize Windmill client with config
    this.client = new WindmillClient({
      token: config.windmillToken,
      baseUrl: config.windmillBaseUrl,
      workspace: config.windmillWorkspace,
      scriptPath: config.windmillScriptPath,
    });
  }

  /**
   * Initialize the plugin and verify Windmill connectivity.
   */
  async initialize(): Promise<void> {
    const isConnected = await this.testConnection();
    if (!isConnected) {
      throw new Error(
        `Failed to initialize OpenSearch plugin "${this.config.name}": Windmill connection failed`
      );
    }
    this.isInitialized = true;
  }

  /**
   * Execute an OpenSearch query through Windmill.
   *
   * @param query - OpenSearch query configuration
   * @returns Query result with data or error
   */
  async execute<T = any>(query: OpenSearchQuery): Promise<QueryResult<T>> {
    const startTime = Date.now();

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Build query payload for Windmill
      const queryPayload = {
        index: query.index,
        query: query.query,
        filters: query.filters,
        aggregations: query.aggregations,
        size: query.size ?? query.limit,
        from: query.from ?? query.offset,
      };

      // Execute through Windmill client
      const result = await this.client.executeJob(queryPayload, {
        timeout: query.timeout ?? 60000,
      });

      const executionTime = Date.now() - startTime;

      // Transform result to QueryResult format
      const data = Array.isArray(result) ? result : [result];

      return {
        success: true,
        data: data as T[],
        metadata: {
          source: this.config.name,
          executionTime,
          recordCount: data.length,
          hasMore: query.size ? data.length >= query.size : undefined,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: {
          code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
        },
        metadata: {
          source: this.config.name,
          executionTime,
        },
      };
    }
  }

  /**
   * Test the connection to Windmill.
   *
   * Performs a simple query to verify connectivity.
   *
   * @returns True if connection successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a minimal query to test connectivity
      const testQuery: OpenSearchQuery = {
        type: 'opensearch',
        size: 1,
        query: { match_all: {} },
      };

      const result = await this.execute(testQuery);
      return result.success;
    } catch (error) {
      console.error(
        `[OpenSearchPlugin] Connection test failed for "${this.config.name}":`,
        error
      );
      return false;
    }
  }

  /**
   * Get plugin metadata and capabilities.
   */
  getMetadata() {
    return {
      name: this.config.name,
      type: 'opensearch',
      version: '1.0.0',
      capabilities: [
        'query',
        'filters',
        'aggregations',
        'pagination',
        'full-text-search',
      ],
      description:
        'OpenSearch/Elasticsearch data source via Windmill execution',
    };
  }

  /**
   * Clean up Windmill client resources.
   */
  async dispose(): Promise<void> {
    // WindmillClient doesn't require cleanup, but mark as uninitialized
    this.isInitialized = false;
  }
}

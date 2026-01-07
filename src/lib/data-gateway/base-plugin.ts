/**
 * Base Data Source Plugin
 *
 * Abstract base class that all data source plugins must extend.
 * Provides common functionality and enforces plugin interface.
 *
 * @packageDocumentation
 */

import type {
  DataSourceConfig,
  DataSourceQuery,
  QueryResult,
} from './types';

/**
 * Abstract base class for all data source plugins.
 *
 * Plugins must implement:
 * - execute(): Run queries against the data source
 * - testConnection(): Verify connectivity
 * - getMetadata(): Provide plugin information
 */
export abstract class BaseDataSourcePlugin<
  TConfig extends DataSourceConfig = DataSourceConfig,
  TQuery extends DataSourceQuery = DataSourceQuery,
> {
  protected config: TConfig;
  protected isInitialized = false;

  constructor(config: TConfig) {
    this.config = config;
  }

  /**
   * Get the plugin name.
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get the plugin type.
   */
  getType(): string {
    return this.config.type;
  }

  /**
   * Check if the plugin has been initialized.
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Initialize the data source connection.
   * Override this method to perform any setup required.
   */
  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  /**
   * Clean up resources and close connections.
   * Override this method to perform cleanup.
   */
  async dispose(): Promise<void> {
    this.isInitialized = false;
  }

  /**
   * Execute a query against the data source.
   *
   * @param query - The query to execute
   * @returns Query result with data or error
   */
  abstract execute<T = any>(query: TQuery): Promise<QueryResult<T>>;

  /**
   * Test the connection to the data source.
   *
   * @returns True if connection is successful, false otherwise
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Get metadata about the data source and plugin capabilities.
   *
   * @returns Metadata object
   */
  abstract getMetadata(): {
    name: string;
    type: string;
    version: string;
    capabilities: string[];
    description?: string;
  };
}

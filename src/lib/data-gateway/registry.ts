/**
 * Data Source Registry
 *
 * Central registry for managing data source plugins.
 * Provides plugin registration, retrieval, and lifecycle management.
 *
 * @packageDocumentation
 */

import { BaseDataSourcePlugin } from './base-plugin';
import { OpenSearchPlugin } from './plugins/opensearch-plugin';
import type { DataSourceConfig } from './types';

/**
 * Custom error for data source registry operations.
 */
export class DataSourceRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataSourceRegistryError';
  }
}

/**
 * Plugin factory function type.
 */
type PluginFactory = (config: DataSourceConfig) => BaseDataSourcePlugin;

/**
 * Data Source Registry for managing plugin instances.
 *
 * Features:
 * - Plugin registration and lifecycle management
 * - Type-safe plugin instantiation
 * - Automatic initialization on first use
 * - Singleton pattern for global access
 */
export class DataSourceRegistry {
  private plugins = new Map<string, BaseDataSourcePlugin>();
  private factories = new Map<string, PluginFactory>();

  constructor() {
    // Register built-in plugin factories
    this.registerFactory('opensearch', (config) => {
      return new OpenSearchPlugin(config as any);
    });
  }

  /**
   * Register a custom plugin factory.
   *
   * @param type - Plugin type identifier
   * @param factory - Factory function that creates plugin instances
   */
  registerFactory(type: string, factory: PluginFactory): void {
    if (this.factories.has(type)) {
      throw new DataSourceRegistryError(
        `Plugin factory for type "${type}" already registered`
      );
    }
    this.factories.set(type, factory);
  }

  /**
   * Register a data source plugin.
   *
   * @param config - Data source configuration
   * @returns The registered plugin instance
   */
  async register(config: DataSourceConfig): Promise<BaseDataSourcePlugin> {
    // Check if already registered
    if (this.plugins.has(config.name)) {
      throw new DataSourceRegistryError(
        `Data source "${config.name}" already registered`
      );
    }

    // Get factory for this type
    const factory = this.factories.get(config.type);
    if (!factory) {
      throw new DataSourceRegistryError(
        `No plugin factory registered for type "${config.type}"`
      );
    }

    // Create plugin instance
    const plugin = factory(config);

    // Initialize plugin
    await plugin.initialize();

    // Store in registry
    this.plugins.set(config.name, plugin);

    console.log(`[DataSourceRegistry] Registered plugin: ${config.name} (${config.type})`);

    return plugin;
  }

  /**
   * Get a registered plugin by name.
   *
   * @param name - Plugin name
   * @returns The plugin instance
   * @throws DataSourceRegistryError if plugin not found
   */
  get(name: string): BaseDataSourcePlugin {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new DataSourceRegistryError(`Data source "${name}" not found`);
    }
    return plugin;
  }

  /**
   * Check if a plugin is registered.
   *
   * @param name - Plugin name
   * @returns True if plugin exists
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Unregister a plugin and dispose its resources.
   *
   * @param name - Plugin name
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new DataSourceRegistryError(`Data source "${name}" not found`);
    }

    // Dispose plugin resources
    await plugin.dispose();

    // Remove from registry
    this.plugins.delete(name);

    console.log(`[DataSourceRegistry] Unregistered plugin: ${name}`);
  }

  /**
   * Get all registered plugin names.
   *
   * @returns Array of plugin names
   */
  list(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get all registered plugins.
   *
   * @returns Array of plugin instances
   */
  getAll(): BaseDataSourcePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Unregister all plugins and dispose their resources.
   */
  async dispose(): Promise<void> {
    const disposePromises = Array.from(this.plugins.values()).map((plugin) =>
      plugin.dispose()
    );

    await Promise.all(disposePromises);
    this.plugins.clear();

    console.log('[DataSourceRegistry] Disposed all plugins');
  }

  /**
   * Test all registered data source connections.
   *
   * @returns Map of plugin names to connection status
   */
  async testAllConnections(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const testPromises = Array.from(this.plugins.entries()).map(
      async ([name, plugin]) => {
        try {
          const isConnected = await plugin.testConnection();
          results.set(name, isConnected);
        } catch (error) {
          console.error(
            `[DataSourceRegistry] Connection test failed for "${name}":`,
            error
          );
          results.set(name, false);
        }
      }
    );

    await Promise.all(testPromises);
    return results;
  }
}

/**
 * Global singleton registry instance.
 */
export const dataSourceRegistry = new DataSourceRegistry();

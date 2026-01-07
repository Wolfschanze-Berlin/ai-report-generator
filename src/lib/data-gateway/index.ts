/**
 * Data Gateway Module
 *
 * Central export file for the data gateway system.
 * Provides plugin architecture for extensible data sources.
 *
 * @packageDocumentation
 */

// Core types
export * from './types';

// Base plugin
export * from './base-plugin';

// Registry
export * from './registry';

// Built-in plugins
export * from './plugins/opensearch-plugin';

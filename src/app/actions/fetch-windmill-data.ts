/**
 * Windmill Data Fetching Server Action
 *
 * Next.js server action for fetching data from Windmill API.
 * Handles OpenSearch queries with timeout management.
 *
 * @packageDocumentation
 */

'use server';

import { z } from 'zod';
import {
  windmillClient,
  WindmillTimeoutError,
  WindmillJobError,
  WindmillAPIError,
  WindmillConfigError,
} from '@/lib/windmill-client';

// ============================================================================
// Input Validation Schema
// ============================================================================

/**
 * Schema for OpenSearch query validation.
 * Accepts flexible query structure for OpenSearch.
 */
const OpenSearchQuerySchema = z.object({
  index: z.string().optional(),
  query: z.any().optional(),
  filters: z.any().optional(),
  aggregations: z.any().optional(),
  size: z.number().optional(),
  from: z.number().optional(),
});

/**
 * Schema for fetch-windmill-data input.
 */
const FetchWindmillDataInputSchema = z.object({
  query: OpenSearchQuerySchema,
});

// ============================================================================
// Response Types
// ============================================================================

/**
 * Success response from fetch-windmill-data.
 */
export interface FetchWindmillDataSuccess {
  success: true;
  data: any[];
  jobId: string;
  executionTime: number;
}

/**
 * Timeout response from fetch-windmill-data.
 */
export interface FetchWindmillDataTimeout {
  success: false;
  status: 'timeout';
  message: string;
  jobId: string;
}

/**
 * Error response from fetch-windmill-data.
 */
export interface FetchWindmillDataError {
  success: false;
  status: 'error';
  message: string;
  jobId?: string;
  errorType?: string;
}

/**
 * Union type for all possible responses.
 */
export type FetchWindmillDataResponse =
  | FetchWindmillDataSuccess
  | FetchWindmillDataTimeout
  | FetchWindmillDataError;

// ============================================================================
// Server Action
// ============================================================================

/**
 * Server action to fetch data from Windmill API.
 *
 * Accepts a structured OpenSearch query, triggers a Windmill job,
 * and waits for completion with a 60-second timeout.
 *
 * @param input - Input containing OpenSearch query
 * @returns Response with data, timeout status, or error
 *
 * @example
 * ```typescript
 * const result = await fetchWindmillData({
 *   query: {
 *     index: 'analytics',
 *     query: { match_all: {} },
 *     size: 100
 *   }
 * });
 *
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Error:', result.message);
 * }
 * ```
 */
export async function fetchWindmillData(
  input: z.infer<typeof FetchWindmillDataInputSchema>
): Promise<FetchWindmillDataResponse> {
  const startTime = Date.now();

  try {
    // Validate input
    const validated = FetchWindmillDataInputSchema.parse(input);

    console.log('[fetchWindmillData] Starting request', {
      query: validated.query,
      timestamp: new Date().toISOString(),
    });

    // Trigger Windmill job
    let jobId: string;
    try {
      jobId = await windmillClient.triggerJob(validated.query);
      console.log('[fetchWindmillData] Job triggered', {
        jobId,
        elapsedMs: Date.now() - startTime,
      });
    } catch (error) {
      console.error('[fetchWindmillData] Failed to trigger job', {
        error: error instanceof Error ? error.message : 'Unknown error',
        elapsedMs: Date.now() - startTime,
      });

      if (error instanceof WindmillConfigError) {
        return {
          success: false,
          status: 'error',
          message: 'Configuration error: ' + error.message,
          errorType: 'config',
        };
      }

      if (error instanceof WindmillAPIError) {
        return {
          success: false,
          status: 'error',
          message: 'API error: ' + error.message,
          errorType: 'api',
        };
      }

      return {
        success: false,
        status: 'error',
        message: 'Failed to trigger Windmill job: ' + (error instanceof Error ? error.message : 'Unknown error'),
        errorType: 'unknown',
      };
    }

    // Wait for job completion with 60-second timeout
    try {
      const result = await windmillClient.waitForJobCompletion(jobId, {
        timeout: 60000, // 60 seconds
        pollInterval: 1000, // 1 second
      });

      const executionTime = Date.now() - startTime;

      console.log('[fetchWindmillData] Job completed successfully', {
        jobId,
        executionTime,
        resultSize: Array.isArray(result) ? result.length : 'N/A',
      });

      return {
        success: true,
        data: Array.isArray(result) ? result : [result],
        jobId,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error('[fetchWindmillData] Job execution failed', {
        jobId,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof WindmillTimeoutError) {
        return {
          success: false,
          status: 'timeout',
          message: `Job timed out after 60 seconds. Job is still running in background with ID: ${jobId}`,
          jobId,
        };
      }

      if (error instanceof WindmillJobError) {
        return {
          success: false,
          status: 'error',
          message: 'Job execution failed: ' + error.message,
          jobId,
          errorType: 'job',
        };
      }

      if (error instanceof WindmillAPIError) {
        return {
          success: false,
          status: 'error',
          message: 'API error while waiting for job: ' + error.message,
          jobId,
          errorType: 'api',
        };
      }

      return {
        success: false,
        status: 'error',
        message: 'Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        jobId,
        errorType: 'unknown',
      };
    }
  } catch (error) {
    console.error('[fetchWindmillData] Validation or unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      elapsedMs: Date.now() - startTime,
    });

    // Zod validation error
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors?.map((e) => e.message).join(', ') || 'Invalid input format';
      return {
        success: false,
        status: 'error',
        message: 'Invalid input: ' + errorMessages,
        errorType: 'validation',
      };
    }

    return {
      success: false,
      status: 'error',
      message: 'Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      errorType: 'unknown',
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Type guard to check if response is successful.
 */
export function isSuccess(
  response: FetchWindmillDataResponse
): response is FetchWindmillDataSuccess {
  return response.success === true;
}

/**
 * Type guard to check if response is a timeout.
 */
export function isTimeout(
  response: FetchWindmillDataResponse
): response is FetchWindmillDataTimeout {
  return response.success === false && response.status === 'timeout';
}

/**
 * Type guard to check if response is an error.
 */
export function isError(
  response: FetchWindmillDataResponse
): response is FetchWindmillDataError {
  return response.success === false && response.status === 'error';
}

/**
 * Windmill API Client
 *
 * Provides integration with Windmill API for executing OpenSearch queries
 * and retrieving raw data for report generation.
 *
 * @packageDocumentation
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Request payload for triggering a Windmill job.
 */
export interface TriggerJobRequest {
  query: any; // OpenSearch query object
}

/**
 * Response from triggering a Windmill job.
 */
export interface TriggerJobResponse {
  uuid: string;
  [key: string]: any;
}

/**
 * Job completion status.
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Response from checking job status.
 */
export interface JobStatusResponse {
  status: JobStatus;
  result?: any;
  error?: string;
  [key: string]: any;
}

/**
 * Configuration for Windmill client.
 */
export interface WindmillConfig {
  token: string;
  baseUrl: string;
  workspace: string;
  scriptPath: string;
}

/**
 * Options for waiting for job completion.
 */
export interface WaitOptions {
  timeout?: number; // Timeout in milliseconds (default: 60000)
  pollInterval?: number; // Polling interval in milliseconds (default: 1000)
}

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Base error for Windmill API operations.
 */
export class WindmillError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WindmillError';
  }
}

/**
 * Error thrown when environment variables are missing or invalid.
 */
export class WindmillConfigError extends WindmillError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'WindmillConfigError';
  }
}

/**
 * Error thrown when API requests fail.
 */
export class WindmillAPIError extends WindmillError {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message, 'API_ERROR');
    this.name = 'WindmillAPIError';
  }
}

/**
 * Error thrown when job execution times out.
 */
export class WindmillTimeoutError extends WindmillError {
  constructor(message: string, public jobId: string) {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'WindmillTimeoutError';
  }
}

/**
 * Error thrown when job execution fails.
 */
export class WindmillJobError extends WindmillError {
  constructor(message: string, public jobId: string, public errorDetails?: any) {
    super(message, 'JOB_ERROR');
    this.name = 'WindmillJobError';
  }
}

// ============================================================================
// Windmill Client
// ============================================================================

/**
 * Client for interacting with Windmill API.
 *
 * Provides methods to trigger jobs and wait for completion with automatic polling.
 */
export class WindmillClient {
  private config: WindmillConfig;

  /**
   * Create a new Windmill client.
   * @param config - Configuration options (optional, uses env vars by default)
   */
  constructor(config?: Partial<WindmillConfig>) {
    this.config = this.loadConfig(config);
  }

  /**
   * Load configuration from environment variables and overrides.
   */
  private loadConfig(overrides?: Partial<WindmillConfig>): WindmillConfig {
    const token = overrides?.token || process.env.WINDMILL_TOKEN;
    if (!token) {
      throw new WindmillConfigError(
        'WINDMILL_TOKEN environment variable is required'
      );
    }

    return {
      token,
      baseUrl:
        overrides?.baseUrl ||
        process.env.WINDMILL_BASE_URL ||
        'https://analytics-playground.goldenproj.com',
      workspace: overrides?.workspace || process.env.WINDMILL_WORKSPACE || 'wm-fork-worlds-of-agents',
      scriptPath:
        overrides?.scriptPath ||
        process.env.WINDMILL_SCRIPT_PATH ||
        'p/f/mcp_tools/opeansearch_query_aggregration',
    };
  }

  /**
   * Trigger a Windmill job with the given query.
   *
   * @param query - OpenSearch query object
   * @returns Job UUID for tracking
   * @throws {WindmillConfigError} If configuration is invalid
   * @throws {WindmillAPIError} If API request fails
   */
  async triggerJob(query: any): Promise<string> {
    const url = `${this.config.baseUrl}/api/w/${this.config.workspace}/jobs/run/${this.config.scriptPath}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.token}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new WindmillAPIError(
          `Failed to trigger job: ${response.statusText}`,
          response.status,
          errorText
        );
      }

      const responseText = await response.text();

      // Windmill returns either JSON {uuid: "..."} or just the UUID string
      // Try JSON first, fall back to plain text
      try {
        const data: TriggerJobResponse = JSON.parse(responseText);
        if (!data.uuid) {
          throw new WindmillAPIError(
            'Invalid response from Windmill API: missing uuid',
            response.status,
            data
          );
        }
        return data.uuid;
      } catch (parseError) {
        // Response might be plain UUID string
        if (responseText && responseText.match(/^[0-9a-f-]{36}$/i)) {
          return responseText.trim();
        }

        throw new WindmillAPIError(
          `Failed to parse response: ${responseText.substring(0, 200)}`,
          response.status,
          { responseText, parseError }
        );
      }
    } catch (error) {
      if (error instanceof WindmillAPIError) {
        throw error;
      }
      throw new WindmillAPIError(
        `Failed to trigger job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error
      );
    }
  }

  /**
   * Check the status of a job.
   *
   * @param jobId - Job UUID
   * @returns Job status and result if completed
   * @throws {WindmillAPIError} If API request fails
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const url = `${this.config.baseUrl}/api/w/${this.config.workspace}/jobs/completed/get/${jobId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
        },
      });

      if (!response.ok) {
        // Job might still be running, check if it's a 404
        if (response.status === 404) {
          return { status: 'running' };
        }

        const errorText = await response.text();
        throw new WindmillAPIError(
          `Failed to get job status: ${response.statusText}`,
          response.status,
          errorText
        );
      }

      const data = await response.json();

      // Check if job failed
      if (data.error || data.success === false) {
        return {
          status: 'failed',
          error: data.error || 'Job execution failed',
          ...data,
        };
      }

      // Job completed successfully
      return {
        status: 'completed',
        result: data.result,
        ...data,
      };
    } catch (error) {
      if (error instanceof WindmillAPIError) {
        throw error;
      }
      throw new WindmillAPIError(
        `Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        error
      );
    }
  }

  /**
   * Wait for a job to complete with automatic polling.
   *
   * @param jobId - Job UUID
   * @param options - Wait options (timeout, poll interval)
   * @returns Job result when completed
   * @throws {WindmillTimeoutError} If job times out
   * @throws {WindmillJobError} If job fails
   * @throws {WindmillAPIError} If API request fails
   */
  async waitForJobCompletion(
    jobId: string,
    options?: WaitOptions
  ): Promise<any> {
    const timeout = options?.timeout || 60000; // 60 seconds default
    const pollInterval = options?.pollInterval || 1000; // 1 second default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getJobStatus(jobId);

      if (status.status === 'completed') {
        return status.result;
      }

      if (status.status === 'failed') {
        throw new WindmillJobError(
          `Job ${jobId} failed: ${status.error || 'Unknown error'}`,
          jobId,
          status
        );
      }

      // Still running, wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Timeout reached
    throw new WindmillTimeoutError(
      `Job ${jobId} timed out after ${timeout}ms`,
      jobId
    );
  }

  /**
   * Trigger a job and wait for completion in one call.
   *
   * Convenience method that combines triggerJob and waitForJobCompletion.
   *
   * @param query - OpenSearch query object
   * @param options - Wait options (timeout, poll interval)
   * @returns Job result when completed
   * @throws {WindmillConfigError} If configuration is invalid
   * @throws {WindmillAPIError} If API request fails
   * @throws {WindmillTimeoutError} If job times out
   * @throws {WindmillJobError} If job fails
   */
  async executeJob(query: any, options?: WaitOptions): Promise<any> {
    const jobId = await this.triggerJob(query);
    return this.waitForJobCompletion(jobId, options);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default Windmill client instance using environment variables.
 * Use this for convenience in most cases.
 */
export const windmillClient = new WindmillClient();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Trigger a Windmill job using the default client.
 *
 * @param query - OpenSearch query object
 * @returns Job UUID
 */
export async function triggerJob(query: any): Promise<string> {
  return windmillClient.triggerJob(query);
}

/**
 * Wait for a job to complete using the default client.
 *
 * @param jobId - Job UUID
 * @param options - Wait options
 * @returns Job result
 */
export async function waitForJobCompletion(
  jobId: string,
  options?: WaitOptions
): Promise<any> {
  return windmillClient.waitForJobCompletion(jobId, options);
}

/**
 * Execute a job (trigger and wait) using the default client.
 *
 * @param query - OpenSearch query object
 * @param options - Wait options
 * @returns Job result
 */
export async function executeJob(query: any, options?: WaitOptions): Promise<any> {
  return windmillClient.executeJob(query, options);
}

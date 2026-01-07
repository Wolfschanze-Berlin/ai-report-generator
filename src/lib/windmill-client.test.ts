/**
 * Unit tests for Windmill API Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Set up env vars before importing
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv, WINDMILL_TOKEN: 'test-token' };
});

afterEach(() => {
  process.env = originalEnv;
});

// Dynamic import to ensure env vars are set
async function getWindmillModule() {
  return await import('./windmill-client');
}

describe('WindmillClient', () => {
  const mockToken = 'test-token';
  const mockQuery = { index: 'test', query: { match_all: {} } };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Configuration', () => {
    it('should load config from environment variables', async () => {
      const { WindmillClient } = await getWindmillModule();
      const client = new WindmillClient();
      expect(client).toBeDefined();
    });

    it('should throw error if WINDMILL_TOKEN is missing', async () => {
      delete process.env.WINDMILL_TOKEN;
      const { WindmillClient, WindmillConfigError } = await getWindmillModule();

      expect(() => new WindmillClient()).toThrow(WindmillConfigError);
      expect(() => new WindmillClient()).toThrow(
        'WINDMILL_TOKEN environment variable is required'
      );
    });

    it('should allow config overrides', async () => {
      const { WindmillClient } = await getWindmillModule();
      const customConfig = {
        token: 'custom-token',
        baseUrl: 'https://custom.url',
        workspace: 'custom-workspace',
        scriptPath: 'custom/path',
      };
      const client = new WindmillClient(customConfig);
      expect(client).toBeDefined();
    });
  });

  describe('triggerJob', () => {
    it('should successfully trigger a job', async () => {
      const { WindmillClient } = await getWindmillModule();
      const client = new WindmillClient();
      const mockUuid = 'test-uuid-123';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uuid: mockUuid }),
      });

      const uuid = await client.triggerJob(mockQuery);

      expect(uuid).toBe(mockUuid);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify({ query: mockQuery }),
        })
      );
    });

    it('should throw WindmillAPIError on HTTP error', async () => {
      const { WindmillClient, WindmillAPIError } = await getWindmillModule();
      const client = new WindmillClient();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      });

      await expect(client.triggerJob(mockQuery)).rejects.toThrow(
        WindmillAPIError
      );
      await expect(client.triggerJob(mockQuery)).rejects.toThrow(
        'Failed to trigger job'
      );
    });

    it('should throw WindmillAPIError if response missing uuid', async () => {
      const { WindmillClient, WindmillAPIError } = await getWindmillModule();
      const client = new WindmillClient();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
      });

      await expect(client.triggerJob(mockQuery)).rejects.toThrow(
        WindmillAPIError
      );
      await expect(client.triggerJob(mockQuery)).rejects.toThrow('missing uuid');
    });

    it('should handle network errors', async () => {
      const { WindmillClient, WindmillAPIError } = await getWindmillModule();
      const client = new WindmillClient();

      (global.fetch as any).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(client.triggerJob(mockQuery)).rejects.toThrow(
        WindmillAPIError
      );
    });
  });

  describe('getJobStatus', () => {
    const mockJobId = 'test-job-123';

    it('should return completed status with result', async () => {
      const { WindmillClient } = await getWindmillModule();
      const client = new WindmillClient();
      const mockResult = { data: [1, 2, 3] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: mockResult, success: true }),
      });

      const status = await client.getJobStatus(mockJobId);

      expect(status.status).toBe('completed');
      expect(status.result).toEqual(mockResult);
    });

    it('should return running status for 404 response', async () => {
      const { WindmillClient } = await getWindmillModule();
      const client = new WindmillClient();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Job not found',
      });

      const status = await client.getJobStatus(mockJobId);

      expect(status.status).toBe('running');
    });

    it('should return failed status with error', async () => {
      const { WindmillClient } = await getWindmillModule();
      const client = new WindmillClient();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Job execution failed', success: false }),
      });

      const status = await client.getJobStatus(mockJobId);

      expect(status.status).toBe('failed');
      expect(status.error).toBe('Job execution failed');
    });

    it('should throw WindmillAPIError on non-404 HTTP error', async () => {
      const { WindmillClient, WindmillAPIError } = await getWindmillModule();
      const client = new WindmillClient();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(client.getJobStatus(mockJobId)).rejects.toThrow(
        WindmillAPIError
      );
    });
  });

  describe('waitForJobCompletion', () => {
    const mockJobId = 'test-job-123';
    const mockResult = { data: [1, 2, 3] };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return result when job completes', async () => {
      const { WindmillClient } = await getWindmillModule();
      const client = new WindmillClient();

      let callCount = 0;
      (global.fetch as any).mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          // First 2 calls: job still running
          return { ok: false, status: 404 };
        }
        // Third call: job completed
        return {
          ok: true,
          json: async () => ({ result: mockResult, success: true }),
        };
      });

      const promise = client.waitForJobCompletion(mockJobId, {
        timeout: 10000,
        pollInterval: 100,
      });

      // Advance time to trigger polling
      await vi.advanceTimersByTimeAsync(300);

      const result = await promise;
      expect(result).toEqual(mockResult);
      expect(callCount).toBe(3);
    });

    it('should throw WindmillJobError if job fails', async () => {
      const { WindmillClient, WindmillJobError } = await getWindmillModule();
      const client = new WindmillClient();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ error: 'Query syntax error', success: false }),
      });

      await expect(
        client.waitForJobCompletion(mockJobId, { timeout: 1000 })
      ).rejects.toThrow(WindmillJobError);
    });

    it('should throw WindmillTimeoutError on timeout', async () => {
      const { WindmillClient, WindmillTimeoutError } = await getWindmillModule();
      const client = new WindmillClient();

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404, // Job still running
      });

      const promise = client.waitForJobCompletion(mockJobId, {
        timeout: 1000,
        pollInterval: 100,
      });

      // Advance time past timeout
      await vi.advanceTimersByTimeAsync(1100);

      await expect(promise).rejects.toThrow(WindmillTimeoutError);
      await expect(promise).rejects.toThrow('timed out');
    });
  });

  describe('executeJob', () => {
    it('should trigger job and wait for completion', async () => {
      const { WindmillClient } = await getWindmillModule();
      const client = new WindmillClient();
      const mockUuid = 'test-uuid-123';
      const mockResult = { data: [1, 2, 3] };

      let callCount = 0;
      (global.fetch as any).mockImplementation(async (url: string) => {
        callCount++;
        if (url.includes('/jobs/run/')) {
          // Trigger job call
          return {
            ok: true,
            json: async () => ({ uuid: mockUuid }),
          };
        } else {
          // Get status call - complete immediately
          return {
            ok: true,
            json: async () => ({ result: mockResult, success: true }),
          };
        }
      });

      const result = await client.executeJob(mockQuery, { timeout: 5000 });

      expect(result).toEqual(mockResult);
      expect(callCount).toBeGreaterThanOrEqual(2); // At least trigger + status
    });

    it('should propagate errors from triggerJob', async () => {
      const { WindmillClient, WindmillAPIError } = await getWindmillModule();
      const client = new WindmillClient();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      });

      await expect(client.executeJob(mockQuery)).rejects.toThrow(
        WindmillAPIError
      );
    });
  });

  describe('Convenience Functions', () => {
    it('should call triggerJob on default client', async () => {
      const { triggerJob } = await getWindmillModule();
      const mockUuid = 'test-uuid-123';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uuid: mockUuid }),
      });

      const uuid = await triggerJob(mockQuery);
      expect(uuid).toBe(mockUuid);
    });

    it('should call waitForJobCompletion on default client', async () => {
      const { waitForJobCompletion } = await getWindmillModule();
      const mockJobId = 'test-job-123';
      const mockResult = { data: [1, 2, 3] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: mockResult, success: true }),
      });

      const result = await waitForJobCompletion(mockJobId);
      expect(result).toEqual(mockResult);
    });

    it('should call executeJob on default client', async () => {
      const { executeJob } = await getWindmillModule();
      const mockUuid = 'test-uuid-123';
      const mockResult = { data: [1, 2, 3] };

      let callCount = 0;
      (global.fetch as any).mockImplementation(async (url: string) => {
        callCount++;
        if (url.includes('/jobs/run/')) {
          return {
            ok: true,
            json: async () => ({ uuid: mockUuid }),
          };
        } else {
          return {
            ok: true,
            json: async () => ({ result: mockResult, success: true }),
          };
        }
      });

      const result = await executeJob(mockQuery);
      expect(result).toEqual(mockResult);
    });
  });
});

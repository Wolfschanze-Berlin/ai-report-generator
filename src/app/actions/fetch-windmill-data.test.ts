/**
 * Unit tests for Windmill Data Fetching Server Action
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWindmillData, isSuccess, isTimeout, isError } from './fetch-windmill-data';

// Mock the windmill client
vi.mock('@/lib/windmill-client', () => {
  const WindmillConfigError = class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'WindmillConfigError';
    }
  };

  const WindmillAPIError = class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'WindmillAPIError';
    }
  };

  const WindmillTimeoutError = class extends Error {
    jobId: string;
    constructor(message: string, jobId: string) {
      super(message);
      this.name = 'WindmillTimeoutError';
      this.jobId = jobId;
    }
  };

  const WindmillJobError = class extends Error {
    jobId: string;
    constructor(message: string, jobId: string) {
      super(message);
      this.name = 'WindmillJobError';
      this.jobId = jobId;
    }
  };

  return {
    windmillClient: {
      triggerJob: vi.fn(),
      waitForJobCompletion: vi.fn(),
    },
    WindmillConfigError,
    WindmillAPIError,
    WindmillTimeoutError,
    WindmillJobError,
  };
});

// Import mocked module
import { windmillClient, WindmillTimeoutError, WindmillJobError, WindmillAPIError, WindmillConfigError } from '@/lib/windmill-client';

describe('fetchWindmillData', () => {
  const mockQuery = {
    index: 'analytics',
    query: { match_all: {} },
    size: 100,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should successfully fetch data from Windmill', async () => {
      const mockJobId = 'test-job-123';
      const mockData = [{ id: 1, value: 'test' }];

      (windmillClient.triggerJob as any).mockResolvedValue(mockJobId);
      (windmillClient.waitForJobCompletion as any).mockResolvedValue(mockData);

      const result = await fetchWindmillData({ query: mockQuery });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
        expect(result.jobId).toBe(mockJobId);
        expect(result.executionTime).toBeGreaterThan(0);
      }

      expect(windmillClient.triggerJob).toHaveBeenCalledWith(mockQuery);
      expect(windmillClient.waitForJobCompletion).toHaveBeenCalledWith(
        mockJobId,
        { timeout: 60000, pollInterval: 1000 }
      );
    });

    it('should wrap non-array result in array', async () => {
      const mockJobId = 'test-job-456';
      const mockData = { id: 1, value: 'test' };

      (windmillClient.triggerJob as any).mockResolvedValue(mockJobId);
      (windmillClient.waitForJobCompletion as any).mockResolvedValue(mockData);

      const result = await fetchWindmillData({ query: mockQuery });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([mockData]);
      }
    });
  });

  describe('Timeout Cases', () => {
    it('should handle timeout gracefully', async () => {
      const mockJobId = 'test-job-timeout';

      (windmillClient.triggerJob as any).mockResolvedValue(mockJobId);
      (windmillClient.waitForJobCompletion as any).mockRejectedValue(
        new WindmillTimeoutError('Job timed out', mockJobId)
      );

      const result = await fetchWindmillData({ query: mockQuery });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('timeout');
        expect(result.jobId).toBe(mockJobId);
        expect(result.message).toContain('timed out');
        expect(result.message).toContain(mockJobId);
      }
    });
  });

  describe('Error Cases - Trigger Job', () => {
    it('should handle WindmillConfigError', async () => {
      (windmillClient.triggerJob as any).mockRejectedValue(
        new WindmillConfigError('Missing WINDMILL_TOKEN')
      );

      const result = await fetchWindmillData({ query: mockQuery });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('error');
        expect(result.message).toContain('Configuration error');
        expect(result.errorType).toBe('config');
      }
    });

    it('should handle WindmillAPIError during trigger', async () => {
      (windmillClient.triggerJob as any).mockRejectedValue(
        new WindmillAPIError('API request failed')
      );

      const result = await fetchWindmillData({ query: mockQuery });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('error');
        expect(result.message).toContain('API error');
        expect(result.errorType).toBe('api');
      }
    });

    it('should handle generic error during trigger', async () => {
      (windmillClient.triggerJob as any).mockRejectedValue(
        new Error('Network error')
      );

      const result = await fetchWindmillData({ query: mockQuery });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('error');
        expect(result.message).toContain('Failed to trigger Windmill job');
        expect(result.errorType).toBe('unknown');
      }
    });
  });

  describe('Error Cases - Wait for Completion', () => {
    const mockJobId = 'test-job-error';

    beforeEach(() => {
      (windmillClient.triggerJob as any).mockResolvedValue(mockJobId);
    });

    it('should handle WindmillJobError', async () => {
      (windmillClient.waitForJobCompletion as any).mockRejectedValue(
        new WindmillJobError('Job execution failed', mockJobId)
      );

      const result = await fetchWindmillData({ query: mockQuery });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('error');
        expect(result.message).toContain('Job execution failed');
        expect(result.jobId).toBe(mockJobId);
        expect(result.errorType).toBe('job');
      }
    });

    it('should handle WindmillAPIError during wait', async () => {
      (windmillClient.waitForJobCompletion as any).mockRejectedValue(
        new WindmillAPIError('API error while polling')
      );

      const result = await fetchWindmillData({ query: mockQuery });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('error');
        expect(result.message).toContain('API error while waiting');
        expect(result.jobId).toBe(mockJobId);
        expect(result.errorType).toBe('api');
      }
    });

    it('should handle generic error during wait', async () => {
      (windmillClient.waitForJobCompletion as any).mockRejectedValue(
        new Error('Unexpected error')
      );

      const result = await fetchWindmillData({ query: mockQuery });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('error');
        expect(result.message).toContain('Unexpected error');
        expect(result.jobId).toBe(mockJobId);
        expect(result.errorType).toBe('unknown');
      }
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid input', async () => {
      // Invalid input - missing query
      const result = await fetchWindmillData({} as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe('error');
        expect(result.message).toContain('Invalid input');
        expect(result.errorType).toBe('validation');
      }
    });

    it('should accept minimal valid input', async () => {
      const mockJobId = 'test-job-minimal';
      const mockData = [];

      (windmillClient.triggerJob as any).mockResolvedValue(mockJobId);
      (windmillClient.waitForJobCompletion as any).mockResolvedValue(mockData);

      const result = await fetchWindmillData({ query: {} });

      expect(result.success).toBe(true);
    });

    it('should accept complete valid input', async () => {
      const mockJobId = 'test-job-complete';
      const mockData = [];

      (windmillClient.triggerJob as any).mockResolvedValue(mockJobId);
      (windmillClient.waitForJobCompletion as any).mockResolvedValue(mockData);

      const complexQuery = {
        index: 'analytics',
        query: { bool: { must: [{ term: { status: 'active' } }] } },
        filters: { range: { date: { gte: '2024-01-01' } } },
        aggregations: { avg_value: { avg: { field: 'value' } } },
        size: 100,
        from: 0,
      };

      const result = await fetchWindmillData({ query: complexQuery });

      expect(result.success).toBe(true);
      expect(windmillClient.triggerJob).toHaveBeenCalledWith(complexQuery);
    });
  });

  describe('Type Guards', () => {
    it('isSuccess should identify success responses', async () => {
      const mockJobId = 'test-job-success';
      const mockData = [{ test: 'data' }];

      (windmillClient.triggerJob as any).mockResolvedValue(mockJobId);
      (windmillClient.waitForJobCompletion as any).mockResolvedValue(mockData);

      const result = await fetchWindmillData({ query: mockQuery });

      expect(isSuccess(result)).toBe(true);
      expect(isTimeout(result)).toBe(false);
      expect(isError(result)).toBe(false);
    });

    it('isTimeout should identify timeout responses', async () => {
      const mockJobId = 'test-job-timeout';

      (windmillClient.triggerJob as any).mockResolvedValue(mockJobId);
      (windmillClient.waitForJobCompletion as any).mockRejectedValue(
        new WindmillTimeoutError('Timeout', mockJobId)
      );

      const result = await fetchWindmillData({ query: mockQuery });

      expect(isSuccess(result)).toBe(false);
      expect(isTimeout(result)).toBe(true);
      expect(isError(result)).toBe(false);
    });

    it('isError should identify error responses', async () => {
      (windmillClient.triggerJob as any).mockRejectedValue(
        new Error('Generic error')
      );

      const result = await fetchWindmillData({ query: mockQuery });

      expect(isSuccess(result)).toBe(false);
      expect(isTimeout(result)).toBe(false);
      expect(isError(result)).toBe(true);
    });
  });

  describe('Logging', () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    const consoleErrorSpy = vi.spyOn(console, 'error');

    beforeEach(() => {
      consoleLogSpy.mockClear();
      consoleErrorSpy.mockClear();
    });

    it('should log start, trigger, and completion', async () => {
      const mockJobId = 'test-job-log';
      const mockData = [];

      (windmillClient.triggerJob as any).mockResolvedValue(mockJobId);
      (windmillClient.waitForJobCompletion as any).mockResolvedValue(mockData);

      await fetchWindmillData({ query: mockQuery });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting request'),
        expect.any(Object)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job triggered'),
        expect.any(Object)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job completed successfully'),
        expect.any(Object)
      );
    });

    it('should log errors', async () => {
      (windmillClient.triggerJob as any).mockRejectedValue(
        new Error('Test error')
      );

      await fetchWindmillData({ query: mockQuery });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to trigger job'),
        expect.any(Object)
      );
    });
  });
});

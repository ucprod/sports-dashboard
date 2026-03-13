/**
 * Fetch with automatic retry logic
 * Handles transient failures (network timeouts, 5xx errors)
 * Uses exponential backoff: 1s, 2s, 4s, 8s
 */

import { LOG_PREFIX } from "@/lib/constants";

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (transient)
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError) {
    return true;
  }
  // Timeout or connection refused
  if (error.message?.includes("timeout") || error.message?.includes("ECONNREFUSED")) {
    return true;
  }
  return false;
}

/**
 * Check if HTTP status is retryable (5xx or specific 4xx codes)
 */
function isRetryableStatus(status: number): boolean {
  // 5xx server errors are retryable
  if (status >= 500 && status < 600) {
    return true;
  }
  // 429 (Too Many Requests) is retryable
  if (status === 429) {
    return true;
  }
  // 408 (Request Timeout) is retryable
  if (status === 408) {
    return true;
  }
  return false;
}

/**
 * Fetch with retry logic
 * Automatically retries on transient failures with exponential backoff
 */
export async function retryFetch(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  const config = { ...DEFAULT_OPTIONS, ...retryOptions };
  let lastError: Error | null = null;
  let delayMs = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(
        `${LOG_PREFIX.NHL_API} [Attempt ${attempt}/${config.maxAttempts}] Fetching: ${url}`
      );

      // Create AbortController with timeout (compatible with more Node versions)
      let signal = options?.signal;
      let timeoutId: NodeJS.Timeout | undefined;

      if (!signal) {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000);
        signal = controller.signal;
      }

      const response = await fetch(url, {
        ...options,
        signal,
      });

      // Clean up timeout if fetch succeeded
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Check if response status is retryable
      if (!response.ok && isRetryableStatus(response.status)) {
        console.warn(
          `${LOG_PREFIX.NHL_API} [Attempt ${attempt}] HTTP ${response.status} (retryable) - will retry...`
        );

        if (attempt < config.maxAttempts) {
          await sleep(delayMs);
          delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs);
          continue;
        }
      }

      // Return response (success or non-retryable error)
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(lastError)) {
        // Non-retryable error, throw immediately
        console.error(
          `${LOG_PREFIX.NHL_API} [Attempt ${attempt}] Non-retryable error:`,
          lastError.message
        );
        throw lastError;
      }

      console.warn(
        `${LOG_PREFIX.NHL_API} [Attempt ${attempt}] Transient error: ${lastError.message}`
      );

      if (attempt < config.maxAttempts) {
        console.log(
          `${LOG_PREFIX.NHL_API} Retrying in ${delayMs}ms...`
        );
        await sleep(delayMs);
        delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs);
      }
    }
  }

  // All retries exhausted
  console.error(
    `${LOG_PREFIX.NHL_API} ❌ All ${config.maxAttempts} attempts failed. Last error:`,
    lastError?.message
  );
  throw lastError || new Error("Fetch failed after all retries");
}

console.log(`${LOG_PREFIX.NHL_API} Retry utility initialized (max 3 attempts)`);

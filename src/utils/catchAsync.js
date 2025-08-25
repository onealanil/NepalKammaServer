/**
 * @file catchAsync.js
 * @description Enhanced utility function to handle asynchronous errors in Express.js routes.
 * It wraps the route handler function, catches errors, adds context, and provides monitoring.
 * @param {Function} fn - The asynchronous route handler function to be wrapped.
 * @param {Object} options - Optional configuration for timeout and monitoring
 * @returns {Function} - A new function that wraps the original function and handles errors.
 */

import logger from './logger.js';

const catchAsync = (fn, options = {}) => {
  const { timeout = 30000, enableMonitoring = true } = options;

  return (req, res, next) => {
    // Generate request ID for tracking
    const requestId = req.headers['x-request-id'] ||
                     `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    req.requestId = requestId;

    // Performance monitoring
    const startTime = Date.now();

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });

    // Execute the function with timeout
    Promise.race([
      Promise.resolve(fn(req, res, next)),
      timeoutPromise
    ])
    .then((result) => {
      if (enableMonitoring) {
        const duration = Date.now() - startTime;
        logger.info('Request completed successfully', {
          requestId,
          method: req.method,
          path: req.path,
          duration,
          userId: req.user?._id,
          statusCode: res.statusCode,
        });

        // Performance warning for slow requests
        if (duration > 5000) {
          logger.warn(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`);
        }
      }
      return result;
    })
    .catch((error) => {
      // Enhance error with context
      error.requestId = requestId;
      error.userId = req.user?._id;
      error.endpoint = `${req.method} ${req.path}`;
      error.userAgent = req.get('User-Agent');
      error.ip = req.ip;
      error.timestamp = new Date().toISOString();

      logger.error('Async operation failed', {
        requestId,
        userId: req.user?._id,
        endpoint: `${req.method} ${req.path}`,
        error: error.message,
        stack: error.stack,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      next(error);
    });
  };
};

export default catchAsync;

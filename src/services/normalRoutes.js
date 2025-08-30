/**
 * @file normalRoutes.js
 * @description rate limiter middleware for all normal requests.
 */
import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

/**
 * @function normalLimiter
 * @description Limits requests per IP per route to prevent abuse.
 */
export const normalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // max 100 requests per IP per route per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}-${req.originalUrl}`;
  },
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many requests from this IP for this route. Please try again in 1 hour.",
      retryAfter: Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000), // seconds
    });
  },
});

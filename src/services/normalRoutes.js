/**
 * @file normalRoutes.js
 * @description Rate limiter middleware for normal requests.
 */
import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

/**
 * @function normalLimiter
 * @description Rate limiter middleware for normal API requests
 */
export const normalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour 
  max: 100, // 100 requests per hour
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many requests from this IP. Please try again in 1 hour.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});


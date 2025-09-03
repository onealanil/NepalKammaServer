/**
 * @file authRoutes.js
 * @description Rate limiter middleware for authentication requests.
 * Provides enhanced security for login, signup, and password reset attempts.
 */
import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

/**
 * @function authLimiter
 * @description Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  handler: (req, res) => {

    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many authentication attempts. Please try again in 15 minutes.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
  skipSuccessfulRequests: true,
  skip: (req, res) => {
    return res.statusCode < 400;
  },
});

/**
 * @function passwordResetLimiter
 * @description Rate limiter for password reset requests
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many password reset attempts. Please try again in 1 hour.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * @function signupLimiter
 * @description Rate limiter for user registration
 */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signups per hour
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many signup attempts. Please try again in 1 hour.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * @function otpLimiter
 * @description Rate limiter for OTP requests
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 OTP requests per window
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many OTP requests. Please try again in 10 minutes.",
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
    });
  },
});

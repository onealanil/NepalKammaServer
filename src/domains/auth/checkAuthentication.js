/**
 * @file checkAuthentication.js
 * @description This file contains the checkAuthentication function.
 * It is used to check if the user is authenticated or not.
 */
import User from "../../../models/User.js";
import catchAsync from "../../utils/catchAsync.js";
import createError from "../../utils/createError.js";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import logger from "../../utils/logger.js";

/**
 * @function checkAuthentication
 * @description This function checks if the user is authenticated or not.
 * @param req - Request object
 * @param res - Response object
 *
 */
export const checkAuthentication = catchAsync(async (req, res) => {
  const user = await User.findById(req.user).select("-password");
  if (!user) {
    logger.warn('Authentication check failed - user not found', {
      userId: req.user,
      requestId: req.requestId
    });
    throw createError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  // Check if user's account is active
  if (user.userAccountStatus !== "Active") {
    logger.warn('Authentication check failed - account inactive', {
      userId: user._id,
      requestId: req.requestId``
    });
    throw createError(
      StatusCodes.UNAUTHORIZED,
      "Your account is inactive. Please contact the admin."
    );
  }

  logger.info('Authentication check successful', {
    userId: user._id,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({
    status: "success",
    user,
  });
});

/**
 * @function refreshToken
 * @description This function is used to refresh the token.
 * @param req - Request object
 * @param res - Response object
 */
export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  console.log("this is token", token);
  if (!token) {
    logger.warn('Refresh token attempt failed - no token found', {
      requestId: req.requestId
    });
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'No token found' });
  }

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
    if (err) {
      logger.warn('Refresh token attempt failed - invalid token', {
        error: err.message,
        requestId: req.requestId
      });
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Invalid token' });
    }

    const newAccessToken = jwt.sign(
      { userId: payload.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    logger.info('Token refreshed successfully', {
      userId: payload.userId,
      requestId: req.requestId
    });

    res.status(StatusCodes.OK).json({ accessToken: newAccessToken });
  });
})

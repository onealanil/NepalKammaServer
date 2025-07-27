/**
 * @file Auth.js
 * @description This file contains the routes for the auth module.
 */
import express from "express";
import { protect } from "../domains/auth/middlewares/auth.js";
import { checkAuthentication, refreshToken } from "../domains/auth/checkAuthentication.js";
import { validate } from "../domains/auth/middlewares/validate.js";
const router = express.Router();

/**
 * @description This route is used to check the authentication of the user.
 * @route GET /api/v1/auth/check-auth
 * @access Private
 */
router.get("/check-auth", protect, validate, checkAuthentication);

/**
 * @description This route is used to refresh the token.
 * @route GET /api/v1/auth/refresh-token
 * @access Private
 */
router.post("/refresh-token", refreshToken)

export default router;


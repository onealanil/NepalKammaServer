/**
 * @file Auth.js
 * @description This file contains the routes for the auth module.
 */
import express from "express";
import { protect } from "../domains/auth/middlewares/auth.js";
import { checkAuthentication } from "../domains/auth/checkAuthentication.js";
import { validate } from "../domains/auth/middlewares/validate.js";
const router = express.Router();

/**
 * @description This route is used to check the authentication of the user.
 * @route GET /api/v1/auth/check-auth
 * @access Private
 */
router.get("/check-auth", protect, validate, checkAuthentication);

export default router;

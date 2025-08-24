/**
 * @file Reorts.js
 * @description This file contains the routes for the report module.
 */
import express from "express";
import { protect } from "../domains/auth/middlewares/auth.js";
import { createReport } from "../domains/report/controller/index.js";
import { normalLimiter } from "../services/normalRoutes.js";

const router = express.Router();

/**
 * @description This route is used to create a report.
 * @route POST /api/v1/report/createReport
 * @access Private
 */
router.route("/createReport").post(normalLimiter, protect, createReport);

export default router;
        
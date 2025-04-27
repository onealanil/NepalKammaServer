/**
 * @file Review.js
 * @description This file contains the routes for review-related operations such as creating a review, getting reviews by provider, and getting average rating.
 */
import express from "express";
import { protect } from "../domains/auth/middlewares/auth.js";
import {
  createReview,
  getAverageRating,
  getReviewByProvider,
} from "../domains/review/controller/index.js";

const router = express.Router();

/**
 * @description Review routes for review-related operations such as creating a review, getting reviews by provider, and getting average rating.
 * @route POST /api/v1/review/createReview
 * @access Private
 */
router.route("/createReview").post(protect, createReview);

/**
 * @description Get reviews by provider route
 * @route GET /api/v1/review/getReviewByProvider/:id
 * @param id - The ID of the provider to get reviews for
 * @access Private
 */
router.route("/getReviewByProvider/:id").get(protect, getReviewByProvider);

/**
 * @description Get average rating route
 * @route GET /api/v1/review/getAverageRating/:id
 * @param id - The ID of the provider to get the average rating for
 * @access Private
 */
router.route("/getAverageRating/:id").get(protect, getAverageRating);

export default router;

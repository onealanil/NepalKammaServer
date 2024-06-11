import express from "express";
import { protect } from "../domains/auth/middlewares/auth.js";
import {
  createReview,
  getAverageRating,
  getReviewByProvider,
} from "../domains/review/controller/index.js";

const router = express.Router();

router.route("/createReview").post(protect, createReview);
router.route("/getReviewByProvider/:id").get(protect, getReviewByProvider);
router.route("/getAverageRating/:id").get(protect, getAverageRating);

export default router;

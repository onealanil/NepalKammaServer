/**
 * @file User Controller/index.js
 * @module reviewController
 * @description This file contains the controller functions for user-related operations such as creating a user, verifying OTP, logging in, editing profile, and more.
 * @requires express
 * @requires User model
 * @requires catchAsync utility function
 * @requires firebase for push notifications
 * @requires socketHandler for real-time notifications
 * @requires multer for file uploads
 * @requires path for file path manipulation
 * @requires fs for file system operations
 * @requires cloudinary for image uploads
 * @requires dotenv for environment variables
 */

import Review from "../../../../models/Review.js";
import User from "../../../../models/User.js";
import { emitNotification } from "../../../../socketHandler.js";
import catchAsync from "../../../utils/catchAsync.js";
import firebase from "../../../firebase/index.js";

/**
 * @function createReview
 * @description Creates a new review for a user and sends a notification to the reviewed user.
 * @param req - The request object containing the review details.
 * @param res - The response object to send the result.
 * @returns - A JSON response with the created review or an error message and emit a notification with socket.io and firebase.
 * @throws - Throws an error if the review creation fails or if the user is not found.
 */
export const createReview = catchAsync(async (req, res) => {
  try {
    const { reviewedBy, reviewedTo, review, rating } = req.body;
    const getReview = await Review.create({
      reviewedBy,
      reviewedTo,
      review,
      rating,
    });

    const reviewedByUser = await User.findById(reviewedBy);
    const reviewedToUser = await User.findById(reviewedTo);
    // Check if the user was found and has a profile picture
    if (!reviewedByUser || !reviewedByUser.profilePic.url) {
      return res(400).json({ message: "Something went wrong" });
    }
    if (!reviewedToUser) {
      return res(400).json({ message: "Something went wrong" });
    }

    emitNotification(req.io, getReview.reviewedTo.toString(), {
      senderId: reviewedBy,
      recipientId: reviewedTo,
      notification: review,
      profilePic: reviewedByUser.profilePic.url,
      senderUsername: reviewedByUser.username,
      type: "review",
    });

    const sendNotification = async () => {
      try {
        await firebase.messaging().send({
          token: reviewedToUser?.fcm_token,
          notification: {
            title: "Someone reviwed you 🎆😍",
            body: review,
          },
        });
      } catch (err) {
        console.error(err);
      }
    };

    if (reviewedToUser.fcm_token) {
      await sendNotification();
    }

    res.status(200).json(getReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create  review" });
  }
});

/**
 * @function getReviewByProvider
 * @description Retrieves reviews for a specific provider with pagination (5 reviews per page).
 * @param req - The request object containing the provider ID and optional page query parameter.
 * @param res - The response object to send the result.
 * @returns - A JSON response with the list of reviews, pagination info, or an error message.
 * @throws - Throws an error if the retrieval fails.
 */
export const getReviewByProvider = catchAsync(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const totalReviews = await Review.countDocuments({
      reviewedTo: req.params.id,
    });

    const reviews = await Review.find({
      reviewedTo: req.params.id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reviewedBy", "-password")
      .populate("reviewedTo", "-password");

    const totalPages = Math.ceil(totalReviews / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get reviews" });
  }
});

/**
 * @function getAverageRating
 * @description Calculates the average rating for a specific provider based on their reviews.
 * @param req - The request object containing the provider ID.
 * @param res - The response object to send the result.
 * @returns - A JSON response with the average rating or an error message.
 * @throws - Throws an error if the calculation fails.
 */
export const getAverageRating = catchAsync(async (req, res, next) => {
  try {
    const reviews = await Review.find({
      reviewedTo: req.params.id,
    });
    const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
    const avgRating = totalRating / reviews.length;
    res.status(200).json(avgRating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get average rating" });
  }
});

/**
 * @file User.js
 * @description This file contains the routes for user-related operations such as creating a user, verifying OTP, logging in, editing profile, and more.
 */

import express from "express";
import {
  createUser,
  resendOTP,
  verifyUser,
  LoginUser,
  editProfile,
  updateProfilePicController,
  updatePhoneNumber,
  uploadDocuments,
  getSingleUser,
  getAllJobSeekers,
  nearByJobSeekers,
  searchUser,
  countAll,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getTopRatedJobProviders,
  getSingleUserProvider,
  forgetPassword,
  logoutUser,
} from "../domains/user/controller/index.js";
import {
  loginValidation,
  signUpValidation,
  signupValidationResult,
} from "../validators/UserValidators.js";
import { permission, protect } from "../domains/auth/middlewares/auth.js";
import {
  multipleUpload,
  singleUpload,
} from "../domains/auth/middlewares/Multer.js";
const router = express.Router();

/**
 * @description User routes for user-related operations such as creating a user, verifying OTP, logging in, editing profile, and more.
 * @route POST /api/v1/user/signup
 * @access Public
 */
router
  .route("/signup")
  .post(signUpValidation, signupValidationResult, createUser);

/**
 * @description User verification route
 * @route POST /api/v1/user/verify
 * @access Public
 */
router.route("/verify").post(verifyUser);

/**
 * @description resend OTP route
 * @route POST /api/v1/user/resend-otp
 * @access Public
 */
router.route("/resend-otp").post(resendOTP);

/**
 * @description User login route with validation with express-validator
 * @route POST /api/v1/user/login
 * @access Public
 */
router.route("/login").post(loginValidation, signupValidationResult, LoginUser);

/**
 * @description Forget password route
 * @route PUT /api/v1/user/forgetPassword
 * @access PUblic
 */
router.route("/forgetPassword").put(forgetPassword);

/**
 * @description Logout user route
 * @route GET /api/v1/user/logout
 * @access Private
 */
router.route("/logout").get(protect, logoutUser);

/**
 * @description Resend OTP route
 * @route POST /api/v1/user/resend-otp
 * @access Private
 * @param {id} id - User ID
 *
 */
router.route(`/edit-profile/:id`).put(protect, editProfile);

/**
 * * @description Update user profile picture route
 * * @route PUT /api/v1/user/update-picture
 * * @access Private
 */
router
  .route("/update-picture")
  .put(protect, singleUpload, updateProfilePicController);

/**
 * * @description Update user phone number route
 * * @route PUT /api/v1/user/update-phone
 * * @access Private
 */
router.route("/update-phone").put(protect, updatePhoneNumber);

/**
 * * @description Upload documents route
 * * @route POST /api/v1/user/upload-document
 * * @access Private
 */
router.route("/upload-document").post(protect, multipleUpload, uploadDocuments);

/**
 * * @description Get single user route
 * * @route GET /api/v1/user/:id
 * * @access Private
 * @param {id} id - User ID
 */
router.route("/user/:id").get(protect, getSingleUser);

/**
 * * @description Get single user provider route
 * * @route GET /api/v1/user/provider/:id
 * * @access Private
 * @param {id} id - User ID
 */
router.route("/user/provider/:id").get(protect, getSingleUserProvider);

/**
 * * @description Get all job seekers route
 * * @route GET /api/v1/user/job-seeker
 * * @access Private
 */
router.route("/job-seeker").get(protect, getAllJobSeekers);

/**
 * * @description Get nearby job seekers route
 * * @route GET /api/v1/user/getNearbyJobSeeker/:latitude/:longitude
 * * @access Private
 * @param {latitude} latitude - Latitude of the user
 * @param {longitude} longitude - Longitude of the user
 */
router
  .route(`/getNearbyJobSeeker/:latitude/:longitude`)
  .get(protect, nearByJobSeekers);

/**
 * * @description Search user route
 * * @route GET /api/v1/user/search-user/:username
 * * @access Private
 * @param {username} username - Username to search for
 */
router.route(`/search-user/:username`).get(protect, searchUser);

/**
 * * @description Count all job posted by a job provider
 * * @route GET /api/v1/user/count-job-posted/:jobProviderId
 * * @access Private
 * @param {jobProviderId} jobProviderId - Job provider ID to count jobs for job provider
 */
router
  .route(`/count-job-posted/:jobProviderId`)
  .get(protect, permission(["job_provider"]), countAll);

/**
 * * @description Save job route
 * * @route PUT /api/v1/user/save-job/:id
 * * @access Private
 * @param {id} id - Job ID to save
 */
router.route(`/save-job/:id`).put(protect, saveJob);
/**
 * * @description Unsave job route
 * * @route PUT /api/v1/user/unsave-job/:id
 * * @access Private
 * @param {id} id - Job ID to unsave
 */
router.route(`/unsave-job/:id`).put(protect, unsaveJob);
/**
 * * @description Get saved jobs route
 * * @route GET /api/v1/user/saved-jobs
 * * @access Private
 */
router.route(`/saved-jobs`).get(protect, getSavedJobs);

/**
 * * @description Get top rated job providers route
 * * @route GET /api/v1/user/top-rated-job-provider
 * * @access Private
 */
router.route(`/top-rated-job-provider`).get(protect, getTopRatedJobProviders);

export default router;

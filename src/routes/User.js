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

router
  .route("/signup")
  .post(signUpValidation, signupValidationResult, createUser);
// verify otp route
router.route("/verify").post(verifyUser);
//resend otp route
router.route("/resend-otp").post(resendOTP);
router.route("/login").post(loginValidation, signupValidationResult, LoginUser);

//forget password
router.route("/forgetPassword").put(forgetPassword);

//logout
router.route("/logout").get(protect, logoutUser);

// edit profile
router.route(`/edit-profile/:id`).put(protect, editProfile);

// update profile pic
router
  .route("/update-picture")
  .put(protect, singleUpload, updateProfilePicController);

// update phone number
router.route("/update-phone").put(protect, updatePhoneNumber);

//update documents
router.route("/upload-document").post(protect, multipleUpload, uploadDocuments);

//get single user
router.route("/user/:id").get(protect, getSingleUser);

//get single user --> provider
router.route("/user/provider/:id").get(protect, getSingleUserProvider);

//get all job seekers
router.route("/job-seeker").get(protect, getAllJobSeekers);

//near by job seekers
router
  .route(`/getNearbyJobSeeker/:latitude/:longitude`)
  .get(protect, nearByJobSeekers);

//search user by username
router.route(`/search-user/:username`).get(protect, searchUser);

//count jobs posted by job providers
router
  .route(`/count-job-posted/:jobProviderId`)
  .get(protect, permission(["job_provider"]), countAll);

//save jobs
router.route(`/save-job/:id`).put(protect, saveJob);
//unsave jobs
router.route(`/unsave-job/:id`).put(protect, unsaveJob);
//get saved jobs
router.route(`/saved-jobs`).get(protect, getSavedJobs);

//get top rated job provider
router.route(`/top-rated-job-provider`).get(protect, getTopRatedJobProviders);

export default router;

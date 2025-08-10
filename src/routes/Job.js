/**
 * @file Job.js
 * @description This file contains the routes for the job module in the application.
 */
import express from "express";
import {
  completedJobs,
  createJob,
  deleteJobs,
  getJob,
  getRecentPublicJobs,
  getSingleJob,
  getSingleUserJobs,
  nearBy,
  recommendationJobs,
  searchJob,
  updateJobStatus,
} from "../domains/jobs/controller/index.js";
import { protect, permission } from "../domains/auth/middlewares/auth.js";
import {
  createJobValidation,
  createJobValidationResult,
} from "../validators/JobValidators.js";
const router = express.Router();

/**
 * @description This route is used to create a job.
 * @route POST /api/v1/job/createJob
 * @access Private
 * @permission job_provider
 */
router
  .route("/createJob")
  .post(
    protect,
    permission(["job_provider"]),
    createJobValidation,
    createJobValidationResult,
    createJob
  );
/**
 * @description This route is used to get a job.
 * @route GET /api/v1/job
 * @access Private
 */
router.route(`/`).get(protect, getJob);

/**
 * @description This route is used to get a job by user.
 * @route GET /api/v1/
 * @access Private
 */
router.route(`/getSingleUserJob/:id`).get(protect, getSingleUserJobs);

/**
 * @description This route is used to get the nearby jobs based on latitude and longitude.
 * @route GET /api/v1/job/getNearbyJob/:latitude/:longitude
 * @access Private
 * @param {number} latitude - The latitude of the user's location.
 * @param {number} longitude - The longitude of the user's location.
 */
router.route(`/getNearbyJob/:latitude/:longitude`).get(protect, nearBy);
/**
 * @description This route is used to get recommended jobs.
 * @route GET /api/v1/job/getRecommendedJob
 * @access Private
 */
router.route(`/getRecommendedJob`).get(protect, recommendationJobs);

/**
 * @description This route is used to get the 5 recent jobs
 * @route GET /api/v1/job/getRecentJob
 */
router.route(`/getRecentJob`).get(protect, getRecentPublicJobs)

/**
 * @description This route is used to search for jobs.
 * @route GET /api/v1/job/searchjob
 * @access Private
 */
router.route(`/searchjob`).get(protect, searchJob);
/**
 * @description This route is used to update the status of a job.
 * @route PUT /api/v1/job/updateJobStatus/:jobId
 * @access Private
 * @permission job_provider
 * @param {string} jobId - The ID of the job to update.
 */
router
  .route(`/updateJobStatus/:jobId`)
  .put(protect, permission(["job_provider"]), updateJobStatus);

/**
 * @description This route is used to get completed jobs.
 * @route GET /api/v1/job/completedJobs
 * @access Private
 * @permission job_provider
 *
 */
router
  .route(`/completedJobs`)
  .get(protect, permission(["job_provider"]), completedJobs);

/**
 * @description This route is used to delete a job.
 * @route DELETE /api/v1/job/deleteJob/:jobId
 * @access Private
 * @permission job_provider
 * @param {string} jobId - The ID of the job to delete.
 */
router
  .route(`/deleteJob/:jobId`)
  .delete(protect, permission(["job_provider"]), deleteJobs);

/**
 * @function this route is used to fetch a single job
 * @route GET /api/v1/job/:jobId
 * @access Private
 * @permission job_seeker
 */
router.route(`/:jobId`).get(protect, permission(["job_seeker"]), getSingleJob)

export default router;

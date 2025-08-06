/**
 * @file Gig.js
 * @description This file contains the routes for the gig module.
 */
import express from "express";
import { protect, permission } from "../domains/auth/middlewares/auth.js";
import {
  createGig,
  deleteSingleGig,
  getGig,
  getSingleUserGigs,
  nearByGig,
  searchGig,
  uploadImages,
} from "../domains/gigs/controller/index.js";
import {
  createGigValidation,
  createGigValidationResult,
} from "../validators/GigValidators.js";
import { multipleUpload } from "../domains/auth/middlewares/Multer.js";
const router = express.Router();

/**
 * @description This route is used to create a gig.
 * @route POST /api/v1/gig/creategig/:id
 * @access Private
 * @permission job_seeker
 * @param {string} id - The ID of the user creating the gig.
 */
router
  .route("/creategig/:id")
  .put(
    protect,
    permission(["job_seeker"]),
    createGigValidation,
    createGigValidationResult,
    createGig
  );

/**
 * @description This route is used to upload images for a gig.
 * @route POST /api/v1/gig/upload-photo
 * @access Private
 * @permission job_seeker
 */
router
  .route("/upload-photo")
  .post(protect, multipleUpload, permission(["job_seeker"]), uploadImages);
/**
 * @description This route is used to get nearby gigs based on latitude and longitude.
 * @route GET /api/v1/gig/getNearbyGig/:latitude/:longitude
 * @access Private
 * @permission job_seeker
 * @param {string} latitude - The latitude of the user's location.
 * @param {string} longitude - The longitude of the user's location.
 */
router.route(`/getNearbyGig/:latitude/:longitude`).get(protect, nearByGig);

/**
 * @description This route is used to get gigs based on search criteria.
 * @route GET /api/v1/gig/searchgig
 * @access Private
 */
router.route("/").get(protect, getGig);

/**
 * @description This route is used to search for gigs based on a query.
 * @route GET /api/v1/gig/searchgig
 * @access Private
 */
router.route(`/searchgig`).get(protect, searchGig);

/**
 * @description This route is used to get a single user's gigs.
 * @route GET /api/v1/gig/getSingleUserGig/:id
 * @access Private
 * @param {string} id - The ID of the user whose gigs are to be retrieved.
 */
router.route(`/getSingleUserGig/:id`).get(protect, getSingleUserGigs);

/**
 * @description This route is used to delete a sing users gigs
 * @route DELETE /api/v1/gig/deleteUsergig/:id
 * @access private
 */
router.route(`/deleteUsergig/:id`).delete(protect, deleteSingleGig);

export default router;

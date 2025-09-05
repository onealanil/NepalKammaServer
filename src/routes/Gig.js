/**
 * @file Gig.js
 * @description This file contains the routes for the gig module.
 */
import express from "express";
import { protect, permission } from "../domains/auth/middlewares/auth.js";
import {
  deleteSingleGig,
  getGig,
  getSingleGig,
  getSingleUserGigs,
  nearByGig,
  searchGig,
  createGigWithImages
} from "../domains/gigs/controller/index.js";
import {
  createGigValidation,
  createGigValidationResult,
} from "../validators/GigValidators.js";
import { multipleUpload } from "../domains/auth/middlewares/Multer.js";
import { normalLimiter } from "../services/normalRoutes.js";
const router = express.Router();

/**
 * @description This route creates a gig with images in one atomic request
 * @route POST /api/v1/gig
 * @access Private
 * @permission job_seeker
 */
router
  .route("/")
  .post(
    normalLimiter,
    protect,
    multipleUpload,
    permission(["job_seeker"]),
    createGigValidation,
    createGigValidationResult,
    createGigWithImages
  );
  
/**
 * @description This route is used to get nearby gigs based on latitude and longitude.
 * @route GET /api/v1/gig/getNearbyGig/:latitude/:longitude
 * @access Private
 * @permission job_seeker
 * @param {string} latitude - The latitude of the user's location.
 * @param {string} longitude - The longitude of the user's location.
 */
router.route(`/getNearbyGig/:latitude/:longitude`).get(normalLimiter, protect, nearByGig);


/**
 * @description This route is used to get gigs based on search criteria.
 * @route GET /api/v1/gig/searchgig
 * @access Private
 */
router.route("/").get(normalLimiter, protect, getGig);

/**
 * @description This route is used to search for gigs based on a query.
 * @route GET /api/v1/gig/searchgig
 * @access Private
 */
router.route(`/searchgig`).get(normalLimiter, protect, searchGig);

/**
 * @description This route is used to get a single user's gigs.
 * @route GET /api/v1/gig/getSingleUserGig/:id
 * @access Private
 * @param {string} id - The ID of the user whose gigs are to be retrieved.
 */
router.route(`/getSingleUserGig/:id`).get(normalLimiter, protect, getSingleUserGigs);

/**
 * @description This route is used to delete a sing users gigs
 * @route DELETE /api/v1/gig/deleteUsergig/:id
 * @access private
 */
router.route(`/deleteUsergig/:id`).delete(normalLimiter, protect, deleteSingleGig);

/**
 * @description This route is used to get a single gig.
 * @route GET /api/v1/gig/:gigId
 * @access Private
 * @param {string} gigId - The ID of the gig to retrieve.
 */
router.route("/:gigId").get(normalLimiter, protect, getSingleGig);


export default router;

import express from "express";
import { protect, permission } from "../domains/auth/middlewares/auth.js";
import {
  createGig,
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

router
  .route("/creategig/:id")
  .put(
    protect,
    permission(["job_seeker"]),
    createGigValidation,
    createGigValidationResult,
    createGig
  );

router
  .route("/upload-photo")
  .post(protect, multipleUpload, permission(["job_seeker"]), uploadImages);
router.route(`/getNearbyGig/:latitude/:longitude`).get(protect, nearByGig);
router.route("/").get(protect, getGig);
router.route(`/searchgig`).get(protect, searchGig);
router.route(`/getSingleUserGig/:id`).get(protect, getSingleUserGigs);

export default router;

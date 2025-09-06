/**
 * @file Gigs/index.js
 * @description This file contains the controller functions for the gig module.
 * @module GigsController
 * @requires express - The Express framework
 * @requires Gig - The Gig model
 * @requires User - The User model
 * @requires getDataUris - A utility function to get data URIs from files
 * @requires catchAsync - A utility function to handle asynchronous errors
 * @requires cloudinary - A cloud storage service for images
 * @requires multipleUpload - A middleware for handling file uploads
 */
import Gig from "../../../../models/Gig.js";
import User from "../../../../models/User.js";
import { getDataUris } from "../../../utils/Features.js";
import catchAsync from "../../../utils/catchAsync.js";
import cloudinary from "cloudinary";
import { getOrSetCache, clearCache, clearNearbyGigCacheGrid } from "../../../utils/cacheService.js";
import { StatusCodes } from "http-status-codes";
import logger from "../../../utils/logger.js";
import mongoose from "mongoose";

/**
 * @function createGigWithImages
 * @description Upload gig images to Cloudinary and create a gig atomically.
 * @param {Object} req - The request object containing files and gig data.
 * @param {Object} res - The response object.
 * @returns - JSON response with the created gig.
 * @throws - Returns error JSON response if any step fails.
 * @async
 */
export const createGigWithImages = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "No files uploaded" });
  }

  if (req.files.length > 2) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "Maximum 2 images allowed" });
  }

  const userGigCount = await Gig.countDocuments({
    postedBy: req.user._id,
  })

  /**
   * limit user to create maximum 2 jobs
   */

  const MAX_GIG_PER_USER = 2;

  if (userGigCount >= MAX_GIG_PER_USER) {
    logger.warn('Gig creation limit exceeded', {
      userId: req.user._id,
      currentGigs: userGigCount,
      limit: MAX_GIG_PER_USER,
      requestId: req.requestId
    });

    return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      message: `You cannot create more than ${MAX_GIG_PER_USER} gigs.`,
      solution: "Please complete or delete some of your existing gigs before creating new ones.",
      currentJobs: userGigCount,
      maxAllowed: MAX_GIG_PER_USER,
    });
  }


  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  for (const file of req.files) {
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid file type" });
    }
    if (file.size > 5 * 1024 * 1024) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "File too large (max 5MB)" });
    }
  }

  const { title, gig_description, price, category } = req.body;
  if (!title || !gig_description || !price || !category) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "Missing required fields" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let uploadResults = [];
  try {
    logger.info("Gig creation started", {
      userId: req.user._id,
      requestId: req.requestId,
      fileCount: req.files.length,
    });

    const files = getDataUris(req.files);

    logger.info('Gig image upload started', {
      fileCount: files.length,
      userId: req.user._id,
      requestId: req.requestId
    });

    const images = [];
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      const cdb = await cloudinary.v2.uploader.upload(fileData, {});
      images.push({
        public_id: cdb.public_id,
        url: cdb.secure_url,
      });
    }

    const gig = new Gig({
      title,
      gig_description,
      price,
      category,
      postedBy: req.user._id,
      images,
    });

    await gig.save({ session });

    await session.commitTransaction();
    session.endSession();

    const gridLat = Math.floor(req.user.address.coordinates[1] * 10) / 10;
    const gridLng = Math.floor(req.user.address.coordinates[0] * 10) / 10;

    clearCache([
      "gigs_all_1_10",
      `user_gigs_${req.user._id}`,
    ]);

    clearNearbyGigCacheGrid(gridLat, gridLng);

    logger.info("Gig created successfully", {
      gigId: gig._id,
      userId: req.user._id,
      imageCount: images.length,
      requestId: req.requestId,
    });

    return res.status(StatusCodes.CREATED).json({
      status: "success",
      message: "Gig created successfully",
      gig,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (uploadResults.length > 0) {
      await Promise.all(uploadResults.map((r) => cloudinary.v2.uploader.destroy(r.public_id)));
    }

    logger.error("Gig creation failed", {
      error: error.message,
      userId: req.user._id,
      requestId: req.requestId,
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to create gig, please try again later",
    });
  }
});

/**
 * @function getGig
 * @description Get all gigs from the database with pagination limit.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response with a success message and the list of gigs.
 * @throws - If an error occurs during the retrieval process, a JSON response with an error message is sent.
 * @async
 */
export const getGig = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 5;

  const MAX_LIMIT_PER_PAGE = 5;
  const MAX_TOTAL_ITEMS = 10;

  limit = Math.min(limit, MAX_LIMIT_PER_PAGE);

  const cacheKey = `gigs_all_${page}_${limit}`;

  const result = await getOrSetCache(cacheKey, async () => {
    const skip = (page - 1) * limit;

    const remainingItems = Math.max(0, MAX_TOTAL_ITEMS - skip);
    const actualLimit = Math.min(limit, remainingItems);

    const gigs = await Gig.find()
      .sort({ createdAt: -1 })
      .populate(
        "postedBy",
        "username email profilePic onlineStatus can_review skills address location"
      )
      .skip(skip)
      .limit(actualLimit)
      .exec();

    const totalGigsInDB = await Gig.countDocuments();
    const displayTotalGigs = Math.min(totalGigsInDB, MAX_TOTAL_ITEMS);
    const actualTotalPages = Math.ceil(displayTotalGigs / limit);

    return {
      gig: gigs,
      totalGigs: displayTotalGigs,
      totalPages: actualTotalPages, 
      currentPage: page
    };
  });

  logger.info('Gigs retrieved', {
    page,
    limit,
    gigCount: result.gig?.length || 0,
    totalDisplayed: result.totalGigs,
    userId: req.user?._id,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json(result);
});

/**
 * @function nearByGig
 * @description Get nearby gigs based on latitude and longitude.
 * @param {Object} req - The request object containing the latitude and longitude.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response with a success message and the list of nearby gigs.
 * @throws - If an error occurs during the retrieval process, a JSON response with an error message is sent.
 * @async
 */
export const nearByGig = catchAsync(async (req, res) => {
  const { latitude, longitude } = req.params;
  if (!latitude || !longitude) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "Latitude and Longitude are required" });
  }
  const gridLat = Math.floor(latitude * 10) / 10;
  const gridLng = Math.floor(longitude * 10) / 10;

  const cacheKey = `gigs_nearby_${gridLat}_${gridLng}`;

  const result = await getOrSetCache(cacheKey, async () => {
    const nearByUser = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          key: "address.coordinates",
          maxDistance: parseFloat(10000),
          distanceField: "dist.calculated",
          spherical: true,
        },
      },
    ]).exec();

    const userIds = nearByUser.map((user) => user._id);
    const nearByGigs = await Gig.find({ postedBy: { $in: userIds } })
      .sort({ createdAt: -1 })
      .populate(
        "postedBy",
        "username email profilePic onlineStatus can_review skills address location"
      )
      .limit(5)
      .lean()
      .exec();

    return { nearByGigs };
  }, 60);

  logger.info('Nearby gigs retrieved', {
    latitude,
    longitude,
    gigCount: result.nearByGigs?.length || 0,
    userId: req.user?._id,
    requestId: req.requestId
  });
  res.status(StatusCodes.OK).json(result);
});

/**
 * @function searchGig
 * @description Search for gigs based on various criteria.
 * @param {Object} req - The request object containing the search criteria.
 * @param {Object} res - The response object to send the response.
 * @param {Function} next - The next middleware function.
 * @returns - A JSON response with a success message and the list of gigs matching the search criteria.
 * @throws - If an error occurs during the search process, a JSON response with an error message is sent.
 * @async
 */
export const searchGig = catchAsync(async (req, res) => {
  const {
    text,
    category,
    lng,
    lat,
    distance,
    sortByRating,
    sortByPriceHighToLow,
    sortByPriceLowToHigh,
    page = 1,
    limit = 5
  } = req.query;

  let cacheKeyParts = [`search`];

  if (text) cacheKeyParts.push(`text_${text}`);
  if (category) cacheKeyParts.push(`cat_${category}`);
  if (lng && lat) cacheKeyParts.push(`loc_${lng}_${lat}`);
  if (distance) cacheKeyParts.push(`dist_${distance}`);
  if (sortByRating === "true") cacheKeyParts.push(`sort_rating`);
  if (sortByPriceHighToLow === "true") cacheKeyParts.push(`sort_price_desc`);
  if (sortByPriceLowToHigh === "true") cacheKeyParts.push(`sort_price_asc`);

  cacheKeyParts.push(`page_${page}_limit_${limit}`);

  const cacheKey = cacheKeyParts.join('_');
  const result = await getOrSetCache(cacheKey, async () => {
    let query = {};

    if (text) {
      const regex = new RegExp(text, "i");
      query.$or = [
        { title: { $regex: regex } },
        { gig_description: { $regex: regex } },
      ];
    }

    if (category) {
      const existingCategory = await Gig.findOne({ category });
      if (existingCategory) {
        query.category = category;
      } else {
        logger.info('No gigs found for category', {
          category,
          userId: req.user?._id,
          requestId: req.requestId
        });
        return {
          success: true,
          gig: [],
          totalGigs: 0,
          currentPage: page,
          totalPages: 0,
        };
      }
    }

    let sort = {};
    if (sortByRating === "true") sort.rating = -1;
    else if (sortByPriceHighToLow === "true") sort.price = -1;
    else if (sortByPriceLowToHigh === "true") sort.price = 1;
    else sort.createdAt = -1;

    const gigs = await Gig.find(query)
      .sort(sort)
      .populate(
        "postedBy",
        "username email profilePic onlineStatus can_review skills address location"
      )
      .skip((page - 1) * limit)
      .limit(limit);

    const totalGigs = await Gig.countDocuments(query);

    return {
      success: true,
      gig: gigs,
      totalGigs,
      currentPage: page,
      totalPages: Math.ceil(totalGigs / limit),
    };
  }, 180);

  logger.info('Gig search completed', {
    text,
    category,
    hasLocation: !!(lng && lat),
    userId: req.user?._id,
    requestId: req.requestId
  });
  res.status(StatusCodes.OK).json(result);
});


/**
 * @function getSingleUserGigs
 * @description Get all gigs posted by a single user.
 * @param {Object} req - The request object containing the user ID.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response with a success message and the list of gigs posted by the user.
 * @throws - If an error occurs during the retrieval process, a JSON response with an error message is sent.
 * @async
 */
export const getSingleUserGigs = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cacheKey = `user_gigs_${id}`;

  const result = await getOrSetCache(cacheKey, async () => {
    const userGigs = await Gig.find({ postedBy: id })
      .sort({ createdAt: -1 })
      .populate(
        "postedBy",
        "username email profilePic onlineStatus can_review skills address location"
      )
      .exec();
    return { userGigs };
  }, 600); // 10 minute TTL for user gigs

  logger.info('User gigs retrieved', { userId: id, gigCount: result.userGigs?.length || 0, userId: req.user?._id, requestId: req.requestId });
  res.status(200).json(result);
});

/**
 * @function deleteSingleGig
 * @description Delete a single gig by its ID.
 * @param {Object} req - The request object containing the gig ID in params.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response with a success message if the gig is deleted.
 * @throws - If an error occurs during the deletion process, a JSON response with an error message is sent.
 * @async
 */
export const deleteSingleGig = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(StatusCodes.NOT_FOUND).json({ messge: "Something went wrong: " })
  }

  const gig = await Gig.findById(id);

  if (!gig) {
    logger.warn('Gig not found', { gigId: id, userId: req.user?._id, requestId: req.requestId });
    return res.status(404).json({ message: "Gig not found" });
  }

  if (req.user && gig.postedBy.toString() !== req.user._id.toString()) {
    logger.warn('Unauthorized to delete gig', {
      gigId: id,
      userId: req.user._id,
      requestId: req.requestId
    });
    return res.status(403).json({ message: "Unauthorized to delete this gig" });
  }
  if (gig.images && gig.images.length > 0) {
    for (const image of gig.images) {
      await cloudinary.v2.uploader.destroy(image.public_id);
    }
  }

  await gig.deleteOne();

  clearCache([
    'gigs_all_1_10',
    `user_gigs_${gig.postedBy}`,
  ]);

  const gridLat = Math.floor(gig.postedBy.address.coordinates[1] * 10) / 10;
  const gridLng = Math.floor(gig.postedBy.address.coordinates[0] * 10) / 10;

  clearNearbyGigCacheGrid(gridLat, gridLng);


  logger.info('Gig deleted successfully', {
    gigId: gig._id,
    userId: req.user._id,
    requestId: req.requestId
  });
  res.status(StatusCodes.OK).json({ message: "Gig deleted successfully" });

});

/**
 * @function getSingleGig
 * @description Get a single gig by its ID.
 * @param {Object} req - The request object containing the gig ID in params.
 */

export const getSingleGig = catchAsync(async (req, res) => {
  const { gigId } = req.params;

  if (!gigId) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Something went wrong: Gig not found" });
  }
  const cacheKey = `single_gig_${gigId}`;

  const result = await getOrSetCache(cacheKey, async () => {
    const gig = await Gig.findById(gigId)
      .populate(
        "postedBy",
        "username email profilePic onlineStatus can_review skills address location"
      )
      .exec();

    if (!gig) {
      return null;
    }

    return gig;
  });

  if (!result) {
    logger.warn('Gig not found', {
      gigId,
      userId: req.user?._id,
      requestId: req.requestId
    });
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Gig not found" });
  }
  logger.info('Gig retrieved successfully', {
    gigId,
    userId: req.user?._id,
    requestId: req.requestId
  });
  res.status(StatusCodes.OK).json({
    success: true,
    gig: result,
  });
});






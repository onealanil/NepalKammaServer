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
import { getOrSetCache, clearCache } from "../../../utils/cacheService.js";
import { StatusCodes } from "http-status-codes";
import logger from "../../../utils/logger.js";
/**
 * @function uploadImages
 * @description Upload images to Cloudinary and save the image data to the database.
 * @param {Object} req - The request object containing the files to be uploaded.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response with a success message and the image data.
 * @throws - If an error occurs during the upload process, a JSON response with an error message is sent.
 * @async
 */
export const uploadImages = catchAsync(async (req, res) => {
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

  const imagesData = new Gig({
    images: images,
  });

  await imagesData.save();

  logger.info('Gig images uploaded successfully', {
    gigId: imagesData._id,
    imageCount: images.length,
    userId: req.user._id,
    requestId: req.requestId
  });

  res.status(StatusCodes.CREATED).json({ message: "Successfully! uploaded", imagesData });
});

/**
 * @function createGig
 * @description Create a new gig and save it to the database.
 * @param {Object} req - The request object containing the gig data.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response with a success message and the created gig data.
 * @throws - If an error occurs during the creation process, a JSON response with an error message is sent.
 * @async
 */
export const createGig = catchAsync(async (req, res) => {
  const gig_id = req.params.id;
  const gig = await Gig.findById(gig_id);

  if (!gig) {
    logger.warn('Gig not found', { gigId: gig_id, userId: req.user._id, requestId: req.requestId });
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Gig not found" });
  }

  const { title, gig_description, price, category } = req.body;

  logger.info('Gig update started', {
    gigId: gig_id,
    title,
    category,
    userId: req.user._id,
    requestId: req.requestId
  });

  const gigData = await Gig.findByIdAndUpdate(
    gig_id,
    {
      title,
      gig_description,
      price,
      category,
      postedBy: req.user._id,
    },
    { new: true }
  );

  // Clear relevant caches after creating/updating a gig
  clearCache([
    'gigs_all_1_10', // First page of all gigs
    `user_gigs_${req.user._id}`, // User's gigs
  ]);

  logger.info('Gig updated successfully', {
    gigId: gigData._id,
    userId: req.user._id,
    requestId: req.requestId
  });

  res.status(StatusCodes.CREATED).json({ status: "success", message: "Successfully! created", gigData });
});


/**
 * @function getGig
 * @description Get all gigs from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response with a success message and the list of gigs.
 * @throws - If an error occurs during the retrieval process, a JSON response with an error message is sent.
 * @async
 */
export const getGig = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const cacheKey = `gigs_all_${page}_${limit}`;

  const result = await getOrSetCache(cacheKey, async () => {
    const gigs = await Gig.find()
      .sort({ createdAt: -1 })
      .populate(
        "postedBy",
        "username email profilePic onlineStatus can_review skills address location"
      )
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalGigs = await Gig.countDocuments();

    return {
      gig: gigs,
      totalGigs,
      totalPages: Math.ceil(totalGigs / limit),
      currentPage: page
    };
  });

  logger.info('Gigs retrieved', {
    page,
    gigCount: result.totalGigs,
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
  const cacheKey = `gigs_nearby_${latitude}_${longitude}`;

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
      .exec();

    return { nearByGigs };
  }, 300); // 5 minute TTL for location-based gigs
  logger.info('Nearby gigs retrieved', {
    latitude,
    longitude,
    gigCount: result.nearByGigs?.length || 0,
    userId: req.user?._id,
    requestId: req.requestId
  });
  res.status(200).json(result);
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
  }, 180); // 3 minute TTL for search results
  logger.info('Gig search completed', {
    text,
    category,
    hasLocation: !!(lng && lat),
    userId: req.user?._id,
    requestId: req.requestId
  });
  res.status(200).json(result);
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

    // Clear related caches
    clearCache([
      'gigs_all_1_10',
      `user_gigs_${gig.postedBy}`,
    ]);
    logger.info('Gig deleted successfully', {
      gigId: gig._id,
      userId: req.user._id,
      requestId: req.requestId
    });
    res.status(200).json({ message: "Gig deleted successfully" });

});

// /**
//  * @function getSingleGig
//  * @description Get a single gig by its ID.
//  * @param {Object} req - The request object containing the gig ID in params.
//  */

export const getSingleGig = catchAsync(async (req, res) => {
    const { gigId } = req.params;
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
      return res.status(404).json({ message: "Gig not found" });
    }
    logger.info('Gig retrieved successfully', {
      gigId,
      userId: req.user?._id,
      requestId: req.requestId
    });
    res.status(200).json({
      success: true,
      gig: result,
    });
});






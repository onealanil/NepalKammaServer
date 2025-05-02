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
  try {
    const files = getDataUris(req.files);

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

    res.status(201).json({ message: "Successfully! uploaded", imagesData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload images" });
  }
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
  try {
    const gig_id = req.params.id;
    const gig = await Gig.findById(gig_id);
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }
    
    const { title, gig_description, price, category } = req.body;
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
      // Add other cache keys that might be affected
    ]);

    res.status(201).json({ message: "Successfully! created", gigData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create gig" });
  }
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
  try {
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

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get gig" });
  }
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
  try {
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

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get near by gig" });
  }
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
export const searchGig = catchAsync(async (req, res, next) => {
  try {
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

    // Create a unique cache key based on all search parameters
    const cacheKey = `gigs_search_${text}_${category}_${lng}_${lat}_${distance}_${
      sortByRating
    }_${sortByPriceHighToLow}_${sortByPriceLowToHigh}_${page}_${limit}`;

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

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
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
  try {
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

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user gigs" });
  }
});

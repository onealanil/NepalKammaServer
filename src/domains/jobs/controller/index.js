/**
 * @file Jobs/index.js
 * @description This file contains the controller functions for the job module.
 * @module JobsController
 * @requires express - The Express framework
 * @requires Job - The Job model
 * @requires User - The User model
 * @requires NotificationModel - The Notification model
 * @requires catchAsync - A utility function to handle asynchronous errors
 * @requires recommendJobs - A helper function for job recommendations
 * @requires firebase - Firebase services for notifications
 */

import catchAsync from "../../../utils/catchAsync.js";
import Job from "../../../../models/Job.js";
import recommendJobs from "../helper/JobRecommendation.js";
import NotificationModel from "../../../../models/Notification.js";
import User from "../../../../models/User.js";
import { emitNotification } from "../../../../socketHandler.js";
import firebase from "../../../firebase/index.js";
import { getOrSetCache, clearCache } from "../../../utils/cacheService.js";

/**
 * @function createJob
 * @description Creates a new job posting and sends notifications to relevant job seekers.
 * @param {Object} req - The request object containing job details and user information.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response indicating success or failure of job creation.
 * @throws - If an error occurs during the process, a JSON response with an error message is sent.
 * @async
 */
export const createJob = catchAsync(async (req, res) => {
  try {
    const {
      title,
      location,
      latitude,
      longitude,
      phoneNumber,
      skills_required,
      job_description,
      payment_method,
      price,
      category,
      experiesInHrs,
    } = req.body;

    console.log(req.body, "req.body");

    let experiesIndate = new Date();
    let priority = "Low";

    if (typeof experiesInHrs === "number") {
      experiesInHrs.toString();
    }

    if (experiesInHrs === "6") {
      experiesIndate = new Date(new Date().getTime() + 6 * 60 * 60 * 1000);
      priority = "Urgent";
      // experiesIndate = new Date(new Date().getTime() + 0.5 * 60 * 1000);
    } else if (experiesInHrs === "12") {
      experiesIndate = new Date(new Date().getTime() + 12 * 60 * 60 * 1000);
      priority = "Medium";
    } else if (experiesInHrs === "24") {
      experiesIndate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
      priority = "Low";
    } else {
      return res.status(500).json({ message: "Invalid experiesInHrs" });
    }

    const jobData = new Job({
      title,
      location,
      address: {
        coordinates: [longitude, latitude],
      },
      phoneNumber,
      skills_required,
      job_description,
      payment_method,
      price,
      category,
      postedBy: req.user._id,
      experiesIn: experiesIndate,
      priority: priority,
    });

    await jobData.save();

    // Create notifications for job seekers with matching skills
    const jobSeekers = await User.find({
      role: "job_seeker",
      skills: { $in: skills_required },
    });

    const notifications = await Promise.all(
      jobSeekers.map(async (jobSeeker) => {
        const sender = await User.findById(req.user._id);
        return {
          senderId: req.user._id,
          senderUsername: sender.username,
          senderProfilePic: sender.profilePic?.url,
          recipientId: jobSeeker._id,
          jobId: jobData._id,
          notification: `${title} - ${job_description}`,
          type: "job_posted",
          onlineStatus: sender.onlineStatus,
          fcm_token: jobSeeker.fcm_token,
        };
      })
    );
    await NotificationModel.insertMany(notifications); experiesIndate
    notifications.forEach((notification) => {
      if (notification.onlineStatus) {
        emitNotification(req.io, notification.recipientId.toString(), {
          senderId: notification.senderId,
          recipientId: notification.recipientId,
          notification: notification.notification,
          profilePic: notification.senderProfilePic,
          senderUsername: notification.senderUsername,
          type: "job_posted",
        });
      }
    });

    const sendNotificationRecommendation = async (notification) => {
      try {
        await firebase.messaging().send({
          token: notification?.fcm_token,
          notification: {
            title:
              notification.senderUsername + ": Job Recommendation for you🎆😍",
            body: title,
          },
        });
      } catch (err) {
        console.error(err);
      }
    };

    // Send push notifications to job seekers with matching skills
    notifications.forEach(async (notification) => {
      if (notification.fcm_token) {
        sendNotificationRecommendation(notification);
      }
    });

    // Create notifications for nearby job seekers
    const nearbyJobSeekers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          key: "address.coordinates",
          maxDistance: 10000, // 10km
          distanceField: "distance",
          spherical: true,
        },
      },
      {
        $match: {
          role: "job_seeker",
        },
      },
    ]);

    const locationNotifications = await Promise.all(
      nearbyJobSeekers.map(async (jobSeeker) => {
        const sender = await User.findById(req.user._id);
        return {
          senderId: req.user._id,
          senderUsername: sender.username,
          senderProfilePic: sender.profilePic?.url,
          recipientId: jobSeeker._id,
          jobId: jobData._id,
          notification: `${title} - ${job_description}`,
          type: "job_posted_location",
          onlineStatus: sender.onlineStatus,
          fcm_token: jobSeeker.fcm_token,
        };
      })
    );
    await NotificationModel.insertMany(locationNotifications);
    locationNotifications.forEach((notification) => {
      if (notification.onlineStatus) {
        emitNotification(req.io, notification.recipientId.toString(), {
          senderId: notification.senderId,
          recipientId: notification.recipientId,
          notification: notification.notification,
          profilePic: notification.senderProfilePic,
          senderUsername: notification.senderUsername,
          type: "job_posted_location",
        });
      }
    });

    const sendNotificationNearBy = async (notification) => {
      try {
        await firebase.messaging().send({
          token: notification?.fcm_token,
          notification: {
            title: `Job found in ${location}🎆😍`,
            body: title,
          },
        });
      } catch (err) {
        console.error(err);
      }
    };

    // Send push notifications to job seekers with matching skills
    locationNotifications.forEach(async (notification) => {
      if (notification.fcm_token) {
        sendNotificationNearBy(notification);
      }
    });

    clearCache([
      "jobs_1_5", // First page of jobs
      `nearby_${latitude}_${longitude}`,
      `user_jobs${req.user._id}`
    ]);

    res.status(201).json({ message: "Successfully! created", job: jobData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create job" });
  }
});

/**
 * @function getJob
 * @description Retrieves a paginated list of public pending jobs.
 * @param {Object} req - The request object containing pagination parameters.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response containing the job list and pagination details.
 * @throws - If an error occurs during the process, a JSON response with an error message is sent.
 * @async
 */
export const getJob = catchAsync(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    // Calculate the index of the first item for the current page
    const startIndex = (page - 1) * limit;

    // Create a unique cache key based on the request parameters
    const cacheKey = `jobs_${page}_${limit}`;

    const result = await getOrSetCache(cacheKey, async () => {
      const job = await Job.find({
        visibility: "public",
        job_status: "Pending",
      })
        .sort({ createdAt: -1 })
        .populate(
          "postedBy",
          "username email profilePic onlineStatus can_review"
        )
        .skip(startIndex)
        .limit(limit)
        .exec();

      const totalJobs = await Job.countDocuments({
        visibility: "public",
        job_status: "Pending",
      });

      const totalPages = Math.ceil(totalJobs / limit);

      return { job, totalPages, totalJobs, currentPage: page };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get job" });
  }
});

/**
 * @function getSingleUserJobs
 */
export const getSingleUserJobs = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `user_jobs${req.user._id}`;

    const result = await getOrSetCache(cacheKey, async () => {
      const userJobs = await Job.find({ postedBy: id })
        .sort({ createdAt: -1 })
        .populate(
          "postedBy",
          "username email profilePic onlineStatus can_review skills address location"
        )
        .populate(
          "assignedTo",
          "username email profilePic onlineStatus skills address location"
        )
        .exec();
      return { userJobs };
    }, 600);

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user jobs" });
  }
});


/**
 * @function nearBy
 * @description Retrieves nearby jobs based on geographic coordinates.
 * @param {Object} req - The request object containing latitude and longitude.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response containing nearby jobs.
 * @throws - If an error occurs during the process, a JSON response with an error message is sent.
 * @async
 */
export const nearBy = catchAsync(async (req, res) => {
  try {
    const { latitude, longitude } = req.params;
    const cacheKey = `nearby_${latitude}_${longitude}`;

    const result = await getOrSetCache(cacheKey, async () => {
      const nearBy = await Job.aggregate([
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
        {
          $match: { visibility: "public", job_status: "Pending" },
        },
      ]).exec();

      const jobIds = nearBy.map((job) => job._id);
      const populatedJobs = await Job.find({ _id: { $in: jobIds } })
        .sort({ createdAt: -1 })
        .populate(
          "postedBy",
          "username email profilePic onlineStatus can_review"
        )
        .limit(8)
        .exec();

      return { nearBy: populatedJobs };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get job" });
  }
});


export const recommendationJobs = async (req, res) => {
  try {
    const id = req.user._id;
    if (!id) return res.status(400).json({ message: "User ID is required" });

    const cacheKey = `recommendations_${id}`;

    const result = await getOrSetCache(cacheKey, async () => {
      // Get recommendations with metadata from your enhanced algorithm
      const recommendJobsList = await recommendJobs(id);

      if (recommendJobsList.length === 0) {
        return {
          recommendedJobs: [],
          totalCount: 0,
          message: "No recommendations found. Complete your profile for better matches."
        };
      }

      const jobIds = recommendJobsList.map((job) => job._id);

      const populatedUsers = await User.find({
        _id: { $in: recommendJobsList.map(job => job.postedBy) }
      })
        .select("username email profilePic onlineStatus can_review")
        .lean();

      // Add populated user data to recommendation results
      const enhancedJobs = recommendJobsList.map(job => {
        const populatedUser = populatedUsers.find(
          user => user._id.toString() === job.postedBy.toString()
        );

        return {
          ...job,
          postedBy: populatedUser || job.postedBy
        };
      });

      return {
        recommendedJobs: enhancedJobs,
        totalCount: enhancedJobs.length,
        algorithm: "Enhanced TF-IDF with skill matching",
        generatedAt: new Date().toISOString()
      };
    }, 300);

    res.status(200).json(result);
  } catch (err) {
    console.error("Recommendation API Error:", err);
    res.status(500).json({
      message: "Failed to get job recommendations",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @function searchJob
 * @description Searches for jobs based on various criteria including text, category, location, and sorting options.
 * @param {Object} req - The request object containing search parameters.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response containing matching jobs and pagination details.
 * @throws - If an error occurs during the process, a JSON response with an error message is sent.
 * @async
 */
export const searchJob = catchAsync(async (req, res, next) => {
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
    } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    // Create a unique cache key based on all search parameters
    const cacheKey = `search_${text}_${category}_${lng}_${lat}_${distance}_${sortByRating}_${sortByPriceHighToLow}_${sortByPriceLowToHigh}_${page}_${limit}`;

    const result = await getOrSetCache(cacheKey, async () => {
      let query = { visibility: "public", job_status: "Pending" };

      if (text) {
        const regex = new RegExp(text, "i");
        query.$or = [
          { title: { $regex: regex } },
          { job_description: { $regex: regex } },
        ];
      }

      if (category === "" || category === "All") {
        // No need to add category to the query
      } else {
        const existingCategory = await Job.findOne({ category });
        if (existingCategory) {
          query.category = category;
        } else {
          // Return an empty array if the selected category does not exist
          return {
            success: true,
            job: [],
            totalJobs: 0,
            currentPage: page,
            totalPages: 0,
          };
        }
      }

      // Define the sort order
      let sort = {};
      if (sortByRating === "true") {
        sort.rating = -1;
      } else if (sortByPriceHighToLow === "true") {
        sort.price = -1;
      } else if (sortByPriceLowToHigh === "true") {
        sort.price = 1;
      } else {
        sort.createdAt = -1;
      }

      if (lng && lat && distance > 0) {
        const radius = parseFloat(distance) / 6378.1;
        query.address = {
          $geoWithin: {
            $centerSphere: [[parseFloat(lng), parseFloat(lat)], radius],
          },
        };
      }

      // Execute the search query
      const jobs = await Job.find(query)
        .sort(sort)
        .populate(
          "postedBy",
          "username email profilePic onlineStatus can_review"
        )
        .skip((page - 1) * limit)
        .limit(limit);

      const totalJobs = await Job.countDocuments(query);

      return {
        success: true,
        job: jobs,
        totalJobs,
        currentPage: page,
        totalPages: Math.ceil(totalJobs / limit),
      };
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Function to escape regular expression special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * @function updateJobStatus
 * @description Updates the status of a job (e.g., pending, assigned, completed).
 * @param {Object} req - The request object containing job ID and new status.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response indicating success or failure of the update.
 * @throws - If an error occurs during the process, a JSON response with an error message is sent.
 * @async
 */
export const updateJobStatus = catchAsync(async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { job_status, assignedTo } = req.body;
    console.log(jobId, job_status, assignedTo);

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job_status === "Cancelled") {
      if (!job.assignedTo) {
        return res.status(400).json({ message: "Job is already unassigned" });
      }

      job.job_status = "Pending";
      job.assignedTo = null;
      const updatedJob = await job.save();

      clearCache([
        "jobs_1_5", 
        `nearby_${job.address.coordinates[1]}_${job.address.coordinates[0]}`,
        `user_jobs${req.user._id}`
      ]);

      return res.status(200).json({ message: "Job reset to Pending", job: updatedJob });
    }

    job.job_status = job_status;
    if (assignedTo) {
      job.assignedTo = assignedTo;
    }

    const updatedJob = await job.save();

    clearCache([
      "jobs_1_5", 
      `nearby_${job.address.coordinates[1]}_${job.address.coordinates[0]}`,
      `user_jobs${req.user._id}`
    ]);

    res.status(200).json({ message: "Job status updated", job: updatedJob });
  } catch (error) {
    next(error);
  }
});


/**
 * @function completedJobs
 * @description Retrieves all completed jobs posted by the current user.
 * @param {Object} req - The request object containing user information.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response containing completed jobs.
 * @throws - If an error occurs during the process, a JSON response with an error message is sent.
 * @async
 */
export const completedJobs = catchAsync(async (req, res, next) => {
  try {
    // Find jobs for the current page using skip and limit
    const job = await Job.find({
      postedBy: req.user._id,
      job_status: "Completed",
    })
      .sort({ createdAt: -1 })
      .populate("postedBy", "username email profilePic onlineStatus can_review")
      .populate(
        "assignedTo",
        "_id username email profilePic onlineStatus can_review"
      )
      .exec();

    // Get total number of jobs
    const totalJobs = await Job.countDocuments({
      postedBy: req.user._id,
      job_status: "Completed",
    });

    res.status(200).json({
      job,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get job" });
  }
});

/**
 * @function deleteJobs
 * @description Deletes a specific job posting.
 * @param {Object} req - The request object containing job ID.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response indicating success or failure of deletion.
 * @throws - If an error occurs during the process, a JSON response with an error message is sent.
 * @async
 */
export const deleteJobs = catchAsync(async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (
      job?.job_status === "In_Progress" &&
      job?.job_status === "Completed" &&
      job?.job_status === "Cancelled"
    ) {
      return res
        .status(400)
        .json({ message: "You can't delete this job, it is already assigned" });
    }

    await Job.findByIdAndDelete(jobId);

    // Get coordinates from the job before deleting
    const coordinates = job.address.coordinates;

    // Clear relevant caches when job is deleted
    clearCache([
      "jobs_1_5", // First page of jobs
      `nearby_${coordinates[1]}_${coordinates[0]}`,
      `user_jobs${req.user._id}`
    ]);
    res.status(200).json({ message: "Job deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete job" });
  }
});

/**
 * @function getSingleJob
 * @description Retrieves a single job by its ID.
 * @param {Object} req - The request object containing the job ID.
 * @param {Object} res - The response object to send the response.
 * @returns - A JSON response with job details or an error message.
 * @throws - If the job is not found or an internal error occurs.
 * @async
 */
export const getSingleJob = catchAsync(async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    const cacheKey = `single_job_${jobId}`;

    const result = await getOrSetCache(cacheKey, async () => {
      const job = await Job.findById(jobId)
        .populate(
          "postedBy",
          "username email profilePic onlineStatus can_review skills address location"
        )
        .populate(
          "assignedTo",
          "username email profilePic onlineStatus skills address location"
        )
        .exec();

      if (!job) {
        return null;
      }

      return job;
    });

    if (!result) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({
      success: true,
      job: result,
    });
  } catch (err) {
    console.error("Error fetching single job:", err);
    res.status(500).json({ message: "Failed to get the job" });
  }
});

/**
 * @function getRecentPublicJobs
 * @description Retrieves the 5 most recent public jobs.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object to send the response.
 * @returns {Object} - JSON response containing the recent jobs or an error message.
 * @throws - Returns 404 if no jobs found, 500 for server errors.
 * @async
 */
export const getRecentPublicJobs = catchAsync(async (req, res) => {
  try {
    const cacheKey = `recent_public_jobs`;

    const result = await getOrSetCache(cacheKey, async () => {
      const jobs = await Job.find({
        visibility: "public",
        job_status: "Pending"
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate(
          "postedBy",
          "username email profilePic onlineStatus can_review skills address location"
        )
        .populate(
          "assignedTo",
          "username email profilePic onlineStatus skills address location"
        )
        .exec();

      return jobs.length > 0 ? jobs : null;
    });

    res.status(200).json({
      success: true,
      jobs: result || [],
    });
  } catch (err) {
    console.error("Error fetching recent public jobs:", err);
    res.status(500).json({ message: "Failed to fetch recent public jobs" });
  }
});

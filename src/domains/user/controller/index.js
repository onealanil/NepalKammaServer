/**
 * @file index.js
 * @module UserController
 * @description This file contains the controller functions for user-related operations such as creating a user, verifying OTP, logging in, editing profile, and more.
 * @requires catchAsync - A utility function to handle asynchronous errors in Express routes.
 * @requires User - The User model for interacting with the user collection in the database.
 * @requires bcrypt - A library for hashing passwords and comparing hashed values.
 * @requires sendOTPVerificationEmail - A utility function to send OTP verification emails.
 * @requires UserOTPVerification - The UserOTPVerification model for interacting with the OTP verification collection in the database.
 * @requires hashPassword - A utility function to hash passwords using bcrypt.
 * @requires jwt - A library for creating and verifying JSON Web Tokens.
 * @requires cloudinary - A library for interacting with Cloudinary for image uploads.
 * @requires getDataUri - A utility function to convert files to data URIs.
 * @requires getDataUris - A utility function to convert multiple files to data URIs.
 * @requires Job - The Job model for interacting with the job collection in the database.
 * @requires Review - The Review model for interacting with the review collection in the database.
 * @requires express - A web framework for Node.js.
 */

import catchAsync from "../../../utils/catchAsync.js";
import User from "../../../../models/User.js";
import bcrypt from "bcrypt";
import { sendOTPVerificationEmail } from "../Otp/sendVerficationEmail.js";
import UserOTPVerification from "../../../../models/UserOTPVerification.js";
import { hashPassword } from "../../../utils/hashBcrypt.js";
import jwt from "jsonwebtoken";
import cloudinary from "cloudinary";
import { getDataUri, getDataUris } from "../../../utils/Features.js";
import Job from "../../../../models/Job.js";
import Review from "../../../../models/Review.js";
import { generateAccessToken, generateRefreshToken } from "../../../utils/jwt.js";

/**
 * @function createUser
 * @param req - The request object containing user data for signup.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles user signup by validating the input data, checking for existing users, hashing the password, and sending an OTP verification email.
 * @returns - A JSON response indicating the success or failure of the signup process.
 * @throws - If an error occurs during the process, it throws an error with a message.
 */
export const createUser = catchAsync(async (req, res) => {
  try {
    console.log(req.body)
    const {
      username,
      email,
      password,
      role,
      gender,
      fcm_token,
      security_answer,
      location,
      latitude,
      longitude
    } = req.body;
    const findEmail = await User.findOne({ email });
    const findUsername = await User.findOne({ username });

    if (findUsername && findUsername.isVerified === true) {
      return res.status(422).json({ message: "Username already exists" });
    }
    if (findEmail && findEmail.isVerified === true) {
      return res.status(422).json({ message: "Email already exists" });
    }
    if (findEmail && findEmail.isVerified === false) {
      await User.findOneAndDelete({ email: findEmail.email });
    }

    const hashedPassword = await hashPassword(password);
    const hashedSecurityAnswer = await hashPassword(security_answer);

    const signupUser = new User({
      email,
      password: hashedPassword,
      username,
      role,
      gender,
      isVerified: false,
      fcm_token,
      security_answer: hashedSecurityAnswer,
      location,
      address: {
        coordinates: [longitude, latitude],
      },
    });

    await signupUser
      .save()
      .then((result) => {
        // handle account verification
        sendOTPVerificationEmail(result, res);
      })
      .catch((err) => {
        throw new Error(err);
      });
  } catch (err) {
    throw new Error(err);
  }
});

/**
 * @function verifyUser
 * * @param req - The request object containing user data for verification.
 * * @param res - The response object to send the response back to the client.
 * * @description - This function handles user verification by checking the OTP provided by the user, updating the user's verification status, and deleting the OTP records.
 * * @returns - A JSON response indicating the success or failure of the verification process.
 * * @throws - If an error occurs during the process, it throws an error with a message.
 */
export const verifyUser = catchAsync(async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(422).json({
        status: "failed",
        message: "All fields are required",
      });
    }

    // Retrieve user otp records
    const userOtpRecords = await UserOTPVerification.find({ userId });
    if (userOtpRecords.length <= 0) {
      return res.status(422).json({
        status: "failed",
        message: "Invalid OTP",
      });
    }
    const { expiresAt, otp: hashedOTP } = userOtpRecords[0];
    if (expiresAt < Date.now()) {
      await UserOTPVerification.deleteMany({ userId });
      return res.status(422).json({
        status: "failed",
        message: "OTP expired",
      });
    }

    const isMatch = await bcrypt.compare(otp, hashedOTP);

    if (!isMatch) {
      return res.status(422).json({
        status: "failed",
        message: "Invalid OTP",
      });
    }

    // Update user verification status and delete OTP records
    await User.findByIdAndUpdate(userId, { isVerified: true });
    await UserOTPVerification.deleteMany({ userId });

    const user = await User.findById(userId).select("-password -documents");
    // await sendVerifiedEmail(user?.email, user?.username, user?._id, res);

    return res.json({
      status: "success",
      message: "OTP verified successfully",
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * @function resendOTP
 * * @param req - The request object containing user data for resending OTP.
 * * @param res - The response object to send the response back to the client.
 * @description - This function handles resending the OTP verification email to the user by deleting existing OTP records and sending a new OTP.
 * * @returns - A JSON response indicating the success or failure of the resend process.
 * * @throws - If an error occurs during the process, it throws an error with a message.
 */
export const resendOTP = catchAsync(async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId || !email) {
      return res.json({
        status: "failed",
        message: "All fields are required",
      });
    } else {
      // delete existing records and resend
      await UserOTPVerification.deleteMany({ userId });
      sendOTPVerificationEmail({ _id: userId, email }, res);

      // const user = await User.findOne({ _id: userId, email });
      // if (!user) {
      //   return res.json({
      //     status: "failed",
      //     message: "User not found",
      //   });
      // } else {
      //   sendOTPVerificationEmail(user, res);
      // }
    }
  } catch (err) {
    res.json({
      status: "failed",
      message: "Something went wrong",
    });
  }
});

/**
 * @function LoginUser
 * @param req - The request object containing user login data.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles user login by validating the input data, checking for existing users, comparing passwords, and generating a JWT token.
 * @returns - A JSON response containing the login status, token, and user data.
 * @throws - If an error occurs during the process, it throws an error with a message.
 */
export const LoginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password)
  if (!email || !password) {
    return res.status(422).json({ message: "Something went wrong" });
  }
  const findEmail = await User.findOne({ email });
  if (!findEmail || findEmail == null) {
    return res.status(422).json({ message: "Email not found" });
  } else {
    if (findEmail.isVerified === true) {
      const decryptPass = await bcrypt.compare(password, findEmail.password);
      if (decryptPass) {
        if (findEmail.userAccountStatus !== "Active") {
          return res.status(401).json({
            message: "Your account is inactive. Please contact the admin.",
          });
        }

        // Generate tokens
        const accessToken = generateAccessToken(findEmail._id);
        const refreshToken = generateRefreshToken(findEmail._id);

        findEmail.save();
        const userInfo = {
          _id: findEmail._id,
          role: findEmail.role,
          username: findEmail.username,
          location: findEmail.location,
          address: findEmail.address
        };

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });

        res.status(200).json({
          status: "success",
          message: "Successfully, logged in",
          accessToken,
          user: userInfo,
        });
      } else {
        return res
          .status(422)
          .json({ message: "Email or Password doesn't match" });
      }
    } else {
      return res.status(422).json({ message: "Your email is not verified!" });
    }
  }
});

/**
 * @function forgetPassword
 * @param req - The request object containing user data for password reset.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles password reset by validating the input data, checking for existing users, comparing security answers, and updating the password.
 * @returns - A JSON response indicating the success or failure of the password reset process.
 * @throws - If an error occurs during the process, it throws an error with a message.
 */
export const forgetPassword = catchAsync(async (req, res) => {
  try {
    const { email, security_answer, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const isSecurityAnswerValid = await bcrypt.compare(
      security_answer,
      user.security_answer
    );

    if (!isSecurityAnswerValid) {
      return res.status(422).json({ message: "Security answer is incorrect" });
    }

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password" });
  }
});

/**
 * @function logoutUser
 * @req - The request object containing user data for logout.
 * @res - The response object to send the response back to the client.
 * @description - This function handles user logout by clearing the user's fcm_token and online status.
 * @returns - A JSON response indicating the success or failure of the logout process.
 * @throws - If an error occurs during the process, it throws an error with a message.
 */
export const logoutUser = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Optional: clear FCM token and mark offline
  user.fcm_token = "";
  user.onlineStatus = false;
  await user.save();

  // Clear the refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return res.status(200).json({ message: "Logged out successfully" });
});

/**
 * @function editProfile
 * @param req - The request object containing user data for editing profile.'
 * @param res - The response object to send the response back to the client.
 * @description - This function handles user profile editing by validating the input data, updating the user's profile, and returning the updated user data.
 * @returns - A JSON response containing the updated user data without the password field.
 * @throws - If an error occurs during the process, it throws an error with a message.
 */
export const editProfile = catchAsync(async (req, res) => {
  try {
    const id = req.params.id;
    const {
      username,
      title,
      bio,
      about_me,
      skills,
      location,
      latitude,
      longitude,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        username,
        title,
        bio,
        location,
        address: {
          coordinates: [longitude, latitude],
        },
        about_me,
        skills,
      },
      { new: true }
    );

    const { password, ...userWithoutPassword } = user.toObject();

    res.status(200).json({ user: userWithoutPassword });
  } catch (err) {
    throw new Error(err);
  }
});

/**
 *
 * @function updateProfilePicController
 * @param req - The request object containing user data for updating profile picture.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles user profile picture update by deleting the previous image from Cloudinary, uploading the new image, and updating the user's profile picture in the database.
 * @returns - A JSON response indicating the success or failure of the profile picture update process.
 * @throws - If an error occurs during the process, it sends a 500 status code with an error message.
 */
export const updateProfilePicController = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // file get from client photo
    const file = getDataUri(req.file);
    // delete prev image
    await cloudinary.v2.uploader.destroy(user.profilePic.public_id);
    // update
    const cdb = await cloudinary.v2.uploader.upload(file.content);
    user.profilePic = {
      public_id: cdb.public_id,
      url: cdb.secure_url,
    };
    // save func
    await user.save();

    res.status(200).send({
      success: true,
      public_id: cdb.public_id,
      url: cdb.secure_url,
      message: "Profile picture updated",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error In update profile pic API",
      error,
    });
  }
};

/**
 * @function updatePhoneNumber
 * @param req - The request object containing user data for updating phone number.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles user phone number update by checking for existing users with the same phone number, updating the user's phone number, and returning a success message.
 * @returns - The updated user data without the password filed and updated phone number.
 * @throws - If an error occurs during the process, it sends a 500 status code with an error message.
 */
export const updatePhoneNumber = async (req, res) => {
  try {
    const { phone } = req.body;
    const existingUser = await User.findOne({
      phoneNumber: phone,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(400).send({
        success: false,
        message: "Phone number already exists",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "User not found, Login again!",
      });
    }

    user.phoneNumber = phone;
    await user.save();

    return res.status(200).send({
      success: true,
      message: "Phone number updated",
    });

  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error In update phone number API",
      error,
    });
  }
};

/**
 * @function uploadDocuments
 * @param req - The request object containing user data for uploading documents.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles user document upload by validating the input data, uploading the documents to Cloudinary, and updating the user's documents in the database.
 * @returns - A JSON response indicating the success or failure of the document upload process.
 * @throws - If an error occurs during the process, it sends a 500 status code with an error message.
 *
 */
export const uploadDocuments = catchAsync(async (req, res) => {
  try {
    const files = getDataUris(req.files);

    const user = await User.findById(req.user._id);

    const images = [];
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      const cdb = await cloudinary.v2.uploader.upload(fileData, {});
      images.push({
        public_id: cdb.public_id,
        url: cdb.secure_url,
      });
    }

    user.documents = images;
    user.isDocumentVerified = "Pending";
    await user.save();

    res.status(201).json({ message: "Successfully! uploaded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload images" });
  }
});

/**
 * @function getSingleUser
 * @param req - The request object containing user data for getting a single user.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles getting a single user by their ID and fetching all jobs posted by that user.
 * * @returns - A JSON response containing the user data and their jobs.
 * * @throws - If an error occurs during the process, it sends a 500 status code with an error message.
 */
export const getSingleUser = catchAsync(async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user details excluding password
    const user = await User.findById(userId).select("-password");

    // Get all jobs posted by the user
    const userJobs = await Job.find({ postedBy: userId, visibility: "public" })
      .populate("postedBy", "-password -documents -isVerified")
      .populate("assignedTo", "-password -documents -isVerified ");

    res.status(200).json({ user, userJobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user and their jobs" });
  }
});

/**
 * @function getSingleUserProvider
 * @param req - The request object containing user data for getting a single job provider.
 * * @param res - The response object to send the response back to the client.
 * * @description - This function handles getting a single job provider by their ID and fetching all jobs posted by that user.
 * * @returns - A JSON response containing the user data and their jobs.
 * * @throws - If an error occurs during the process, it sends a 500 status code with an error message.
 */
export const getSingleUserProvider = catchAsync(async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user details excluding password
    const user = await User.findById(userId).select("-password -security_answer -documents");

    // Get only public jobs posted by the user
    const userJobs = await Job.find({
      postedBy: userId,
      visibility: "public"
    })

    res.status(200).json({ user, userJobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user and their jobs" });
  }
});

// get all users who are job seekers
// export const getAllJobSeekers = catchAsync(async (req, res, next) => {
//   try {
//     const searchQuery = req.query.search;
//     let query = { role: "job_seeker" };

//     if (searchQuery) {
//       query.$or = [
//         { username: { $regex: searchQuery, $options: "i" } },
//         { email: { $regex: searchQuery, $options: "i" } },
//       ];
//     }

//     const users = await User.find(query).select("-password -documents");

//     if (users.length === 0) {
//       return res.status(200).json({ message: "No users found" });
//     }

//     res.status(200).json({ users });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to get job seekers" });
//   }
// });

/**
 * @function getAllJobSeekers
 * @param req - The request object containing user data for getting all job seekers.
 * * @param res - The response object to send the response back to the client.
 * @description - This function handles getting all job seekers by validating the input data, checking for existing users, and returning the user data.
 * * @returns - A JSON response containing the user data and their jobs.
 * * @throws - If an error occurs during the process, it sends a 500 status code with an error message.
 */
export const getAllJobSeekers = catchAsync(async (req, res) => {
  try {
    const searchQuery = req.query.search;
    let query = { role: "job_seeker" };

    if (searchQuery) {
      query.$or = [
        { username: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ];
    }

    let users;

    if (!searchQuery) {
      // If no search query, sort users by popularity
      const allUsers = await User.find(query).select("-password -documents");

      // Calculate popularity based on average ratings
      for (const user of allUsers) {
        const reviews = await Review.find({ reviewedTo: user._id });
        const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
        user.avgRating = totalRating / (reviews.length || 1); // Store average rating directly in the user document
      }

      users = allUsers.sort((a, b) => b.avgRating - a.avgRating);
    } else {
      // If search query is provided, simply find users based on query
      users = await User.find(query).select("-password -documents");
    }

    if (users.length === 0) {
      return res.status(200).json({ message: "No users found" });
    }

    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get job seekers" });
  }
});

/**
 * @function nearByJobSeekers
 * @param req - The request object containing user data for getting nearby job seekers.
 * * @param res - The response object to send the response back to the client.
 * * @description - This function handles getting nearby job seekers by validating the input data, checking for existing users, and returning the user data.
 * * @returns - A JSON response containing the nearby job seekers.
 * * @throws - If an error occurs during the process, it sends a 500 status code with an error message.
 */
export const nearByJobSeekers = catchAsync(async (req, res) => {
  try {
    const { latitude, longitude } = req.params;

    const nearBy = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "dist.calculated",
          maxDistance: parseFloat(10000),
          spherical: true,
        },
      },
      {
        $match: {
          role: "job_seeker",
        },
      },
    ]).project("-password -documents");

    res.status(200).json({ nearBy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get nearby jobseekers" });
  }
});

/**
 * @function searchUser
 * @param req - The request object containing user data for searching users.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles searching for users by their username and returning the matching user data.
 * @returns - A JSON response containing the user data which matches the search query.
 * @throws - If an error occurs during the process, it sends a 500 status code with an error message.
 */
export const searchUser = catchAsync(async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.find({
      username: { $regex: new RegExp(`^${username}$`, "i") },
      role: "job_seeker",
    }).select("-password -documents -security_answer");

    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to search user" });
  }
});

/**
 * @function countAll
 * @param req - The request object containing user data for counting all jobs posted by a job provider.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles counting all jobs posted by a job provider by validating the input data, checking for existing users, and returning the count of jobs.
 * @returns - A JSON response containing the total number of jobs posted by the job provider and the number of jobs in progress.
 * @throws - If an error occurs during the process, it sends a 500 status code with an error message.
 */
export const countAll = catchAsync(async (req, res) => {
  try {
    const { jobProviderId } = req.params;
    const jobProvider = await User.findById(jobProviderId);
    if (!jobProvider) {
      return res.status(404).json({ message: "Job provider not found" });
    }
    const totalJobsbyProvider = await Job.countDocuments({
      postedBy: jobProviderId,
    });
    const InprogressJobs = await Job.countDocuments({
      postedBy: jobProviderId,
      job_status: "In_Progress",
    });

    res.status(200).json({ totalJobsbyProvider, InprogressJobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to count all" });
  }
});

/**
 * @function saveJob
 * @param req - The request object containing user data for saving a job.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles saving a job by validating the input data, checking for existing users, and updating the user's saved jobs.
 * @returns - A JSON response indicating the success or failure of the save process.
 * @throws - If an error occurs during the process, it sends a 422 status code with an error message.
 */
export const saveJob = catchAsync(async (req, res) => {
  try {
    const postId = req.params.id;
    const myId = req.user._id;

    const currentUser = await User.findById(myId).select(
      "-password -isVerified -email"
    );

    if (currentUser.savedPostJob.includes(postId)) {
      res.status(422).json({ message: "This post is already saved" });
    }

    const postStatus = await Job.findById(postId);
    if (postStatus.visibility === "private") {
      res.status(422).json({ message: "This post is private" });
    }

    if (!currentUser.savedPostJob.includes(postId)) {
      const response = await User.findByIdAndUpdate(
        myId,
        { $addToSet: { savedPostJob: postId } },
        { new: true }
      ).select("-password -isVerified -email");
      res.status(200).json({ message: "Job successfully saved! " });
    }
  } catch (err) {
    res.status(422).json({ message: err.message });
  }
});

/**
 * @function unsaveJob
 * @param req - The request object containing user data for unsaving a job.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles unsaving a job by validating the input data, checking for existing users, and updating the user's saved jobs.
 * @returns - A JSON response indicating the success or failure of the unsave process.
 * @throws - If an error occurs during the process, it sends a 422 status code with an error message.
 */
export const unsaveJob = catchAsync(async (req, res) => {
  try {
    const postId = req.params.id;
    const myId = req.user._id;

    const currentUser = await User.findById(myId).select(
      "-password -isVerified -email"
    );

    if (!currentUser.savedPostJob.includes(postId)) {
      res.status(422).json({ message: "This post is not saved" });
    } else {
      const response = await User.findByIdAndUpdate(
        myId,
        { $pull: { savedPostJob: postId } },
        { new: true }
      ).select("-password -isVerified -email");
      res.status(200).json({ message: "Job removed from saved list" });
    }
  } catch (err) {
    res.status(422).json({ message: err.message });
  }
});

/**
 * @function getSavedJobs
 * @param req - The request object containing user data for getting saved jobs.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles getting saved jobs by validating the input data, checking for existing users, and returning the user's saved jobs.
 * @returns - A JSON response containing the user's saved jobs.
 * @throws - If an error occurs during the process, it sends a 422 status code with an error message.
 */
export const getSavedJobs = catchAsync(async (req, res) => {
  try {
    const myId = req.user._id;
    const currentUser = await User.findById(myId)
      .populate({
        path: "savedPostJob",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "postedBy",
          model: "User",
        },
      })
      .exec();

    const visibleSavedJobs = currentUser.savedPostJob.filter(
      (job) => job.visibility === "public"
    );

    res.status(200).json({ savedPosts: visibleSavedJobs });
  } catch (err) {
    res.status(422).json({ message: err.message });
  }
});

/**
 * @function getTopRatedJobProviders
 * @param req - The request object containing user data for getting top-rated job providers.
 * @param res - The response object to send the response back to the client.
 * @description - This function handles getting top-rated job providers by validating the input data, checking for existing users, and returning the top-rated job providers.
 * @returns - A JSON response containing the top-rated job providers.
 * @throws - If an error occurs during the process, it sends a 422 status code with an error message.
 */
export const getTopRatedJobProviders = catchAsync(async (req, res) => {
  try {
    const topRatedJobProviders = await User.aggregate([
      {
        $match: {
          role: "job_provider",
          isDocumentVerified: "verified",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "reviewedTo",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: {
            $avg: "$reviews.rating",
          },
        },
      },
      {
        $sort: {
          averageRating: -1,
        },
      },
      {
        $project: {
          password: 0,
          fcm_token: 0,
          security_answer: 0,
        },
      },
    ]);

    res.status(200).json(topRatedJobProviders);
  } catch (err) {
    res.status(422).json({ message: err.message });
  }
});

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

//create user --> signup
export const createUser = catchAsync(async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      role,
      gender,
      fcm_token,  
      security_answer,
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

// verify OTP
export const verifyUser = catchAsync(async (req, res, next) => {
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

// resend OTP
export const resendOTP = catchAsync(async (req, res, next) => {
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

// login user --> login
export const LoginUser = catchAsync(async (req, res, next) => {
  const { email, password, fcm_token } = req.body;
  console.log(req.body);
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
        jwt.sign(
          { userId: findEmail._id },
          process.env.SECRET_KEY,
          { expiresIn: 86400 },
          (err, token) => {
            if (err) {
              return res.status(404).json({ message: "You must login first" });
            }
            findEmail.fcm_token = fcm_token;
            findEmail.save();
            const userWithoutPassword = {
              ...findEmail._doc,
              password: undefined,
            };
            res.status(200).json({
              status: "success",
              message: "Successfully, logged in",
              token,
              user: userWithoutPassword,
            });
          }
        );
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

//forget password
export const forgetPassword = catchAsync(async (req, res, next) => {
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

//logout user
export const logoutUser = catchAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.fcm_token = "";
    user.onlineStatus = false;
    await user.save();
    res.status(200).json({ message: "Successfully, logged out" });
  } catch (err) {
    res.status(500).json({ message: "Failed to logout" });
  }
});

//edit profile
export const editProfile = catchAsync(async (req, res, next) => {
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

//update profile picture
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

// update phone number
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
    user.phoneNumber = phone;
    await user.save();
    res.status(200).send({
      success: true,
      message: "Phone number updated",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error In update phone number API",
      error,
    });
  }
};

// upload document
export const uploadDocuments = catchAsync(async (req, res, next) => {
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

//get single user --> job seeker
export const getSingleUser = catchAsync(async (req, res, next) => {
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

// get single user --> job provider
export const getSingleUserProvider = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Get user details excluding password
    const user = await User.findById(userId).select("-password");

    // Get all jobs posted by the user
    const userJobs = await Job.find({ postedBy: userId })
      .populate("postedBy", "-password -documents -isVerified")
      .populate("assignedTo", "-password -documents -isVerified ");

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
export const getAllJobSeekers = catchAsync(async (req, res, next) => {
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

// get all nearby users who are job seekers
export const nearByJobSeekers = catchAsync(async (req, res, next) => {
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

//search user by username and who role is job_seeker
export const searchUser = catchAsync(async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.find({
      username: { $regex: new RegExp(`^${username}$`, "i") },
      role: "job_seeker",
    }).select("-password -documents");

    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to search user" });
  }
});

// count jobs posted by job providers
export const countAll = catchAsync(async (req, res, next) => {
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

//save and unsave post job
export const saveJob = catchAsync(async (req, res, next) => {
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

//unsaved post
export const unsaveJob = catchAsync(async (req, res, next) => {
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

//get all saved jobs
export const getSavedJobs = catchAsync(async (req, res, next) => {
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
        },
      },
    ]);

    res.status(200).json(topRatedJobProviders);
  } catch (err) {
    res.status(422).json({ message: err.message });
  }
});

import User from "../../../../models/User.js";
import Payment from "../../../../models/Payment.js";
import catchAsync from "../../../utils/catchAsync.js";
import Job from "../../../../models/Job.js";
import Gig from "../../../../models/Gig.js";
import Report from "../../../../models/Reports.js";
import { emitAccountDeactivation } from "../../../../socketHandler.js";
import { sendEmail } from "../helper/SendEmail.js";
import firebase from "../../../firebase/index.js";
import { StatusCodes } from "http-status-codes";
import logger from "../../../utils/logger.js";
import { sendPaymentTransparencyAppreciationEmail, sendPaymentVerificationSuccessEmail } from "../helper/SendEmailPaymentAdmin.js";

//count all freelancers, job, gigs, and job_providers
export const countAll = catchAsync(async (req, res) => {
  const freelancers = await User.countDocuments({ role: "job_seeker" });
  const jobProviders = await User.countDocuments({ role: "job_provider" });
  const job = await Job.countDocuments();
  const gigs = await Gig.countDocuments();

  logger.info('Admin retrieved count statistics', {
    adminId: req.user._id,
    freelancers,
    jobProviders,
    job,
    gigs,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({ freelancers, jobProviders, job, gigs });
});

//get all freelancers
export const getAllFreelancers = catchAsync(async (req, res) => {
  const { verified_status, assending } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  let query = {
    role: "job_seeker",
  };

  if (verified_status) {
    query.isDocumentVerified = verified_status;
  } else {
    // If verified_status is not provided, remove the isDocumentVerified filter
    delete query.isDocumentVerified;
  }

  let sort = {};

  if (assending === "true") {
    sort.createdAt = -1;
  } else {
    sort.createdAt = 1;
  }

  const startIndex = (page - 1) * limit;

  const users = await User.find(query).sort(sort).skip(startIndex).limit(limit);

  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limit);

  logger.info('Admin retrieved freelancers', {
    adminId: req.user._id,
    page,
    totalUsers,
    verified_status,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({
    users,
    currentPage: page,
    totalPages,
    totalUsers,
  });
});

//get all job providers
export const getAllJobProviders = catchAsync(async (req, res) => {
  const { verified_status, assending } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  let query = {
    role: "job_provider",
  };

  if (verified_status) {
    query.isDocumentVerified = verified_status;
  } else {
    // If verified_status is not provided, remove the isDocumentVerified filter
    delete query.isDocumentVerified;
  }

  let sort = {};

  if (assending === "true") {
    sort.createdAt = -1;
  } else {
    sort.createdAt = 1;
  }

  const startIndex = (page - 1) * limit;

  const users = await User.find(query).sort(sort).skip(startIndex).limit(limit);

  const totalUsers = await User.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limit);

  logger.info('Admin retrieved job providers', {
    adminId: req.user._id,
    page,
    totalUsers,
    verified_status,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({
    users,
    currentPage: page,
    totalPages,
    totalUsers,
  });
});

//get all payments
export const getAllPayments = catchAsync(async (req, res) => {
  const { pending_status, assending } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  let query = {};
  if (pending_status) {
    query.paymentStatus = pending_status;
  } else {
    delete query.paymentStatus;
  }
  let sort = {};
  if (assending === "true") {
    sort.createdAt = -1;
  } else {
    sort.createdAt = 1;
  }
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const payments = await Payment.find(query)
    .populate("PaymentBy")
    .populate("PaymentTo")
    .populate({
      path: "job",
      populate: {
        path: "postedBy",
      },
    })
    .populate({
      path: "job",
      populate: {
        path: "assignedTo",
      },
    })
    .sort({ createdAt: -1 })
    .skip(startIndex);

  const totalPayments = await Payment.countDocuments(query);
  const totalPages = Math.ceil(totalPayments / limit);
  logger.info('Admin retrieved payments', {
    adminId: req.user._id,
    page,
    totalPayments,
    pending_status,
    requestId: req.requestId
  });
  res.json({ payments, currentPage: page, totalPages, totalPayments });
});

//get all jobs
export const getAllJobs = catchAsync(async (req, res) => {
  const { status, assending } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  let query = {};
  if (status) {
    query.job_status = status;
  } else {
    delete query.job_status;
  }
  let sort = {};
  if (assending === "true") {
    sort.createdAt = -1;
  } else {
    sort.createdAt = 1;
  }
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const jobs = await Job.find(query)
    .populate("assignedTo")
    .populate("postedBy")
    .sort(sort)
    .skip(startIndex);
  const totalJobs = await Job.countDocuments(query);
  const totalPages = Math.ceil(totalJobs / limit);
  logger.info('Admin retrieved jobs', {
    adminId: req.user._id,
    page,
    totalJobs,
    status,
    requestId: req.requestId
  });
  res.json({ jobs, currentPage: page, totalPages, totalJobs });
});

//get all gigs
export const getAllGigs = catchAsync(async (req, res) => {
  const { assending } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  let query = {};

  let sort = {};
  if (assending === "true") {
    sort.createdAt = -1;
  } else {
    sort.createdAt = 1;
  }
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const gigs = await Gig.find(query)
    .populate("postedBy")
    .sort(sort)
    .skip(startIndex);
  const totalGigs = await Gig.countDocuments(query);
  const totalPages = Math.ceil(totalGigs / limit);
  logger.info('Admin retrieved gigs', {
    adminId: req.user._id,
    page,
    totalGigs,
    requestId: req.requestId
  });
  res.json({ gigs, currentPage: page, totalPages, totalGigs });
});

//completed payment
export const completedPayment = catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  const { freelancerId, jobProviderId, amount, jobId } = req.body;
  const freelancer = await User.findById(freelancerId);
  const jobProvider = await User.findById(jobProviderId);
  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Job not found" });
  }

  if (!freelancer || !jobProvider) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found" });
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Payment not found" });
  }

  freelancer.totalIncome += amount;
  freelancer.totalCompletedJobs += 1;
  freelancer.can_review.push({ user: jobProviderId });
  await freelancer.save();

  payment.paymentStatus = "Completed";
  await payment.save();

  jobProvider.totalAmountPaid += amount;
  if ((jobProvider.totalCompletedJobs + 1) % 5 === 0) {
    jobProvider.mileStone += 1;
    jobProvider.totalCompletedJobs += 1;
  } else {
    jobProvider.totalCompletedJobs += 1;
  }
  jobProvider.can_review.push({ user: freelancerId });
  await jobProvider.save();

  job.job_status = "can_delete";
  await job.save();

  try {
  if (freelancer.email) {
    await sendPaymentVerificationSuccessEmail({
      email: freelancer.email,
      job_seeker_name: freelancer.username || "Freelancer",
      job_name: job.title,
      job_provider_name: jobProvider.username || "Job Provider",
      amount: amount,
    }, res, req);
  }

  // Email to Job Provider
  if (jobProvider.email) {
    await sendPaymentTransparencyAppreciationEmail({
      email: jobProvider.email,
      job_provider_name: jobProvider.username || "Job Provider",
      job_seeker_name: freelancer.username || "Freelancer",
      job_name: job.title,
      amount: amount,
      milestone_achieved: jobProvider.mileStone 
    }, res, req);
  }
} catch (emailError) {
  logger.error('Failed to send payment completion emails', {
    error: emailError.message,
    paymentId,
    requestId: req.requestId
  });
}

  logger.info('Payment completed successfully', {
    adminId: req.user._id,
    paymentId,
    freelancerId,
    jobProviderId,
    amount,
    jobId,
    requestId: req.requestId
  });

  res.status(200).json({ message: "Payment completed successfully" });
});

//verfiy document
export const verifyDocument = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "User not found!" });
  }

  try {
    await sendEmail({ email: user.email }, res, req);
    user.isDocumentVerified = "verified";
    await user.save();

    logger.info('User verified successfully', {
      adminId: req.user._id,
      userId,
      email: user.email,
      requestId: req.requestId
    });

    res.status(200).json({ message: "User Successfully verified" });
  } catch (error) {
    logger.error('Email sending failed', {
      error: error.message,
      userId,
      requestId: req.requestId
    });
    return res.status(500).json({ message: "Failed to send verification email" });
  }

});

//reject document
export const rejectDocument = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(200).json({ message: "User not found!" });
  }

  user.isDocumentVerified = "is_not_verified";
  user.documents = [];
  await user.save();

  logger.info('User document rejected successfully', {
    adminId: req.user._id,
    userId,
    email: user.email,
    requestId: req.requestId
  });

  res.status(200).json({ message: "User document rejected" });
});

//get all reports
export const getAllReports = catchAsync(async (req, res) => {
  const { assending } = req.query;
  let sort = {};
  if (assending === "true") {
    sort.createdAt = -1;
  } else {
    sort.createdAt = 1;
  }

  const reports = await Report.find()
    .populate("reportedBy")
    .populate("reportedTo")
    .sort(sort);

  logger.info('Admin retrieved reports', {
    adminId: req.user._id,
    reports: reports.length,
    requestId: req.requestId
  });

  res.status(200).json({ reports });
});

//deactivate user
export const deactivateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(200).json({ message: "User not found!" });
  }

  user.userAccountStatus = "Deactivated";
  user.onlineStatus = false;

  await Job.updateMany(
    { postedBy: userId },
    { $set: { visibility: "private" } }
  );
  await Gig.updateMany(
    { postedBy: userId },
    { $set: { visibility: "private" } }
  );

  emitAccountDeactivation(req.app.get("io"), userId.toString(), {
    message: "Your account has been deactivated by the admin.",
  });

  await user.save();

  logger.info('User deactivated successfully', {
    adminId: req.user._id,
    userId,
    email: user.email,
    requestId: req.requestId
  });

  res.status(200).json({ message: "User Successfully deactivated" });
});

//activate user
export const activateUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(200).json({ message: "User not found!" });
  }

  user.userAccountStatus = "Active";

  await Job.updateMany(
    { postedBy: userId },
    { $set: { visibility: "public" } }
  );
  await Gig.updateMany(
    { postedBy: userId },
    { $set: { visibility: "public" } }
  );

  await user.save();

  logger.info('User activated successfully', {
    adminId: req.user._id,
    userId,
    email: user.email,
    requestId: req.requestId
  });

  res.status(200).json({ message: "User Successfully activated" });
});

//get all the deactivate accounts
export const getAllDeactivatedAccounts = catchAsync(async (req, res) => {
  const users = await User.find({ userAccountStatus: "Deactivated" });

  logger.info('Admin retrieved deactivated accounts', {
    adminId: req.user._id,
    users: users.length,
    requestId: req.requestId
  });

  res.status(200).json({ users });
});

//user growth
export const getUserGrowth = catchAsync(async (req, res) => {
  const userGrowthData = await User.aggregate([
    {
      $match: {
        createdAt: { $ne: null },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$createdAt",
          },
        },
        uv: { $sum: 1 },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const response = userGrowthData.map((item) => ({
    name: item._id,
    uv: item.uv,
    pv: 0,
    amt: 0,
  }));

  logger.info('Admin retrieved user growth', {
    adminId: req.user._id,
    userGrowthData: response,
    requestId: req.requestId
  });

  res.status(200).json({ userGrowthData: response });
});

//send push notification to all users
export const sendPushNotification = catchAsync(async (req, res) => {
  try {
    const { message } = req.body;
    const users = await User.find();

    const sendPushNotification = async (user) => {
      try {
        await firebase.messaging().send({
          token: user.fcm_token,
          notification: {
            title: "Message from NepalKamma🎈",
            body: message,
          },
        });
        logger.info("Notification sent successfully to user:", user._id);
      } catch (err) {
        logger.error(err);
        if (err.code === "messaging/registration-token-not-registered") {
          // Remove the unregistered token from the user
          user.fcm_token = null;
          await user.save();
        }
      }
    };

    users.forEach((user) => {
      if (user.fcm_token) {
        sendPushNotification(user);
      }
    });
    res.status(200).json({ message: "Push notification sent successfully" });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Failed to send push notification" });
  }
});


export const getNewUsers = catchAsync(async (req, res) => {
  try {
    const roles = ["job_seeker", "job_provider", "admin"];
    const currentDate = new Date();
    const monthsRange = [];

    // Generate past 5 months including the current month
    for (let i = 0; i < 5; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.toISOString().slice(0, 7); // Format YYYY-MM
      monthsRange.push(month);
    }

    const users = await User.aggregate([
      {
        // Filter to only include users registered in the last 5 months
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 4))
          }
        }
      },
      {
        // Create year-month format for grouping
        $addFields: {
          yearMonth: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt"
            }
          }
        }
      },
      {
        // Group by year-month and role
        $group: {
          _id: {
            month: "$yearMonth",
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      {
        // Sort by year-month
        $sort: {
          "_id.month": 1
        }
      },
      {
        // Format the output
        $project: {
          _id: 0,
          month: "$_id.month",
          role: "$_id.role",
          count: 1
        }
      }
    ]).exec();

    // Initialize a result map to hold counts for each role and month
    const resultMap = {};
    monthsRange.forEach(month => {
      resultMap[month] = {};
      roles.forEach(role => {
        resultMap[month][role] = 0; // Initialize count to 0
      });
    });

    // Populate resultMap with actual data
    users.forEach(result => {
      if (resultMap[result.month]) {
        resultMap[result.month][result.role] = result.count;
      }
    });

    // Convert resultMap to desired output format
    const finalResults = [];
    Object.keys(resultMap).forEach(month => {
      roles.forEach(role => {
        finalResults.push({
          month: month,
          role: role,
          count: resultMap[month][role]
        });
      });
    });

    return res.status(200).json({ users: finalResults });

  } catch (err) {
    res.status(500).json({ message: "Failed to get new users" });
  }
});

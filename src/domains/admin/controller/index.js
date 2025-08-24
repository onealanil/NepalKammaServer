import User from "../../../../models/User.js";
import Payment from "../../../../models/Payment.js";
import catchAsync from "../../../utils/catchAsync.js";
import Job from "../../../../models/Job.js";
import Gig from "../../../../models/Gig.js";
import Report from "../../../../models/Reports.js";
import { emitAccountDeactivation } from "../../../../socketHandler.js";
import { sendEmail } from "../helper/SendEmail.js";
import firebase from "../../../firebase/index.js";

//count all freelancers, job, gigs, and job_providers
export const countAll = catchAsync(async (req, res, next) => {
  try {
    const freelancers = await User.countDocuments({ role: "job_seeker" });
    const jobProviders = await User.countDocuments({ role: "job_provider" });
    const job = await Job.countDocuments();
    const gigs = await Gig.countDocuments();
    res.status(200).json({ freelancers, jobProviders, job, gigs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to count all" });
  }
});

//get all freelancers
export const getAllFreelancers = catchAsync(async (req, res, next) => {
  try {
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
    const endIndex = page * limit;

    const users = await User.find(query).sort(sort).skip(startIndex);

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      currentPage: page,
      totalPages,
      totalUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get all freelancers" });
  }
});

//get all job providers
export const getAllJobProviders = catchAsync(async (req, res, next) => {
  try {
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
    const endIndex = page * limit;

    const users = await User.find(query).sort(sort).skip(startIndex);

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      currentPage: page,
      totalPages,
      totalUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get all job provider" });
  }
});

//get all payments
export const getAllPayments = catchAsync(async (req, res, next) => {
  try {
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
    res.json({ payments, currentPage: page, totalPages, totalPayments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get all payments" });
  }
});

//get all jobs
export const getAllJobs = catchAsync(async (req, res, next) => {
  try {
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
    res.json({ jobs, currentPage: page, totalPages, totalJobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get all jobs" });
  }
});

//get all gigs
export const getAllGigs = catchAsync(async (req, res, next) => {
  try {
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
    res.json({ gigs, currentPage: page, totalPages, totalGigs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get all gigs" });
  }
});

//completed payment
export const completedPayment = catchAsync(async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { freelancerId, jobProviderId, amount } = req.body;
    const freelancer = await User.findById(freelancerId);
    const jobProvider = await User.findById(jobProviderId);

    if (!freelancer || !jobProvider) {
      return res.status(404).json({ message: "User not found" });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    freelancer.totalIncome += amount;
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

    res.status(200).json({ message: "Payment completed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to complete payment" });
  }
});

//verfiy document
export const verifyDocument = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.status(200).json({ message: "User not found!" });
    }

    sendEmail(user.email);

    user.isDocumentVerified = "verified";
    await user.save();

    res.status(200).json({ message: "User Successfully verified" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failded to verfified the user" });
  }
});

//reject document
export const rejectDocument = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      res.status(200).json({ message: "User not found!" });
    }

    user.isDocumentVerified = "is_not_verified";
    user.documents = [];
    await user.save();

    res.status(200).json({ message: "User document rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failded to reject the user document" });
  }
});

//get all reports
export const getAllReports = catchAsync(async (req, res, next) => {
  try {
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

    res.status(200).json({ reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get all reports" });
  }
});

//deactivate user
export const deactivateUser = catchAsync(async (req, res, next) => {
  try {
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

    res.status(200).json({ message: "User Successfully deactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failded to deactivate the user" });
  }
});

//activate user
export const activateUser = catchAsync(async (req, res, next) => {
  try {
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

    res.status(200).json({ message: "User Successfully activated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failded to activate the user" });
  }
});

//get all the deactivate accounts
export const getAllDeactivatedAccounts = catchAsync(async (req, res, next) => {
  try {
    const users = await User.find({ userAccountStatus: "Deactivated" });

    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get all deactivated accounts" });
  }
});

//user growth
export const getUserGrowth = catchAsync(async (req, res, next) => {
  try {
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

    res.status(200).json({ userGrowthData: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user growth" });
  }
});

//send push notification to all users
export const sendPushNotification = catchAsync(async (req, res, next) => {
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
        console.log("Notification sent successfully to user:", user._id);
      } catch (err) {
        console.error(err);
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
    console.error(err);
    res.status(500).json({ message: "Failed to send push notification" });
  }
});


export const getNewUsers = catchAsync(async (req, res, next) => {
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
    console.log(err);
    res.status(500).json({ message: "Failed to get new users" });
  }
});

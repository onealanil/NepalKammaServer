import Review from "../../../../models/Review.js";
import User from "../../../../models/User.js";
import { emitNotification } from "../../../../socketHandler.js";
import catchAsync from "../../../utils/catchAsync.js";
import firebase from "../../../firebase/index.js";

//create payment
export const createReview = catchAsync(async (req, res, next) => {
  try {
    const { reviewedBy, reviewedTo, review, rating } = req.body;
    const getReview = await Review.create({
      reviewedBy,
      reviewedTo,
      review,
      rating,
    });

    const reviewedByUser = await User.findById(reviewedBy);
    const reviewedToUser = await User.findById(reviewedTo);
    // Check if the user was found and has a profile picture
    if (!reviewedByUser || !reviewedByUser.profilePic.url) {
      return res(400).json({ message: "Something went wrong" });
    }
    if (!reviewedToUser) {
      return res(400).json({ message: "Something went wrong" });
    }

    emitNotification(req.io, getReview.reviewedTo.toString(), {
      senderId: reviewedBy,
      recipientId: reviewedTo,
      notification: review,
      profilePic: reviewedByUser.profilePic.url,
      senderUsername: reviewedByUser.username,
      type: "review",
    });

    const sendNotification = async () => {
      try {
        await firebase.messaging().send({
          token: reviewedToUser?.fcm_token,
          notification: {
            title: "Someone reviwed you 🎆😍",
            body: review,
          },
        });
      } catch (err) {
        console.error(err);
      }
    };

    if(reviewedToUser.fcm_token){
      await sendNotification();
    }

    res.status(200).json(getReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create  review" });
  }
});

//get review by job provider id
export const getReviewByProvider = catchAsync(async (req, res, next) => {
  try {
    const reviews = await Review.find({
      reviewedTo: req.params.id,
    })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "-password")
      .populate("reviewedTo", "-password");
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get reviews" });
  }
});

//average the rating
export const getAverageRating = catchAsync(async (req, res, next) => {
  try {
    const reviews = await Review.find({
      reviewedTo: req.params.id,
    });
    const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
    const avgRating = totalRating / reviews.length;
    res.status(200).json(avgRating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get average rating" });
  }
});

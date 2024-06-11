import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ReviewInfoSchema = new mongoose.Schema(
  {
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    review: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model("Review", ReviewInfoSchema);
export default Review;

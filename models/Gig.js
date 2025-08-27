import mongoose from "mongoose";
const Schema = mongoose.Schema;

const GigInfoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    gig_description: {
      type: String,
      default: "",
    },
    images: [
      {
        public_id: {
          type: String,
          default: "",
        },
        url: {
          type: String,
          default: "",
        },
      },
    ],
    price: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: "",
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * indexes for gigs
 */
GigInfoSchema.index({title: "text", gig_description: "text"});

GigInfoSchema.index({postedBy: 1, createdAt: -1}, {background: true});

const Gig = mongoose.model("Gig", GigInfoSchema);

export default Gig;

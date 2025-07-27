import mongoose from "mongoose";
const Schema = mongoose.Schema;

const UserInfoSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      index: {
        unique: true,
      },
    },
    email: {
      type: String,
      required: true,
      index: {
        unique: true,
      },
    },
    password: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    about_me: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      public_id: {
        type: String,
        default:
          "https://asset.cloudinary.com/dcnm2ql9y/9cfe2e5781a9c7827b051a34670450e0",
      },
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dcnm2ql9y/image/upload/v1709398361/vectorstock_42797457_rzmscx.png",
      },
    },
    isTick: {
      type: Boolean,
      default: false,
    },
    address: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        default: [0, 0],
      },
    },
    location: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      required: true,
    },
    skills: [
      {
        type: String,
        default: "",
      },
    ],
    role: {
      type: String,
      enum: ["job_provider", "job_seeker", "admin"],
    },
    isVerified: {
      type: Boolean,
    },
    fcm_token: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    isDocumentVerified: {
      type: String,
      enum: ["Pending", "verified", "is_not_verified"],
      default: "is_not_verified",
    },
    mileStone: {
      type: Number,
      default: 0,
    },
    totalAmountPaid: {
      type: Number,
      default: 0,
    },
    totalCompletedJobs: {
      type: Number,
      default: 0,
    },
    totalIncome: {
      type: Number,
      default: 0,
    },
    onlineStatus: {
      type: Boolean,
      default: false,
    },
    security_answer: {
      type: String,
      default: "",
    },
    savedPostJob: [{ type: Schema.Types.ObjectId, ref: "Job" }],
    savedPostGig: [{ type: Schema.Types.ObjectId, ref: "Gig" }],
    userAccountStatus: {
      type: String,
      enum: ["Active", "Deactivated"],
      default: "Active",
    },
    can_review: [
      {
        user: {
          type: String,
          default: "",
        },
      },
    ],
    documents: [
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
  },
  {
    timestamps: true,
  }
);

UserInfoSchema.index({ "address.coordinates": "2dsphere" });

const User = mongoose.model("User", UserInfoSchema);

export default User;

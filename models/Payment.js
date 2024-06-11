import mongoose from "mongoose";
const Schema = mongoose.Schema;

const PaymentInfoSchema = new mongoose.Schema(
  {
    PaymentBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    PaymentTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    recieverNumber:{
      type: String,
      default: ""
    },
    paymentType: {
      type: String,
      enum: ["cash", "online"],
      default: "cash",
    },
    confirmation_image: [
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
    paymentStatus: {
      type: String,
      enum: ["provider_paid", "request_payment", "Completed", "Cancelled"],
      default: "provider_paid",
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", PaymentInfoSchema);
export default Payment;

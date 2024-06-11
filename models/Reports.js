import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ReportInfoSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reportedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    report: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model("Report", ReportInfoSchema);
export default Report;

import Report from "../../../../models/Reports.js";
import catchAsync from "../../../utils/catchAsync.js";


export const createReport = catchAsync(async (req, res, next) => {
  try {
    const { reportedBy, reportedTo, report } = req.body;
    const reportData = await Report.create({
      reportedBy,
      reportedTo,
      report,
    });

    res.status(200).json({ reportData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create notifications" });
  }
});


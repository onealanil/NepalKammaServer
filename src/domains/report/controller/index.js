/**
 * @file Report/index.js
 * @description This file contains the controller for the report module and includes different functions to handle report-related operations.
 * @module ReportController
 * @requires express -- Express framework
 * @requires Report -- Report model
 * @requires catchAsync -- Utility function to handle async errors
 */
import Report from "../../../../models/Reports.js";
import catchAsync from "../../../utils/catchAsync.js";

/**
 * @function createReport
 * @description Creates a new report and sends a notification to the reported user.
 * @param {Object} req - The request object containing the report details.
 * @param {Object} res - The response object to send the result.
 * @returns - A JSON response with the created report or an error message.
 * @throws - Throws an error if the report creation fails or if the user is not found.
 */
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

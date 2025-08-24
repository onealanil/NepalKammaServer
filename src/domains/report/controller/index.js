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
import { StatusCodes } from "http-status-codes";
import logger from "../../../utils/logger.js";

/**
 * @function createReport
 * @description Creates a new report and sends a notification to the reported user.
 * @param {Object} req - The request object containing the report details.
 * @param {Object} res - The response object to send the result.
 * @returns - A JSON response with the created report or an error message.
 * @throws - Throws an error if the report creation fails or if the user is not found.
 */
export const createReport = catchAsync(async (req, res) => {
  const { reportedBy, reportedTo, report } = req.body;

  logger.info('Report creation request', {
    reportedBy,
    reportedTo,
    userId: req.user?._id,
    requestId: req.requestId
  });

  const reportData = await Report.create({
    reportedBy,
    reportedTo,
    report,
  });

  logger.info('Report created successfully', {
    reportId: reportData._id,
    reportedBy,
    reportedTo,
    requestId: req.requestId
  });

  res.status(StatusCodes.OK).json({ reportData });
});

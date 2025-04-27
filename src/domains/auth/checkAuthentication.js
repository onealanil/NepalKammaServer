/**
 * @file checkAuthentication.js
 * @description This file contains the checkAuthentication function.
 * It is used to check if the user is authenticated or not.
 */
import User from "../../../models/User.js";
import catchAsync from "../../utils/catchAsync.js";
import createError from "../../utils/createError.js";

/**
 * @function checkAuthentication
 * @description This function checks if the user is authenticated or not.
 * @param req - Request object
 * @param res - Response object
 *
 */
export const checkAuthentication = catchAsync(async (req, res) => {
  const user = await User.findById(req.user).select("-password");
  if (!user) throw createError(401, "User not found");

  console.log("hitted", req.user);

  // Check if user's account is active
  if (user.userAccountStatus !== "Active") {
    throw createError(
      401,
      "Your account is inactive. Please contact the admin."
    );
  }

  res.status(200).json({
    status: "success",
    user,
  });
});

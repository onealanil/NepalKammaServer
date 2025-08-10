/**
 * @file BackgroundTask.js
 * @description This file contains a cron job that runs every minute to update the visibility of jobs that have expired.
 * It sets the visibility of expired jobs to "private".
 */
import Job from "../../models/Job.js";
import cron from "node-cron";
import User from "../../models/User.js";

/**
 * s@function updateJobVisibility
 * @description A cron job that runs every minute to update the visibility of jobs that have expired.
 * It sets the visibility of expired jobs to "private".
 */
export async function updateJobVisibility() {
  try {
    cron.schedule("* * * * *", async () => {
      try {
        const now = new Date();
        const expiredJobs = await Job.find({
          visibility: "public",
          expiryDate: { $lt: now },
        }).select("_id");

        if (!expiredJobs.length) {
          console.log("No expired jobs found.");
          return;
        }

        const expiredJobIds = expiredJobs.map(job => job._id);

        const jobUpdateResult = await Job.updateMany(
          { _id: { $in: expiredJobIds } },
          { $set: { visibility: "private" } }
        );

        const userUpdateResult = await User.updateMany(
          { savedPosts: { $in: expiredJobIds } },
          { $pull: { savedPosts: { $in: expiredJobIds } } }
        );

        console.log(
          `Updated ${jobUpdateResult.modifiedCount} jobs and removed from ${userUpdateResult.modifiedCount} users' savedPosts.`
        );

      } catch (error) {
        console.error("Error in expired job cleanup cron:", error);
      }
  });
} catch (error) {
  console.error("Error updating job visibility:", error);
}
}

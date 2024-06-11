import Job from "../../models/Job.js";
import cron from "node-cron";

export async function updateJobVisibility() {
  try {
    cron.schedule("* * * * *", async () => {
      try {
        const now = new Date().getTime();
        const expiredJobs = await Job.find({
          experiesIn: { $lte: now },
          visibility: "public",
        });
        for (const job of expiredJobs) {
          job.visibility = "private";
          await job.save();
        }
        console.log(
          `${expiredJobs.length} expired jobs updated to private visibility.`
        );
      } catch (error) {
        console.error("Error updating job visibility:", error);
      }
    });
  } catch (error) {
    console.error("Error updating job visibility:", error);
  }
}

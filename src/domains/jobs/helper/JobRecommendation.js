import mongoose from "mongoose";
import natural from "natural";

const User = mongoose.model("User");
const Job = mongoose.model("Job");

const TfIdf = natural.TfIdf;
const stemmer = natural.PorterStemmer;

const recommendJobs = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const tfidf = new TfIdf();

    // title, skills, about_me
    const userDocument = [user.title, ...user.skills, user.about_me].map(
      (term) => stemmer.stem(term)
    );
    tfidf.addDocument(userDocument);

    const jobs = await Job.find();
    const jobDocs = jobs.map((job) => {
      const jobDocument = [...job.skills_required, job.job_description].map(
        (term) => stemmer.stem(term)
      );
      tfidf.addDocument(jobDocument);
      return { id: job._id.toString(), skills: job.skills_required };
    });

    // similarity score
    const jobsWithScore = jobDocs.map((jobDoc, index) => {
      let totalScore = 0;
      userDocument.forEach((term) => {
        const tfidfScore = tfidf.tfidf(term, index + 1);
        totalScore += tfidfScore;
      });
      return {
        id: jobDoc.id,
        skills: jobDoc.skills,
        similarityScore: totalScore,
      };
    });

    const sortedJobs = jobsWithScore.sort(
      (a, b) => b.similarityScore - a.similarityScore
    );

    const minimumSimilarityScore = 0.6;
    const filteredJobs = sortedJobs.filter(
      (job) => job.similarityScore >= minimumSimilarityScore
    );

    const recommendedJobs = filteredJobs.map((job) => {
      const { id, similarityScore } = job;
      const matchedJob = jobs.find((j) => j._id.toString() === id.toString());
      return { ...matchedJob.toObject(), similarityScore };
    });

    return recommendedJobs;
  } catch (err) {
    res.status(500).json({ message: "Failed to recommend jobs" });
    throw new Error("Error in recommendJobs function");
  }
};

export default recommendJobs;

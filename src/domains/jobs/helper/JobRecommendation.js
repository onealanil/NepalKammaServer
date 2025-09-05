import mongoose from "mongoose";
import natural from "natural";

const User = mongoose.model("User");
const Job = mongoose.model("Job");

const TfIdf = natural.TfIdf;
const stemmer = natural.PorterStemmer;

const skillRelations = {
  // Home Services
  "home_services": ["cleaning", "housekeeping", "house_cleaning", "domestic_services", "maid_service"],
  
  // Appliance Repair
  "appliance_repair": ["repair", "fixing", "maintenance", "troubleshooting", "appliance_fixing", "home_repair"],
  
  // Automotive
  "automotive": ["car_repair", "vehicle_maintenance", "auto_service", "mechanic", "car_service", "vehicle_repair"],
  
  // Business
  "business": ["consulting", "administration", "office_work", "management", "bookkeeping", "accounting"],
  
  // Childcare
  "childcare": ["babysitting", "nanny", "child_supervision", "daycare", "child_minding", "kids_care"],
  
  // Construction
  "construction": ["building", "carpentry", "masonry", "renovation", "contractor", "handyman"],
  
  // Computer Services
  "computer_services": ["it_support", "tech_support", "computer_repair", "software_help", "troubleshooting", "technical_assistance"],
  
  // Teaching
  "teaching": ["tutoring", "education", "instruction", "training", "academic_help", "mentoring", "lessons"],
  
  // Delivery
  "delivery": ["courier", "transport", "shipping", "logistics", "pickup_delivery", "messenger"],
  
  // Electrical
  "electrical": ["wiring", "electronics", "power_systems", "lighting", "electrical_repair", "electrician"],
  
  // Farming
  "farming": ["agriculture", "crop_care", "livestock", "agricultural_work", "farm_labor", "harvesting"],
  
  // Gardening
  "gardening": ["landscaping", "plant_care", "lawn_care", "horticulture", "garden_maintenance", "outdoor_work"],
  
  // General Labor
  "general_labor": ["manual_work", "physical_labor", "helper", "assistant", "moving", "loading"],
  
  // Maintenance
  "maintenance": ["upkeep", "servicing", "repair", "facility_maintenance", "property_maintenance", "janitorial"],
  
  // Pet Services
  "pet_services": ["dog_walking", "pet_sitting", "animal_care", "pet_grooming", "veterinary_assistant", "pet_care"],

  // Category mappings (for cross-category matching)
  "repairs": ["appliance_repair", "maintenance", "fixing", "troubleshooting", "repair_work"],
  "computer_it": ["computer_services", "it_support", "tech_support", "software", "hardware"],
  "education_training": ["teaching", "tutoring", "training", "instruction", "education"],
  "labor": ["general_labor", "manual_work", "physical_labor", "construction", "moving"],
  "gardening_farming": ["gardening", "farming", "landscaping", "agriculture", "outdoor_work"]
};

// Stop words to filter out
const stopWords = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
                   "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", 
                   "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", 
                   "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
                   "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", 
                   "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
                   "while", "of", "at", "by", "for", "with", "through", "during", "before", "after", 
                   "above", "below", "up", "down", "in", "out", "on", "off", "over", "under", "again", 
                   "further", "then", "once"];

/**
 * Enhanced text preprocessing function
 * @param {string|Array} text - Text to clean and process
 * @returns {Array} - Cleaned and stemmed words
 */
const preprocessText = (text) => {
  if (!text) return [];
  
  // Convert to string if it's an array
  const textString = Array.isArray(text) ? text.join(" ") : text.toString();
  
  return textString
    .toLowerCase()
    .replace(/[_-]/g, ' ')     // Convert underscores/hyphens to spaces
    .replace(/[^\w\s]/g, ' ')  // Remove special characters
    .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
    .trim()
    .split(' ')
    .filter(word => word.length > 2)  // Remove short words
    .filter(word => !stopWords.includes(word))  // Remove stop words
    .map(word => stemmer.stem(word));
};

/**
 * Check if two skills are related
 * @param {string} skill1 - First skill
 * @param {string} skill2 - Second skill
 * @returns {boolean} - True if skills are related
 */
const areRelatedSkills = (skill1, skill2) => {
  const s1 = skill1.toLowerCase().replace(/[_\s-]/g, '');
  const s2 = skill2.toLowerCase().replace(/[_\s-]/g, '');
  
  // Exact match
  if (s1 === s2) return true;
  
  // Substring match
  if (s1.includes(s2) || s2.includes(s1)) return true;
  
  // Check skill relations
  for (const [baseSkill, relatedSkills] of Object.entries(skillRelations)) {
    const baseSkillClean = baseSkill.replace(/[_\s-]/g, '');
    const relatedSkillsClean = relatedSkills.map(skill => skill.replace(/[_\s-]/g, ''));
    
    if ((s1 === baseSkillClean && relatedSkillsClean.includes(s2)) ||
        (s2 === baseSkillClean && relatedSkillsClean.includes(s1)) ||
        (relatedSkillsClean.includes(s1) && relatedSkillsClean.includes(s2))) {
      return true;
    }
  }
  
  return false;
};

/**
 * Calculate skill match score between user and job
 * @param {Array} userSkills - User's skills
 * @param {Array} jobSkills - Job's required skills
 * @returns {Object} - Skill match data
 */
const calculateSkillMatch = (userSkills, jobSkills) => {
  if (!userSkills || !jobSkills || userSkills.length === 0 || jobSkills.length === 0) {
    return { score: 0, matches: [], exactMatches: 0, relatedMatches: 0 };
  }
  
  const matches = [];
  let exactMatches = 0;
  let relatedMatches = 0;
  
  userSkills.forEach(userSkill => {
    jobSkills.forEach(jobSkill => {
      if (areRelatedSkills(userSkill, jobSkill)) {
        const isExact = userSkill.toLowerCase().replace(/[_\s-]/g, '') === 
                       jobSkill.toLowerCase().replace(/[_\s-]/g, '');
        
        if (isExact) {
          exactMatches++;
        } else {
          relatedMatches++;
        }
        
        matches.push({
          userSkill,
          jobSkill,
          type: isExact ? 'exact' : 'related'
        });
      }
    });
  });
  
  // Remove duplicates
  const uniqueMatches = matches.filter((match, index, self) => 
    index === self.findIndex(m => m.userSkill === match.userSkill && m.jobSkill === match.jobSkill)
  );
  
  // Calculate score: exact matches worth more than related matches
  const totalMatches = (exactMatches * 1.0) + (relatedMatches * 0.7);
  const score = totalMatches / Math.max(jobSkills.length, 1);
  
  return {
    score: Math.min(score, 1.0), // Cap at 1.0
    matches: uniqueMatches,
    exactMatches,
    relatedMatches
  };
};

/**
 * @param {string} userTitle - User's title/profession
 * @param {Array} userSkills - User's skills
 * @param {string} jobTitle - Job title
 * @param {string} jobCategory - Job category
 * @param {Array} jobSkills - Job required skills
 * @returns {number} - Category match score
 */
const calculateCategoryMatch = (userTitle, userSkills, jobTitle, jobCategory, jobSkills) => {
  if (!userTitle && (!userSkills || userSkills.length === 0)) return 0;
  
  const userTitleClean = (userTitle || '').toLowerCase();
  const jobTitleClean = (jobTitle || '').toLowerCase();
  const jobCategoryClean = (jobCategory || '').toLowerCase();
  
  // Direct title/category matching
  if (userTitleClean.includes(jobTitleClean) || jobTitleClean.includes(userTitleClean) ||
      userTitleClean.includes(jobCategoryClean) || jobCategoryClean.includes(userTitleClean)) {
    return 1.0;
  }
  
  // Check if user skills match job category
  const userSkillsClean = (userSkills || []).map(skill => skill.toLowerCase());
  if (userSkillsClean.includes(jobCategoryClean)) {
    return 0.9;
  }
  
  // Check for related category matching
  const categoryMappings = {
    'home_services': ['cleaning', 'housekeeping', 'domestic'],
    'repairs': ['appliance_repair', 'maintenance', 'fixing'],
    'computer_it': ['computer_services', 'tech', 'it'],
    'education_training': ['teaching', 'tutoring', 'education'],
    'gardening_farming': ['gardening', 'farming', 'landscaping']
  };
  
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (jobCategoryClean === category) {
      const hasRelatedSkill = userSkillsClean.some(skill => 
        keywords.some(keyword => skill.includes(keyword) || keyword.includes(skill))
      );
      if (hasRelatedSkill) return 0.7;
      
      const hasRelatedTitle = keywords.some(keyword => 
        userTitleClean.includes(keyword) || keyword.includes(userTitleClean)
      );
      if (hasRelatedTitle) return 0.6;
    }
  }
  
  return 0;
};

/**
 * Generate human-readable recommendation reason
 * @param {Object} jobData - Job data with scores
 * @returns {string} - Recommendation reason
 */
const generateRecommendationReason = (jobData) => {
  const reasons = [];
  
  if (jobData.exactSkillMatches > 0) {
    reasons.push(`${jobData.exactSkillMatches} exact skill match${jobData.exactSkillMatches > 1 ? 'es' : ''}`);
  }
  
  if (jobData.relatedSkillMatches > 0) {
    reasons.push(`${jobData.relatedSkillMatches} related skill${jobData.relatedSkillMatches > 1 ? 's' : ''}`);
  }
  
  if (jobData.categoryScore > 0.7) {
    reasons.push("title matches your profession");
  }
  
  if (jobData.tfidfScore > 0.3) {
    reasons.push("strong profile similarity");
  }
  
  if (reasons.length === 0) {
    reasons.push("matches your interests");
  }
  
  return reasons.join(", ");
};

const recommendJobs = async (userId) => {
  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error("User not found");
    }

    // Validate user has required fields
    if (!user.skills || user.skills.length === 0) {
      console.warn(`User ${userId} has no skills defined for recommendations`);
      return [];
    }

    // Fetch only active jobs for better performance
    const jobs = await Job.find({
      visibility: "public",
      job_status: "Pending"
    }).lean();

    if (jobs.length === 0) {
      return [];
    }

    const tfidf = new TfIdf();

    // Enhanced user document preprocessing
    const userTextData = [
      user.title || '',
      ...(user.skills || []),
      user.about_me || ''
    ];
    const userDocument = preprocessText(userTextData.join(' '));
    
    if (userDocument.length === 0) {
      console.warn(`User ${userId} has insufficient text data for recommendations`);
      return [];
    }

    tfidf.addDocument(userDocument);

    // Process jobs with enhanced scoring
    const jobsWithScore = jobs.map((job, index) => {
      // Enhanced job document preprocessing
      const jobTextData = [
        job.title || '',
        ...(job.skills_required || []),
        job.job_description || ''
      ];
      const jobDocument = preprocessText(jobTextData.join(' '));
      
      tfidf.addDocument(jobDocument);
      let tfidfScore = 0;
      if (jobDocument.length > 0) {
        userDocument.forEach((term) => {
          tfidfScore += tfidf.tfidf(term, index + 1);
        });
        // Normalize TF-IDF score
        tfidfScore = tfidfScore / Math.max(userDocument.length, 1);
      }

      const skillMatchData = calculateSkillMatch(user.skills, job.skills_required);

      const categoryScore = calculateCategoryMatch(
        user.title, 
        user.skills, 
        job.title, 
        job.category, 
        job.skills_required
      );

      const weights = {
        skillMatch: 0.5,    // 50% - Most important for home services
        category: 0.3,      // 30% - Title/category matching
        textSimilarity: 0.2 // 20% - TF-IDF similarity
      };

      const combinedScore = (
        skillMatchData.score * weights.skillMatch +
        categoryScore * weights.category +
        Math.min(tfidfScore, 1.0) * weights.textSimilarity
      );

      return {
        id: job._id.toString(),
        job: job,
        similarityScore: combinedScore,
        skillMatchData: skillMatchData,
        categoryScore: categoryScore,
        tfidfScore: tfidfScore,
        // Additional metadata for debugging/explanation
        matchedSkills: skillMatchData.matches.map(m => m.userSkill),
        exactSkillMatches: skillMatchData.exactMatches,
        relatedSkillMatches: skillMatchData.relatedMatches
      };
    });

    // Sort by combined similarity score
    const sortedJobs = jobsWithScore.sort(
      (a, b) => b.similarityScore - a.similarityScore
    );

    // Dynamic threshold: use average score * 0.4 or minimum 0.2
    const avgScore = sortedJobs.reduce((sum, job) => sum + job.similarityScore, 0) / sortedJobs.length;
    const dynamicThreshold = Math.max(0.2, avgScore * 0.4);
    
    const filteredJobs = sortedJobs.filter(
      (job) => job.similarityScore >= dynamicThreshold
    );

    // Limit to top 15 recommendations for performance
    const topRecommendations = filteredJobs.slice(0, 15);

    // Return enhanced job objects with recommendation metadata
    const recommendedJobs = topRecommendations.map((jobData) => {
      const job = jobs.find((j) => j._id.toString() === jobData.id);
      return {
        ...job,
        similarityScore: Math.round(jobData.similarityScore * 100) / 100,
        matchedSkills: jobData.matchedSkills,
        exactMatches: jobData.exactSkillMatches,
        relatedMatches: jobData.relatedSkillMatches,
        recommendationReason: generateRecommendationReason(jobData)
      };
    });

    return recommendedJobs;

  } catch (err) {
    console.error("Error in recommendJobs function:", err);
    throw new Error(`Recommendation engine failed: ${err.message}`);
  }
};

export default recommendJobs;
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");

const app = express();

// ✅ Allow requests from the frontend
const corsOptions = {
  origin: ["http://localhost:3000", "https://yourcareer-compass.surge.sh"],
  methods: ["POST"],
};
app.use(cors(corsOptions));

// ✅ Log every request that hits the server
app.use((req, res, next) => {
  console.log(`➡️ Incoming ${req.method} request to ${req.url}`);
  next();
});

// ✅ Handle file uploads
const upload = multer({ dest: "uploads/" });

// ✅ Main endpoint: Analyze resume against job description
app.post("/analyze", upload.single("resume"), async (req, res) => {
  console.log("🚀 /analyze endpoint hit");

  try {
    const jobText = req.body.jobText;
    const file = req.file;

    console.log("📄 File uploaded:", file?.originalname);
    console.log("📝 Job text (start):", jobText?.slice(0, 100) || "None");

    if (!file || !jobText) {
      return res.status(400).json({ error: "Missing resume or job description." });
    }

    // Read and parse resume
    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text.toLowerCase();

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    const resumeWords = new Set(resumeText.split(/\W+/));
    const jobWords = jobText.toLowerCase().split(/\W+/);

    // Expanded known skills (technical + soft)
    const knownSkills = [
      // technical
      "python", "sql", "excel", "react", "node", "aws", "git", "docker",
      "typescript", "javascript", "html", "css", "mongodb", "firebase",
      // soft skills
      "communication", "leadership", "teamwork", "problem-solving", "adaptability"
    ];

    // Fuzzy match function (e.g., reactjs matches react)
    const includesFuzzy = (word, textSet) => {
      return [...textSet].some(t => t.includes(word) || word.includes(t));
    };

    const skillsInJob = knownSkills.filter(skill => jobWords.includes(skill));

    const matchedSkills = skillsInJob.filter(skill => includesFuzzy(skill, resumeWords));
    const missingSkills = skillsInJob.filter(skill => !includesFuzzy(skill, resumeWords));

    // Optional: weighted scoring
    const skillWeights = {
      python: 2,
      sql: 2,
      aws: 2,
      git: 1,
      docker: 1,
      react: 2,
      communication: 1,
      leadership: 1
    };

    const totalWeight = skillsInJob.reduce((sum, skill) => sum + (skillWeights[skill] || 1), 0);
    const matchedWeight = matchedSkills.reduce((sum, skill) => sum + (skillWeights[skill] || 1), 0);

    // Strict scoring: reward matches, penalize misses
    const penalty = missingSkills.reduce((sum, skill) => sum + (skillWeights[skill] || 1), 0);
    const rawScore = totalWeight > 0 ? (matchedWeight / totalWeight) * 100 : 0;
    const matchScore = Math.max(0, Math.round(rawScore - penalty * 2));

    // Recommendation level
    let recommendation;
    if (matchScore >= 80) recommendation = "Strong Match";
    else if (matchScore >= 50) recommendation = "Average Match";
    else recommendation = "Weak Match";

    res.json({
      score: matchScore,
      matchedSkills,
      missingSkills,
      recommendation,
      summary: matchedSkills.length
        ? `You're a ${recommendation.toLowerCase()}. Focus on learning: ${missingSkills.join(", ") || "nothing — you're all set!"}`
        : "No relevant skills found in resume. Consider tailoring it to this job."
    });
  } catch (error) {
    console.error("❌ Error in /analyze:", error);
    res.status(500).json({ error: "Something went wrong during analysis." });
  }
});

// ✅ Start the server
app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});

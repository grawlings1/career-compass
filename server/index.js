const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");

const app = express();

// ✅ Allow requests from React frontend
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["POST"],
};
app.use(cors(corsOptions));

// ✅ Log every incoming request
app.use((req, res, next) => {
  console.log(`➡️ Incoming ${req.method} request to ${req.url}`);
  next();
});

// ✅ Ping route for testing server
app.post("/ping", (req, res) => {
  console.log("✅ /ping route hit");
  res.json({ message: "pong" });
});

// ✅ File upload setup
const upload = multer({ dest: "uploads/" });

// ✅ Resume analysis route
app.post("/analyze", upload.single("resume"), async (req, res) => {
  console.log("🚀 /analyze endpoint hit");
  console.log("📦 req.body:", req.body);
  console.log("📎 req.file:", req.file);

  try {
    const jobText = req.body.jobText;
    const file = req.file;

    if (!file || !jobText) {
      return res.status(400).json({ error: "Missing resume or job description." });
    }

    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    fs.unlinkSync(file.path); // clean up uploaded file

    const resumeWords = new Set(resumeText.toLowerCase().split(/\W+/));
    const jobWords = jobText.toLowerCase().split(/\W+/);

    const knownSkills = ["python", "sql", "excel", "react", "node", "aws", "git", "docker"];
    const skillsInJob = jobWords.filter(word => knownSkills.includes(word));
    const matchedSkills = skillsInJob.filter(skill => resumeWords.has(skill));
    const missingSkills = skillsInJob.filter(skill => !resumeWords.has(skill));
    const matchScore = skillsInJob.length
      ? Math.round((matchedSkills.length / skillsInJob.length) * 100)
      : 0;

    res.json({
      score: matchScore,
      matchedSkills,
      missingSkills,
      summary: matchedSkills.length
        ? `You're a good match! Focus on learning: ${missingSkills.join(", ") || "nothing — you're all set!"}`
        : "No relevant skills found in resume. Consider tailoring it to this job."
    });
  } catch (error) {
    console.error("❌ Error in /analyze:", error);
    res.status(500).json({ error: "Something went wrong during analysis." });
  }
});

// ✅ Start the server
app.listen(5001, () => {
  console.log("✅ Server running on http://localhost:5001");
});
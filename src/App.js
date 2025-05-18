import { useState } from "react";
import axios from "axios";

function App() {
  const [resume, setResume] = useState(null);
  const [jobText, setJobText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume || !jobText.trim()) {
      alert("Please upload a resume and paste a job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobText", jobText);

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5001/analyze", formData);
      const dedupedMatched = [...new Set(response.data.matchedSkills)].map(skill => skill.charAt(0).toUpperCase() + skill.slice(1));
      const dedupedMissing = [...new Set(response.data.missingSkills)].map(skill => skill.charAt(0).toUpperCase() + skill.slice(1));
      const cleanedSummary = response.data.summary.replace(/(\b\w+\b)(,\s*\1)+/gi, "$1");
      setResult({
        ...response.data,
        matchedSkills: dedupedMatched,
        missingSkills: dedupedMissing,
        summary: cleanedSummary,
      });
    } catch (err) {
      console.error("ERROR:", err);
      alert("Something went wrong. Check your server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-100 via-sky-100 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white shadow-2xl p-10 rounded-3xl border border-gray-200">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8 tracking-tight">🎯 Career Compass</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Resume (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResume(e.target.files[0])}
              className="block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paste Job Description</label>
            <textarea
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste the job description here..."
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 text-sm rounded-lg shadow hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>
        </form>

        {result && (
          <div className="mt-10 bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">📊 Analysis Results</h2>
            <p className="mb-4"><strong>Match Score:</strong> {result.score}%</p>
            <div className="mb-4">
              <strong className="block mb-1">Matched Skills:</strong>
              <div className="flex flex-wrap gap-2">
                {result.matchedSkills.map((skill, index) => (
                  <span key={index} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <strong className="block mb-1">Missing Skills:</strong>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.length ? result.missingSkills.map((skill, index) => (
                  <span key={index} className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                    {skill}
                  </span>
                )) : <span className="text-sm text-gray-500">None</span>}
              </div>
            </div>
            <p className="text-gray-700"><strong>Summary:</strong> {result.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

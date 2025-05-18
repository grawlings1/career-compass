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
      const response = await axios.post("https://career-compass-c1qc.onrender.com/analyze", formData); // 👈 direct backend call
      setResult(response.data);
    } catch (err) {
      console.error("ERROR:", err);
      alert("Something went wrong. Check your server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-xl mx-auto bg-white shadow-xl p-8 rounded-2xl border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-indigo-800 mb-6">Career Compass</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setResume(e.target.files[0])}
            className="block w-full border p-2 rounded-md"
          />

          <textarea
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Paste the job description here..."
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md w-full font-semibold hover:bg-indigo-700 transition"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        {result && (
          <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Analysis Results</h2>
            <p className="mb-2"><strong>Match Score:</strong> {result.score}%</p>

            <div className="mb-2">
              <strong>Matched Skills:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.matchedSkills.map((skill, i) => (
                  <span key={i} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    {skill.charAt(0).toUpperCase() + skill.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <strong>Missing Skills:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.missingSkills.length > 0 ? (
                  result.missingSkills.map((skill, i) => (
                    <span key={i} className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                      {skill.charAt(0).toUpperCase() + skill.slice(1)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-600">None</span>
                )}
              </div>
            </div>

            <p className="mt-4 text-gray-700"><strong>Summary:</strong> {result.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

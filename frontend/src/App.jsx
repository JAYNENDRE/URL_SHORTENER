import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // styles for URL shortener components

function App() {
  const [longUrl, setLongUrl] = useState("");
  const [shortenedData, setShortenedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Connects to your Node.js backend
      const response = await axios.post(
        "http://localhost:5000/api/url/shorten",
        {
          longUrl: longUrl,
        },
      );
      setShortenedData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>URL Shortener</h1>
      <p>Paste a long link and get a short one instantly.</p>

      <form onSubmit={handleSubmit} className="shortener-form">
        <input
          type="text"
          className="url-input"
          placeholder="https://example.com/very-long-link"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="shorten-button">
          {loading ? "Shortening..." : "Shorten"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {shortenedData && (
        <div className="result-box">
          <h3>Your Short Link:</h3>
          <a href={shortenedData.shortUrl} target="_blank" rel="noreferrer">
            {shortenedData.shortUrl}
          </a>
          <p>
            Total Clicks: <strong>{shortenedData.clicks}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;

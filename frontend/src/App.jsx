import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // styles for URL shortener components

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
function App() {
  const [longUrl, setLongUrl] = useState("");
  const [customCode, setCustomCode] = useState(""); // 1. Added state for Custom Alias
  const [shortenedData, setShortenedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/url/shorten`, {
        longUrl: longUrl,
        customCode: customCode,
      });

      console.log("Shortened URL Data:", response.data);
      setShortenedData(response.data);
      setCustomCode(""); // Clear alias input on success
    } catch (err) {
      // Logic for catching "Alias already in use" or other errors
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data ||
        "Something went wrong!";
      console.error("Error shortening URL:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>URL Shortener</h1>
      <p>Paste a long link and get a short one instantly.</p>

      <form onSubmit={handleSubmit} className="shortener-form">
        <div className="input-group">
          <input
            type="text"
            className="url-input"
            placeholder="https://example.com/very-long-link"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            required
          />

          {/* 3. Added Custom Alias Input */}
          <input
            type="text"
            className="alias-input"
            placeholder="Custom alias (optional)"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="shorten-button">
          {loading ? "Shortening..." : "Shorten"}
        </button>
      </form>

      {error && (
        <p
          className="error-message"
          style={{ color: "red", marginTop: "10px" }}
        >
          {error}
        </p>
      )}

      {/* {shortenedData && (
        <div className="result-box">
          <div className="result-header">
            <h3>Your Short Link:</h3>
            <button
              className="copy-btn"
              onClick={() =>
                navigator.clipboard.writeText(shortenedData.shortUrl)
              }
            >
              Copy
            </button>
          </div>
          <a
            href={shortenedData.shortUrl}
            target="_blank"
            rel="noreferrer"
            className="short-link"
          >
            {shortenedData.shortUrl}
          </a>
          <div className="stats">
            <p>
              Total Clicks: <strong>{shortenedData.clicks}</strong>
            </p>
          </div>
        </div>
      )} */}
      {shortenedData && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #444",
            borderRadius: "8px",
          }}
        >
          <h3>Success! Your Shortened Link:</h3>
          <p>
            <a
              href={shortenedData.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#00d1b2",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              {shortenedData.shortUrl}
            </a>
          </p>
          <button
            onClick={() =>
              navigator.clipboard.writeText(shortenedData.shortUrl)
            }
            style={{ padding: "5px 10px", cursor: "pointer" }}
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      {/* Show error if any */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default App;

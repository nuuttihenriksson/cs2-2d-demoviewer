import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:8080";

export default function LandingPage({ onSelectDemo }) {
  const [demos, setDemos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDemos();
  }, []);

  async function fetchDemos() {
    try {
      const response = await fetch(`${API_URL}/demos`);
      const data = await response.json();
      setDemos(data);
    } catch (error) {
      console.error("Error fetching demos:", error);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("demoFile", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        fetchDemos(); // Refresh the list
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>CSGO Demo Player</h1>
      <input type="file" accept=".dem.gz,.dem" onChange={handleUpload} disabled={uploading} />
      {uploading && <p>Parsing demo...</p>}
      <h2>Available Demos</h2>
      <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd", padding: "10px" }}>
        {demos.length === 0 ? <p>No demos available</p> : demos.map((demo) => (
          <div key={demo} onClick={() => onSelectDemo(demo)} style={{ cursor: "pointer", padding: "5px", borderBottom: "1px solid #eee" }}>
            {demo}
          </div>
        ))}
      </div>
    </div>
  );
}

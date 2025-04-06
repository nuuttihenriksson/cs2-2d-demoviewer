import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Input,
} from "@mui/material";

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
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        CS2 Demo Player
      </Typography>

      <Box sx={{ my: 2 }}>
        <label htmlFor="demo-upload">
          <Input
            id="demo-upload"
            type="file"
            inputProps={{ accept: ".dem,.dem.gz" }}
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: "none" }}
          />
          <Button variant="contained" component="span" disabled={uploading}>
            Upload Demo
          </Button>
        </label>
      </Box>

      {uploading && (
        <Box sx={{ my: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2">Parsing demo...</Typography>
        </Box>
      )}

      <Typography variant="h6" sx={{ mt: 4 }}>
        Available Demos:
      </Typography>

      <Paper
        elevation={2}
        sx={{
          mt: 1,
          maxHeight: 300,
          overflowY: "auto",
          p: 2,
          mx: "auto",
          width: "100%",
          maxWidth: 600,
        }}
      >
        {demos.length === 0 ? (
          <Typography variant="body2">No demos available</Typography>
        ) : (
          <List>
            {demos.map((demo) => (
              <ListItem key={demo} disablePadding>
                <ListItemButton onClick={() => onSelectDemo(demo)}>
                  <ListItemText primary={demo} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}

// server.js - Fixed version without duplicate code

// --- 1. Import Libraries ---
const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// --- 2. Init App ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- 3. Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Simple API request logger to help trace UI calls
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    const q = Object.keys(req.query || {}).length
      ? ` query=${JSON.stringify(req.query)}`
      : "";
    const b =
      req.body && Object.keys(req.body).length
        ? ` body=${JSON.stringify(req.body)}`
        : "";
    // console.log(`[API REQ] ${req.method} ${req.originalUrl}${q}${b}`);
  }
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// --- 6. Start ---
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
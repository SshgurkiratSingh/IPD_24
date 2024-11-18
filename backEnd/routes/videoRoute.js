// routes/videoRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

// Directory where video files are stored
const VIDEO_DIR = path.join(__dirname, "..", "videos");

// Supported video streams
const videoStreams = {
  door: "door.mp4",
  garage: "garage.mp4",
  lawn: "lawn.mp4",
};

// Middleware to check if stream exists
const checkStreamExists = (req, res, next) => {
  const streamKey = req.params.stream;
  if (!videoStreams[streamKey]) {
    return res.status(404).send("Stream not found.");
  }
  next();
};

// Route to stream video as MJPEG
// Adjusted Express Route
router.get("/stream/:stream", checkStreamExists, (req, res) => {
    const streamKey = req.params.stream;
    const videoPath = path.join(VIDEO_DIR, videoStreams[streamKey]);
  
    // Check if video file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).send("Video file not found.");
    }
  
    res.writeHead(200, {
      "Content-Type": "multipart/x-mixed-replace; boundary=frame",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });
  
    const command = ffmpeg(videoPath)
      .inputOptions(["-re", "-stream_loop", "-1"])
      .outputOptions([
        "-an", // No audio
        "-c:v", "mjpeg", // Use MJPEG codec
        "-r", "10", // Set output frame rate to 10 FPS
        "-vf", "scale=720:480", // Set resolution
        "-f", "mjpeg", // Output format as MJPEG
      ])
      .on("start", (cmd) => {
        console.log("FFmpeg started with command:", cmd);
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err.message);
        res.end();
      })
      .on("end", () => {
        console.log("FFmpeg streaming ended.");
        res.end();
      });
  
    // Pipe FFmpeg output directly to response
    command.pipe(res);
  });
  

// Route to fetch the latest frame as JPEG
router.get("/latest-frame/:stream", checkStreamExists, (req, res) => {
  const streamKey = req.params.stream;
  const videoPath = path.join(VIDEO_DIR, videoStreams[streamKey]);

  // Check if video file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Video file not found.");
  }

  // Extract a single frame using FFmpeg
  ffmpeg(videoPath)
    .frames(1)
    .size("720x480") // Ensure the frame matches the stream resolution
    .outputFormat("image2")
    .on("error", (err) => {
      console.error("FFmpeg error:", err.message);
      res.status(500).send("Error extracting frame.");
    })
    .pipe(res, { end: true });
});

module.exports = router;

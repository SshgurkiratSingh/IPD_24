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
router.get("/stream/:stream", checkStreamExists, (req, res) => {
  const streamKey = req.params.stream;
  const videoPath = path.join(VIDEO_DIR, videoStreams[streamKey]);

  // Check if video file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Video file not found.");
  }

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
  });

  // Initialize FFmpeg command with looping and real-time streaming
  const command = ffmpeg(videoPath)
    .inputOptions([
      "-re", // Read input at native frame rate
      "-stream_loop",
      "-1", // Loop the input indefinitely
    ])
    .outputOptions([
      "-an", // No audio
      "-vcodec mjpeg", // Use MJPEG codec
      "-r 10", // Set output frame rate to 10 FPS
      "-vf",
      "scale=720:480", // Set resolution to 320x240
      "-f mjpeg", // Output format as MJPEG
    ])
    .on("start", (cmd) => {
      console.log("FFmpeg started with command:", cmd);
    })
    .on("error", (err, stdout, stderr) => {
      console.error("FFmpeg error:", err.message);
      console.error("FFmpeg stderr:", stderr);
      res.end();
    })
    .on("end", () => {
      console.log("FFmpeg streaming ended.");
      res.end();
    })
    .pipe();

  // Pipe FFmpeg output to response
  command.on("data", (chunk) => {
    res.write(
      `--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`
    );
    res.write(chunk);
    res.write("\r\n");
  });

  // Handle client disconnect
  req.on("close", () => {
    console.log(`Client disconnected from stream: ${streamKey}`);
    command.destroy(); // Stop FFmpeg process
    res.end();
  });
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

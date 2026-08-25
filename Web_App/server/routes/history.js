// Import necessary modules
const express = require("express");
const router = express.Router();
const cors = require("cors");
const { PrismaClient } = require("@prisma/client"); // Ensure Prisma is properly set up
const { OpenAI } = require("openai"); // Ensure OpenAI package is installed and configured
const mqtt = require("mqtt");
const fs = require("fs-extra");
const path = require("path");
const cron = require("node-cron");

// Middleware setup
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cors());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY2, // Ensure this environment variable is set
});

// Connect to MQTT broker
const client = mqtt.connect("mqtt://localhost:1883"); // Update the broker URL if different

// Directory to store logs
const LOG_DIR = path.join(__dirname, "..", "logs");

// Ensure the log directory exists
fs.ensureDirSync(LOG_DIR);

// In-memory log storage: Map<topic, Array<{ timestamp, value }>>
const inMemoryLogs = new Map();

// Additional in-memory logs for 5-minute persistence
const inMemoryLogs5Min = new Map();

// Define the topics as a Set (unique)
const topicSet = new Set([
  // Room Topics
  "room/temperature",
  "room/humidity",
  "room/light",
  "room/fan",
  "room/brightness",
  "room/switchboard",
  "room/pir",
  "room/alert",

  // Hall Topics
  "hall/temperature",
  "hall/humidity",
  "hall/light1",
  "hall/ambientLight",
  "hall/fan",
  "hall/brightness",
  "hall/oled",
  "hall/tv",
  "hall/gas",
  "hall/switchboard",
  "hall/alert",

  // Water Tank Topics
  "waterTank/waterLevel",
  "waterTank/ph",
  "waterTank/turbidity",

  // Lawn Topics
  "lawn/light1",
  "lawn/light2",
  "lawn/light3",
  "lawn/light4",
  "lawn/ultrasonic1",
  "lawn/ultrasonic2",
  "lawn/lightIntensity",
  "lawn/autonomousLighting",

  // Home Garden Topics
  "homeGarden/rainSensor",
  "homeGarden/soilMoisture",
  "homeGarden/pumpStatus",
  "homeGarden/gateStatus",

  // Dustbin Topics
  "dustbin/fullStatus",

  // Garage Topics
  "garage/light1",
  "garage/doorStatus",
  "garage/pir1",
  "garage/alert",

  // Multimedia Topics
  "c/Artist",
  "c/Song",
]);

// Initialize in-memory logs for each topic
topicSet.forEach((topic) => {
  inMemoryLogs.set(topic, []);
  inMemoryLogs5Min.set(topic, []); // Initialize 5-minute logs
});

// Helper function to prune logs older than 8 hours from inMemoryLogs
const pruneOldLogs = () => {
  const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
  inMemoryLogs.forEach((logs, topic) => {
    const filteredLogs = logs.filter(
      (entry) => entry.timestamp >= eightHoursAgo
    );
    inMemoryLogs.set(topic, filteredLogs);
  });
};

// Schedule pruning every 10 minutes
setInterval(pruneOldLogs, 10 * 60 * 1000);

// Route to get history data for a topic or all topics
router.get("/", (req, res) => {
  const { topic } = req.query;
  const allTopicsData = {};

  if (topic) {
    if (!inMemoryLogs.has(topic)) {
      return res.status(400).json({
        error: "Invalid topic",
      });
    }
    const logs = inMemoryLogs.get(topic);
    return res.json({
      topic,
      data: logs,
    });
  }

  // If no specific topic is requested, return all topics data
  inMemoryLogs.forEach((logs, topic) => {
    allTopicsData[topic] = logs;
  });

  res.json(allTopicsData);
});

// MQTT Connection and Subscription
client.on("connect", () => {
  console.log("Connected to MQTT broker.");
  client.subscribe(Array.from(topicSet), (err) => {
    if (err) {
      console.error("Subscription error:", err);
    } else {
      console.log("Subscribed to topics:", Array.from(topicSet).join(", "));
    }
  });
});

// MQTT Message Handler
client.on("message", (topic, message) => {
  const value = message.toString();
  const timestamp = Date.now();

  if (topicSet.has(topic)) {
    // Update in-memory logs for hourly persistence
    const logs = inMemoryLogs.get(topic) || [];
    // Check for value change to avoid duplicate consecutive entries
    if (logs.length === 0 || logs[logs.length - 1].value !== value) {
      logs.push({ timestamp, value });
      inMemoryLogs.set(topic, logs);
    }

    // Update in-memory logs for 5-minute persistence
    const logs5Min = inMemoryLogs5Min.get(topic) || [];
    logs5Min.push({ timestamp, value });
    inMemoryLogs5Min.set(topic, logs5Min);
  }
});

// Helper function to get log file path for a specific hour
const getLogFilePath = (date) => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const hour = `0${date.getHours()}`.slice(-2);
  const dir = path.join(LOG_DIR, `${year}-${month}-${day}`);
  fs.ensureDirSync(dir);
  return path.join(dir, `${hour}.json`);
};

// Function to persist in-memory logs to files every hour
const persistLogs = () => {
  const now = new Date();
  const currentHour = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours()
  );
  const logFilePath = getLogFilePath(currentHour);

  const dataToWrite = {};

  inMemoryLogs.forEach((logs, topic) => {
    if (logs.length > 0) {
      dataToWrite[topic] = logs;
    }
  });

  fs.writeJson(logFilePath, dataToWrite, { spaces: 2 }, (err) => {
    if (err) {
      console.error("Error writing log file:", err);
    } else {
      console.log(`Logs persisted to ${logFilePath}`);
      // After persing, clear the in-memory logs
      inMemoryLogs.forEach((logs, topic) => {
        inMemoryLogs.set(topic, []);
      });
    }
  });
};

// Schedule log persistence at the start of every hour
cron.schedule("0 * * * *", () => {
  persistLogs();
});

// Helper function to get log file path for a specific 5-minute interval
const getLogFilePath5Min = (date) => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const hour = `0${date.getHours()}`.slice(-2);
  const minute = `0${date.getMinutes()}`.slice(-2);
  const dir = path.join(LOG_DIR, `${year}-${month}-${day}`);
  fs.ensureDirSync(dir);
  return path.join(dir, `${hour}-${minute}.json`);
};

// Function to persist in-memory logs to files every 5 minutes
const persistLogsEvery5Min = () => {
  const now = new Date();
  const logFilePath = getLogFilePath5Min(now);

  const dataToWrite = {};

  inMemoryLogs5Min.forEach((logs, topic) => {
    if (logs.length > 0) {
      dataToWrite[topic] = logs;
    }
  });

  fs.writeJson(logFilePath, dataToWrite, { spaces: 2 }, (err) => {
    if (err) {
      console.error("Error writing 5-minute log file:", err);
    } else {
      console.log(`5-minute logs persisted to ${logFilePath}`);
      // After persing, clear the 5-minute in-memory logs
      inMemoryLogs5Min.forEach((logs, topic) => {
        inMemoryLogs5Min.set(topic, []);
      });
    }
  });
};

// Schedule 5-minute log persistence
cron.schedule("*/5 * * * *", () => {
  persistLogsEvery5Min();
});

// Helper function to clean up old log files (older than 15 days)
const cleanOldLogs = () => {
  const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
  fs.readdir(LOG_DIR, (err, files) => {
    if (err) {
      console.error("Error reading log directory:", err);
      return;
    }

    files.forEach((dir) => {
      const dirPath = path.join(LOG_DIR, dir);
      fs.stat(dirPath, (err, stats) => {
        if (err) {
          console.error("Error stating directory:", err);
          return;
        }

        if (stats.isDirectory()) {
          const [year, month, day] = dir.split("-").map(Number);
          const dirDate = new Date(year, month - 1, day);
          if (dirDate.getTime() < fifteenDaysAgo) {
            fs.remove(dirPath, (err) => {
              if (err) {
                console.error(`Error removing directory ${dirPath}:`, err);
              } else {
                console.log(`Removed old log directory: ${dirPath}`);
              }
            });
          }
        }
      });
    });
  });
};

// Schedule cleanup daily at 2 AM
cron.schedule("0 2 * * *", () => {
  cleanOldLogs();
});

// API Endpoint to get historical data for a specific topic
// Example: GET /api/history?topic=room/temperature&start=2024-04-01T00:00:00Z&end=2024-04-02T00:00:00Z
router.get("/history", async (req, res) => {
  try {
    const { topic, start, end } = req.query;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    if (!topicSet.has(topic)) {
      return res.status(400).json({ error: "Invalid topic." });
    }

    // Parse start and end times
    const startTime = start
      ? new Date(start).getTime()
      : Date.now() - 24 * 60 * 60 * 1000; // Default to last 24 hours
    const endTime = end ? new Date(end).getTime() : Date.now();

    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({ error: "Invalid start or end time." });
    }

    if (startTime > endTime) {
      return res
        .status(400)
        .json({ error: "Start time must be before end time." });
    }

    // Collect relevant log files
    const results = [];

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Iterate through each hour in the range
    for (
      let date = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        startDate.getHours()
      );
      date <= endDate;
      date.setHours(date.getHours() + 1)
    ) {
      const logFilePath = getLogFilePath(date);
      if (fs.existsSync(logFilePath)) {
        try {
          const data = await fs.readJson(logFilePath);
          if (data[topic]) {
            // Filter entries within the time range
            const filteredEntries = data[topic].filter(
              (entry) =>
                entry.timestamp >= startTime && entry.timestamp <= endTime
            );
            results.push(...filteredEntries);
          }
        } catch (err) {
          console.error(`Error reading log file ${logFilePath}:`, err);
        }
      }
    }

    res.json({ topic, data: results });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;

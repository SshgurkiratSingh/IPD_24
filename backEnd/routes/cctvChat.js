// chatRouter.js

const express = require("express");
const router = express.Router();
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // Ensure you have a .env file with GEMINI_API_KEY

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-002",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type of CCTV analysis being performed",
      },
      room_context: {
        type: "string",
        description: "Details about the room and its expected use.",
      },
      scene_overview: {
        type: "string",
        description: "Description of the general scene and environment.",
      },
      user_query_response: {
        type: "string",
        description: "Answer related to the specific user query posed.",
      },
      object_identification: {
        type: "array",
        description: "Identified significant entities within the room context.",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Type of object (e.g., person, furniture, appliance)",
            },
            count: {
              type: "number",
              description: "Number of this type observed",
            },
            details: {
              type: "string",
              description:
                "Additional details (e.g., color, position, activity)",
            },
          },
          required: ["type", "count", "details"],
        },
      },
      activity_analysis: {
        type: "array",
        description: "Analysis of observed activities in the footage.",
        items: {
          type: "object",
          properties: {
            activity: {
              type: "string",
              description: "Description of the activity",
            },
            significance: {
              type: "string",
              description: "Significance level (e.g., normal, unusual, alert)",
            },
          },
          required: ["activity", "significance"],
        },
      },
      potential_issues: {
        type: "array",
        description: "Identified issues based on the analysis.",
        items: {
          type: "object",
          properties: {
            issue_type: {
              type: "string",
              description: "Type of issue (e.g., safety, security)",
            },
            description: {
              type: "string",
              description: "Specific description of the issue",
            },
          },
          required: ["issue_type", "description"],
        },
      },
      recommendations: {
        type: "array",
        description: "Recommendations based on the analysis.",
        items: {
          type: "string",
          description: "A single recommendation",
        },
      },
      summary: {
        type: "string",
        description: "A concise summary of all important findings.",
      },
    },
    required: [
      "type",
      "room_context",
      "scene_overview",
      "user_query_response",
      "object_identification",
      "activity_analysis",
      "potential_issues",
      "recommendations",
      "summary",
    ],
  },
};

// Middleware setup
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cors());

// In-memory cache
const cache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(filePath, mimeType) {
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: path.basename(filePath),
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

/**
 * Maps image names to room names.
 */
const roomMapping = {
  "room1.png": "Living Room",
  "room2.png": "Kitchen",
  "lawn1.png": "Front Lawn",
  "hall1.png": "Main Hallway",
  "hall2.png": "Upstairs Hallway",
  "hall3.png": "Basement Hallway",
  "garage1.png": "Garage",
  "door1.png": "Front Door",
};

/**
 * Processes the image and initiates a chat with the LLM.
 */
async function processImageChat(imageName, userQuestion, history = []) {
  try {
    const cacheKey = `${imageName}-${userQuestion}`;
    const now = Date.now();

    // Check cache
    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
      console.log("Serving from cache");
      return cache[cacheKey].responseText;
    }

    // Fetch the image from the URL
    const imageUrl = `https://ipd-ccet.vercel.app/${imageName}`;
    const imagePath = path.join("/tmp", imageName);

    // Determine MIME type
    const extension = path.extname(imageName).toLowerCase();
    let mimeType;
    if (extension === ".jpg" || extension === ".jpeg") {
      mimeType = "image/jpeg";
    } else if (extension === ".png") {
      mimeType = "image/png";
    } else {
      throw new Error("Unsupported image format");
    }

    // Download the image
    const response = await axios({
      method: "get",
      url: imageUrl,
      responseType: "stream",
    });

    // Ensure the /tmp directory exists
    if (!fs.existsSync("/tmp")) {
      fs.mkdirSync("/tmp");
    }

    // Save the image to the file system
    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Upload the image to Gemini
    const uploadedFile = await uploadToGemini(imagePath, mimeType);

    // Get room name
    const roomName = roomMapping[imageName] || "Unknown Room";

    // Prepare the system prompt within the user message
    const systemPrompt = `You are analyzing a CCTV image from the ${roomName}. Provide detailed analysis including object identification, activity analysis, potential issues, and recommendations. Ensure the response follows the specified JSON schema.`;

    // Combine system prompt with user question
    const combinedUserQuestion = `${systemPrompt}\n\nUser query: ${userQuestion}`;

    // Prepare the chat history without 'system' role
    const formattedHistory = history.map((item) => ({
      role: item.role,
      content:
        item.role === "assistant" && typeof item.content !== "string"
          ? JSON.stringify(item.content)
          : item.content,
    }));

    const chatHistory = [
      // Prepend combined system prompt and user question as the latest user message
      ...formattedHistory,
      {
        role: "user",
        content: combinedUserQuestion,
      },
    ];

    const chatSession = model.startChat({
      generationConfig,
      history: chatHistory,
    });

    // Send message to the model
    const result = await chatSession.sendMessage(userQuestion);

    // Get response text
    const responseText = await result.response.text();

    // Validate and parse the response
    const parsedResponse = JSON.parse(responseText);

    // Store in cache
    cache[cacheKey] = {
      responseText,
      timestamp: now,
    };

    return responseText;
  } catch (error) {
    console.error("Error in processImageChat:", error);
    throw error;
  }
}

// Define the API endpoint
router.post("/chat", async (req, res) => {
  const { imageName, userQuestion, history } = req.body;

  if (!imageName || !userQuestion) {
    return res
      .status(400)
      .json({ error: "imageName and userQuestion are required" });
  }

  try {
    const responseText = await processImageChat(
      imageName,
      userQuestion,
      history || []
    );
    res.json(JSON.parse(responseText));
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();

const cors = require("cors");

// Middleware setup
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cors());
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const { route } = require("./history");

const NodeCache = require("node-cache"); // Import node-cache

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const app = express();

app.use(express.json()); // For parsing application/json

// Initialize cache with a default TTL of 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(filePath, mimeType) {
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: filePath,
  });
  const file = uploadResult.file;
  console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
  return file;
}

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
              description: "Type of object (e.g., person, vehicle, animal)",
            },
            count: {
              type: "string",
              description: "Number of this type observed",
            },
            details: {
              type: "string",
              description:
                "Additional details (e.g., clothing description for people, object description)",
            },
          },
          required: ["type", "count", "details"],
        },
      },
      behavior_analysis: {
        type: "array",
        description: "Analysis of observed behaviors in the footage.",
        items: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Detail of any unusual or suspicious behavior",
            },
            severity: {
              type: "string",
              description: "Severity level (e.g., low, medium, high)",
            },
          },
          required: ["description", "severity"],
        },
      },
      potential_concerns: {
        type: "array",
        description: "Identified concerns based on the analysis.",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Type of concern (e.g., safety, security)",
            },
            description: {
              type: "string",
              description: "Specific description of the concern",
            },
          },
          required: ["type", "description"],
        },
      },
      additional_insights: {
        type: "array",
        description: "Additional insights derived from the observed footage.",
        items: {
          type: "object",
          properties: {
            insight: {
              type: "string",
              description:
                "Additional interpretations or strategic assessments based on the observed footage",
            },
            impact: {
              type: "string",
              description: "Potential impact or significance of the insight",
            },
          },
          required: ["insight", "impact"],
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
      "behavior_analysis",
      "potential_concerns",
      "additional_insights",
      "summary",
    ],
  },
};

/**
 * Processes the image and initiates a chat with the LLM.
 */
async function processImageChat(imageName, userQuestion, history = []) {
  try {
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

    // Save the image to the file system
    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Upload the image to Gemini
    const uploadedFile = await uploadToGemini(imagePath, mimeType);

    // Prepare the chat session
    const chatHistory = history.map((item) => ({
      role: item.role,
      parts: item.parts,
    }));

    chatHistory.push({
      role: "user",
      parts: [
        {
          fileData: {
            mimeType: mimeType,
            fileUri: uploadedFile.uri,
          },
        },
        { text: `User query: ${userQuestion}\n` },
      ],
    });

    const chatSession = model.startChat({
      generationConfig,
      history: chatHistory,
    });

    // Send message to the model
    const result = await chatSession.sendMessage(userQuestion);

    // Return the response
    return result.response.text();
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

  // Create a unique cache key based on imageName and userQuestion
  const cacheKey = `${imageName}:${userQuestion}`;

  // Check if the response is already in cache
  const cachedResponse = cache.get(cacheKey);
  if (cachedResponse) {
    console.log(`Cache hit for key: ${cacheKey}`);
    return res.json(cachedResponse);
  }

  try {
    const responseText = await processImageChat(
      imageName,
      userQuestion,
      history
    );
    const parsedResponse = JSON.parse(responseText);

    // Store the response in cache
    cache.set(cacheKey, parsedResponse);

    res.json(parsedResponse);
  } catch (error) {
    console.error("Error in /chat endpoint:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

module.exports = router;

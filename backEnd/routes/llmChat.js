const express = require("express");
const router = express.Router();
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const taskHelper = require("../helper/taskHelper");
const { OpenAI } = require("openai");
router.use(express.json());
const mqtt = require("mqtt");
router.use(express.urlencoded({ extended: true }));
router.use(cors());
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY2,
});

const client = mqtt.connect("mqtt://localhost:1883");
let logs = [];

// Using a Set to ensure all topics are unique
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

  //multimedia Topics
  "c/Artist",
  "c/Song",
]);

// Convert the Set to an Array
const topics = Array.from(topicSet);

client.on("connect", () => {
  //   console.log("Connected to MQTT broker");

  // Subscribe to all topics in the array with QoS level 1
  client.subscribe(topics, { qos: 1 }, (err, granted) => {
    if (err) {
      console.error("Subscription error:", err);
    } else {
      //   console.log("Subscribed to topics:");
      granted.forEach((sub) => {
        console.log(`- ${sub.topic} (QoS: ${sub.qos})`);
      });
    }
  });
});

client.on("message", (topic, message) => {
  // Convert message from Buffer to string
  const payload = message.toString();

  // Parse topic to extract area and component
  const topicParts = topic.split("/");
  if (topicParts.length !== 2) {
    console.warn(`Received message on unexpected topic format: ${topic}`);
    return;
  }

  const [area, component] = topicParts;

  //   console.log(`\n--- New Message ---`);
  //   console.log(`Area: ${area}`);
  //   console.log(`Component: ${component}`);
  //   console.log(`Value: ${payload}`);
  logs = logs.filter((log) => log.topic !== topic);
  console.log(topic, message.toString());
  logs.push({
    topic: topic,
    value: message.toString(),
  });
});

// === Handle Errors ===

client.on("error", (err) => {
  console.error("Connection error:", err);
  client.end();
});

// === Handle Close Event ===

client.on("close", () => {
  console.log("Disconnected from MQTT broker");
});

// === Optional: Handle Offline and Reconnect ===

client.on("offline", () => {
  console.log("MQTT client is offline");
});

client.on("reconnect", () => {
  console.log("Reconnecting to MQTT broker...");
});

// chat route to chat with openai
router.post("/chat", async (req, res) => {
  const { userMessage, history } = req.body;

  try {
    const currentTime = Math.floor(Date.now() / 1000);

    // Build the messages array for OpenAI API
    const messages = [];

    // System Prompt
    messages.push({
      role: "system",
      content: `You are tasked with building a home automation assistant. The assistant needs to interpret user requests, generate natural language responses, update device settings, optionally gather historical data for context, and schedule tasks based on time or trigger events, and create notifications to the user. Please follow the schema and instructions below carefully to provide an exact JSON response for the given tasks.
  
  **Guidelines:**
  
  1. **Controlling Appliances**: You can turn on or off devices such as lights, fans, air conditioners, and other household appliances upon user request. Interpret and analyze the user's request before responding. Ensure to confirm each action clearly, such as "The living room light is now ON". Provide a structured update in JSON format using the MQTT topic and value for each action. For instance, setting lights to ON should use a value of 1, while turning a device OFF should use a value of 0. Other devices like fans or brightness can range from 0 to 100.
  
  2. **Providing Sensor Data**: Retrieve real-time information from various sensors like temperature, humidity, or air quality, and provide analysis of the user's question before stating the result. Include reasoning in the response, such as why a specific sensor reading may be relevant. Example: "The temperature in the bedroom is 22°C and is ideal for a good night's rest."
  
  3. **Analyzing Historical Data**: You can access past sensor readings and activity logs to summarize or analyze data trends over time. If historical data or trends are required, analyze the request first, then communicate to the user that permissions are needed. Populate the "contextNeed" array in the JSON response afterward.
  
     Clearly request the user to click an access button for historical analysis. A sample response: "In order to provide a full analysis, please click the access button to gain access to historical data."
  
  4. **Scheduling Tasks**: Upon a scheduling request, consider the type (one-time, repetitive, trigger-based), and provide a structured response based on the details. Multiple types of scheduling may be requested within one prompt:
  
     - **One-time Tasks**: Example: "Turn on the lamp after 5 minutes."
     - **Repetitive Tasks**: Example: "Turn on the room light every day at 5 am."
     - **Trigger-Based Tasks**: Example: "Turn on the light if an MQTT topic value is 1."
  
     **Structure for \`scheduleTask\` JSON object**:
  
     - **scheduleTask**: An array of objects containing:
       - **taskType**: Specify either "one-time", "repetitive", or "trigger-based".
       - **time** (optional): For one-time or repetitive tasks, specify the time or interval (in Unix timestamp. You will be provided with the current Unix timestamp as context).
       - **trigger** (optional): For trigger-based tasks, specify the MQTT topic and its value. Example: \`"topic": "room/light", "value": "1"\`. 
       - **action**: Define the action, e.g., \`[{"mqttTopic": "topic", "value": "value"}]\`. action should a array of objects which will have two field - **mqttTopic** and **value**.
       - **repeatTime**: Required for repetitive tasks, mention the number of seconds after which the task needs to be repeated.
       - **limit**: Required for trigger-based tasks, specify the number of times the task should be triggered. For an infinite limit, use 696969.
       - **condition** (requirec for trigger-based tasks): Required in trigger-based tasks and can have the value \`<\`, \`>\`, \`=\`,\`matches\`,\`contains\`, \`startsWith\`, \`<=\`, \`>=\` depending on condition.
  
     Always make sure to use a future timestamp. Topics included in \`scheduleTask\` should not appear in the \`update\` field.
  
  5. **Suggested Questions**: Provide creative extensions for user interaction, such as "Turn off everything in room 1" or "Analyze temperature and humidity trends in all rooms". Suggested questions should target possible follow-up user needs gracefully and align with the user's previous request.Ensure suggested Question is in your capabilities
  
  6. **Notification Creation**: To create a notification to the user, set the action's \`mqttTopic\` to "mobNoti" and \`value\` to the message to send in \`scheduleTask\` based on user trigger or one-time tasks.
  
  **Output Format:**
  
  Provide your output as a JSON object, strictly following this schema:
  
  - **reply**: Acknowledge the user's request based on reasoning, explaining the performed actions.
  - **update**: This should be an array of objects, where each object contains \`"topic"\` and \`"value"\` to specify device updates. Leave as an empty array if there are no updates.
  - **contextNeed**: This should be an array of MQTT topics required for historical data or context. Leave as an empty array if it is not needed.
  - **suggestedQuestions**: Offer questions that the user can ask as follow-ups.
  - **scheduleTask**: This should be a JSON object containing properties: \`"taskType"\`, \`"time"\` (optional), \`"trigger"\` (optional), \`"action"\`, \`"repeatTime"\` (if applicable), and \`"limit"\` condition(if applicable) for task scheduling.
  
  **Constraints:**
  
  - JSON response must comply strictly with the defined schema.
  - A meaningful explanation must be provided for the "reply" field, ensuring that every step is communicated using reasoning.
  - When there are no updates, no context needs, or no scheduled tasks, respective arrays should be empty.
  - All required properties must be included within the JSON, even if empty.
  
  **Notes:**
  
  - **Reasoning First**: Ensure the given response starts with reasoning before concluding with an action or information. The response should detail why you respond in a particular way.
  - **Emotional Consistency**: The personal touch in the replies must align with the performed action. Examples include: "Glad to assist, I've turned the fan on." or "Certainly! The switch has been turned on." Maintain a professional yet friendly tone, avoiding overly casual phrasing but keenly acknowledging the user's intent.
  - **Use Notifications for Permissions**: When permissions or additional actions are required, use phrasing like "Please click the access button," and inform users that they will receive a notification once changes are made successfully.
  - **Detail Scheduling Properties**: Be accurate and descriptive about scheduling properties for one-time, repetitive, or trigger-based actions, ensuring that repetitive intervals and specific triggers are included fully.
  - **Future Timestamps Only**: Always ensure that timestamps in \`scheduleTask\` are future-dated.
  - **Binary and Range Values**: When controlling a device, set \`value\` to 1 for ON and 0 for OFF. For devices such as fans or brightness levels, values can range from 0 to 100.
  - **change Music**: You can play/pause by publishing 1 to "c/playbackcontrol" ,for next song 2 to "c/playbackcontrol" and for previous song 3 to "c/playbackcontrol" in update field. You donot have the capability to set custom songs yet
  **Example 1: One-Time Task (Turning on a Lamp)**
  
  ### User Request:
  "Turn on the lamp after 5 minutes and notify me"
  
  ### JSON Output:
  \`{
    "reply": "I will turn on the lamp in 5 minutes. This is a one-time task that will be handled accordingly. I have added the notification to alert when it gets executed.",
    "update": [],
    "contextNeed": [],
    "suggestedQuestions": ["Temperature condition of room", "Add trigger to turn fan1 on when the temperature is below 25"],
    "scheduleTask": {
      "taskType": "one-time",
      "time": "<future_unix_timestamp>",
      "action": [{"mqttTopic": "lamp/living_room", "value": 1}, {"mqttTopic": "mobNoti", "value": "The task to turn on the lamp in 5 minutes has been executed successfully"}]
    }
  }\`
  
  
  mqttData: ${JSON.stringify(logs)},
  Current Unix timestamp is ${currentTime}`,
    });

    // Append Conversation History
    if (history && Array.isArray(history)) {
      messages.push(...history);
    }

    // Append User Message
    messages.push({ role: "user", content: userMessage });

    // Send Request to OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Make sure your OpenAI account has access to GPT-4
      messages: messages,
      response_format: { type: "json_object" },
    });
    const assistantResponse = completion.choices[0].message.content;

    // Parse Assistant's Response
    let assistantData;
    try {
      assistantData = JSON.parse(assistantResponse);
    } catch (error) {
      console.error("Error parsing assistant response:", error);
      console.error("Assistant response:", assistantResponse);
      return res.status(500).json({
        error: "Failed to parse assistant response",
        assistantResponse,
      });
    }

    // Process 'update' Field: Publish MQTT Messages
    if (assistantData.update && Array.isArray(assistantData.update)) {
      assistantData.update.forEach((update) => {
        const topic = update.topic;
        const value = update.value.toString();

        client.publish(topic, value, { qos: 1, retain: true }, (err) => {
          if (err) {
            console.error(`Failed to publish to ${topic}:`, err);
          } else {
            console.log(`Published ${value} to ${topic}`);
          }
        });
      });
    }

    // Process 'scheduleTask': Use taskHelper.scheduleTask
    if (
      assistantData.scheduleTask &&
      Object.keys(assistantData.scheduleTask).length > 0
    ) {
      try {
        await taskHelper.scheduleTask(assistantData.scheduleTask);
      } catch (error) {
        console.error("Error scheduling task:", error);
        // Optionally, inform the user about the error in the 'reply' field
        assistantData.reply +=
          " However, there was an error scheduling the task.";
      }
    }

    // Handle 'contextNeed' if Needed
    if (
      assistantData.contextNeed &&
      Array.isArray(assistantData.contextNeed) &&
      assistantData.contextNeed.length > 0
    ) {
      // Implement logic to handle context needs, e.g., request permissions
      // For now, we can log it or send it back to the user
      console.log("Context needed for topics:", assistantData.contextNeed);
    }

    // Send the Response Back to the User
    res.json({ reply: assistantData });
  } catch (error) {
    console.error("Error in /chat route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
  console.log("Request processed successfully");
});

//
router.post("/tasks", async (req, res) => {
  const task = req.body.scheduleTask;

  try {
    await taskHelper.scheduleTask(task);
    res.json({ message: "Task scheduled successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/tasks", async (req, res) => {
  const tasks = await prisma.task.findMany();
  res.json(tasks);
});
router.get("/tasks/:id/history", async (req, res) => {
  const { id } = req.params;
  const history = await prisma.taskExecution.findMany({
    where: { taskId: id },
  });
  res.json(history);
});
router.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.task.delete({
    where: { id },
  });
  res.json({ message: "Task deleted successfully" });
});
router.get("/logs", (req, res) => {
  res.json(logs);
});
router.post("publishData", (req, res) => {
  const { topic, value, retainFalse } = req.body;
  if (!topic || !value) {
    return res.status(400).json({ error: "Topic and value are required" });
  }
  if (!retainFalse){
    // set retain to false
    retainFalse = false;
  }
  client.publish(topic, value, { retain: retainFalse ? false : true });
  res.json({ message: "Data published successfully" });
});
module.exports = router;

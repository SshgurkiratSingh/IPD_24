const express = require("express");
const router = express.Router();
const cors = require("cors");
const chatController = require("../controllers/chatController");
const taskController = require("../controllers/taskController");
const mqttService = require("../services/mqttService");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cors());
// 
// Chat route
router.post("/chat", chatController.handleChatRequest);

// Task management routes
router.post("/tasks", taskController.scheduleTask);
router.get("/tasks", taskController.getAllTasks);
router.get("/tasks/:id/history", taskController.getTaskHistory);
router.delete("/tasks/:id", taskController.deleteTask);

// MQTT routes
router.get("/logs", (req, res) => {
  res.json(mqttService.getAllLogs());
});

router.post("/publishData", (req, res) => {
  const { topic, value, retainFalse } = req.body;
  try {
    mqttService.publishMessage(topic, value, !retainFalse);
    res.json({ message: "Data published successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/publishData", (req, res) => {
  let { topic, value, retainFalse } = req.query;

  if (!topic || !value) {
    return res.status(400).json({ error: "Topic and value are required" });
  }

  value = value === "true" ? "1" : value === "false" ? "0" : value;
  
  try {
    mqttService.publishMessage(topic, value, retainFalse !== "true");
    res.json({ message: "Data published successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
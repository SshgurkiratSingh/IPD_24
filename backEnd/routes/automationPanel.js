// routes/tasks.js

const express = require("express");
const router = express.Router();
const taskManager = require("../helper/taskHelper"); // Adjust the path as necessary
const { body, param, validationResult } = require("express-validator");

// Middleware to parse JSON bodies
router.use(express.json());

/**
 * GET /tasks
 * Retrieves a list of all tasks.
 */
router.get("/", async (req, res) => {
  try {
    const tasks = await taskManager.getAllTasks();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
});

/**
 * GET /tasks/:id
 * Retrieves a single task by ID.
 */
router.get("/:id", async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const taskId = req.params.id;

  try {
    const task = await taskManager.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the task." });
  }
});

/**
 * POST /tasks
 * Creates a new task and schedules it.
 */
router.post(
  "/",
  [
    body("taskType")
      .isIn(["one-time", "repetitive", "trigger-based"])
      .withMessage(
        "Invalid taskType. Must be one of 'one-time', 'repetitive', 'trigger-based'."
      ),
    body("time")
      .if(body("taskType").isIn(["one-time", "repetitive"]))
      .isInt({ gt: Math.floor(Date.now() / 1000) })
      .withMessage("time must be a future Unix timestamp in seconds."),
    body("repeatTime")
      .if(body("taskType").equals("repetitive"))
      .isInt({ gt: 0 })
      .withMessage("repeatTime must be a positive integer (in seconds)."),
    body("action")
      .isArray({ min: 1 })
      .withMessage("action must be a non-empty array."),
    body("action.*.mqttTopic")
      .isString()
      .withMessage("Each action must have a valid mqttTopic."),
    body("action.*.value")
      .exists()
      .withMessage("Each action must have a value."),
    body("trigger")
      .if(body("taskType").equals("trigger-based"))
      .isObject()
      .withMessage("trigger must be an object for trigger-based tasks."),
    body("trigger.topic")
      .if(body("taskType").equals("trigger-based"))
      .isString()
      .withMessage("trigger.topic must be a string."),
    body("trigger.value")
      .if(body("taskType").equals("trigger-based"))
      .isString()
      .withMessage("trigger.value must be a string."),
    body("condition")
      .optional()
      .isString()
      .withMessage("condition must be a string."),
    body("limit")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("limit must be a positive integer."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskData = req.body;

    try {
      // Schedule the task (this also saves it to the database)
      await taskManager.scheduleTask(taskData);

      res
        .status(201)
        .json({ message: "Task created and scheduled successfully." });
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Failed to create task." });
    }
  }
);

/**
 * PUT /tasks/:id
 * Updates an existing task and reschedules it.
 */
router.put(
  "/:id",
  [
    param("id")
      .isInt({ gt: 0 })
      .withMessage("Task ID must be a positive integer."),
    body("taskType")
      .optional()
      .isIn(["one-time", "repetitive", "trigger-based"])
      .withMessage("Invalid taskType."),
    body("time")
      .optional()
      .isInt({ gt: Math.floor(Date.now() / 1000) })
      .withMessage("time must be a future Unix timestamp in seconds."),
    body("repeatTime")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("repeatTime must be a positive integer (in seconds)."),
    body("action")
      .optional()
      .isArray({ min: 1 })
      .withMessage("action must be a non-empty array."),
    body("action.*.mqttTopic")
      .optional()
      .isString()
      .withMessage("Each action must have a valid mqttTopic."),
    body("action.*.value")
      .optional()
      .exists()
      .withMessage("Each action must have a value."),
    body("trigger")
      .optional()
      .isObject()
      .withMessage("trigger must be an object."),
    body("trigger.topic")
      .optional()
      .isString()
      .withMessage("trigger.topic must be a string."),
    body("trigger.value")
      .optional()
      .isString()
      .withMessage("trigger.value must be a string."),
    body("condition")
      .optional()
      .isString()
      .withMessage("condition must be a string."),
    body("limit")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("limit must be a positive integer."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskId = (req.params.id);
    const updatedData = req.body;

    try {
      // Update the task (this handles deleting and rescheduling)
      await taskManager.updateTask(taskId, updatedData);

      res.status(200).json({ message: "Task updated successfully." });
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Failed to update task." });
    }
  }
);

/**
 * DELETE /tasks/:id
 * Deletes a task and cancels its scheduling.
 */
router.delete(
  "/:id",

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskId = req.params.id;

    try {
      await taskManager.deleteTask(taskId);
      res.status(200).json({ message: "Task deleted successfully." });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task." });
    }
  }
);

module.exports = router;

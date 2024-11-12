// Import necessary modules
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883"); // Use your MQTT broker address

// Constants
const UNLIMITED_LIMIT = 696969;

// In-memory maps to keep track of trigger-based tasks and scheduled timeouts/intervals
const triggersMap = {};
const scheduledTimeouts = new Map(); // For one-time tasks
const scheduledIntervals = new Map(); // For repetitive tasks

// Connect to MQTT Broker
client.on("connect", () => {
  console.log(`[${new Date().toISOString()}] Connected to MQTT Broker`);
});

// Handle incoming MQTT messages
client.on("message", async (topic, message) => {
  console.log(
    `[${new Date().toISOString()}] Received message on topic "${topic}": ${message.toString()}`
  );
  try {
    const tasks = await prisma.task.findMany({
      where: {
        triggerTopic: topic,
      },
    });

    console.log(
      `[${new Date().toISOString()}] Found ${
        tasks.length
      } task(s) for topic "${topic}"`
    );

    for (const task of tasks) {
      if (
        evaluateCondition(message.toString(), task.triggerValue, task.condition)
      ) {
        console.log(
          `[${new Date().toISOString()}] Condition met for task ID ${task.id}`
        );
        if (task.executedCount < task.limit || task.limit === UNLIMITED_LIMIT) {
          console.log(
            `[${new Date().toISOString()}] Executing task ID ${task.id}`
          );
          const executionSuccess = await executeTask(task);
          if (executionSuccess) {
            // Update executed count only if execution was successful
            await prisma.task.update({
              where: { id: task.id },
              data: { executedCount: { increment: 1 } },
            });
            console.log(
              `[${new Date().toISOString()}] Updated executed count for task ID ${
                task.id
              }`
            );

            // If the task has a limit and reached it, consider deleting or deactivating it
            if (
              task.executedCount + 1 >= task.limit &&
              task.limit !== UNLIMITED_LIMIT
            ) {
              console.log(
                `[${new Date().toISOString()}] Task ID ${
                  task.id
                } has reached its execution limit and will be deleted`
              );
              await deleteTask(task.id);
            }
          } else {
            console.warn(
              `[${new Date().toISOString()}] Execution failed for task ID ${
                task.id
              }. executedCount not incremented.`
            );
          }
        } else {
          console.log(
            `[${new Date().toISOString()}] Task ID ${
              task.id
            } has reached execution limit`
          );
        }
      } else {
        console.log(
          `[${new Date().toISOString()}] Condition not met for task ID ${
            task.id
          }`
        );
      }
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error processing message on topic "${topic}":`,
      error
    );
  }
});
async function getAllTasks() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        executions: true, // Include execution logs if needed
      },
    });
    return tasks;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching all tasks:`,
      error.message
    );
    throw error;
  }
}
async function getTaskById(taskId) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        executions: true, // Include execution logs if needed
      },
    });
    return task;
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error fetching task ID ${taskId}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Evaluates the condition based on message value, trigger value, and the condition operator.
 * @param {string} messageValue - The value received from the MQTT message.
 * @param {string} triggerValue - The value to compare against.
 * @param {string} condition - The condition operator ('<', '>', '=').
 * @returns {boolean} - Result of the condition evaluation.
 */
function evaluateCondition(messageValue, triggerValue, condition) {
  // Attempt to parse numeric values
  const msgValNum = parseFloat(messageValue);
  const trigValNum = parseFloat(triggerValue);

  const isNumericComparison = !isNaN(msgValNum) && !isNaN(trigValNum);

  if (isNumericComparison) {
    // Perform numeric comparison
    switch (condition) {
      case "<":
        return msgValNum < trigValNum;
      case "<=":
        return msgValNum <= trigValNum;
      case ">":
        return msgValNum > trigValNum;
      case ">=":
        return msgValNum >= trigValNum;
      case "=":
        return msgValNum === trigValNum;
      case "!=":
        return msgValNum !== trigValNum;
      default:
        console.warn(
          `[${new Date().toISOString()}] Unknown numeric condition "${condition}".`
        );
        return false;
    }
  } else {
    // Perform string comparison
    switch (condition) {
      case "startsWith":
        return messageValue.startsWith(triggerValue);
      case "contains":
        return messageValue.includes(triggerValue);
      case "matches":
        try {
          const regex = new RegExp(triggerValue);
          return regex.test(messageValue);
        } catch (e) {
          console.warn(
            `[${new Date().toISOString()}] Invalid regex in triggerValue "${triggerValue}": ${
              e.message
            }`
          );
          return false;
        }
      case "=":
        return messageValue === triggerValue;
      case "!=":
        return messageValue !== triggerValue;
      default:
        console.warn(
          `[${new Date().toISOString()}] Unknown string condition "${condition}".`
        );
        return false;
    }
  }
}

/**
 * Schedules a task based on its type. If the input is an array, uses the first task in the array.
 * @param {Object|Array} taskInput - The task object or an array of task objects.
 */
async function scheduleTask(taskInput) {
  try {
    let task;

    // Check if the input is an array
    if (Array.isArray(taskInput)) {
      if (taskInput.length === 0) {
        throw new Error("Task array is empty");
      }
      task = taskInput[0];
      console.warn(
        `[${new Date().toISOString()}] scheduleTask received an array. Using the first task:`,
        task
      );
    } else {
      task = taskInput;
    }

    console.log(`[${new Date().toISOString()}] Scheduling task:`, task);
    validateTask(task);

    // Ensure action is always an array
    if (!Array.isArray(task.action)) {
      console.warn(
        `[${new Date().toISOString()}] task.action is not an array. Converting to array.`
      );
      task.action = [task.action];
    }

    switch (task.taskType) {
      case "one-time":
        await scheduleOneTimeTask(task);
        break;
      case "repetitive":
        await scheduleRepetitiveTask(task);
        break;
      case "trigger-based":
        await scheduleTriggerBasedTask(task);
        break;
      default:
        throw new Error(`Invalid taskType: ${task.taskType}`);
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error scheduling task:`,
      error.message
    );
  }
}

/**
 * Parses the condition and value from a trigger value string.
 * @param {string} value - The trigger value string.
 * @returns {Object} - An object containing the condition and the parsed value.
 */
function parseCondition(value) {
  const operators = [
    "startsWith",
    "contains",
    "matches",
    "<=",
    ">=",
    "!=",
    "<",
    ">",
    "=",
  ];
  for (const operator of operators) {
    if (value.startsWith(operator)) {
      const operand = value.slice(operator.length).trim();
      return {
        condition: operator,
        value: operand,
      };
    }
  }
  // If no operator is found, default to "="
  return {
    condition: "=",
    value: value,
  };
}

/**
 * Validates the task object to ensure all required fields are present.
 * @param {Object} task - The task object to validate.
 * @throws Will throw an error if validation fails.
 */
function validateTask(task) {
  const validConditions = [
    "<",
    ">",
    "=",
    "<=",
    ">=",
    "!=",
    "startsWith",
    "contains",
    "matches",
  ];

  if (!task.taskType) {
    throw new Error("taskType is required");
  }

  if (!task.action) {
    throw new Error("action is required");
  }

  // Ensure action is an array
  if (!Array.isArray(task.action)) {
    console.warn(
      `[${new Date().toISOString()}] task.action is not an array. It will be converted to an array.`
    );
    task.action = [task.action];
  }

  switch (task.taskType) {
    case "one-time":
    case "repetitive":
      // Existing validation for 'one-time' and 'repetitive' tasks
      break;
    case "trigger-based":
      if (!task.trigger) {
        throw new Error("trigger is required for trigger-based tasks");
      }
      if (!task.trigger.topic || !task.trigger.value) {
        throw new Error(
          "trigger must include both topic and value for trigger-based tasks"
        );
      }
      if (!task.condition) {
        // Parse condition and value from trigger.value
        const parsed = parseCondition(task.trigger.value);
        task.condition = parsed.condition;
        task.trigger.value = parsed.value;
      }
      if (!validConditions.includes(task.condition)) {
        throw new Error(`Invalid condition: ${task.condition}`);
      }
      if (task.limit === undefined || task.limit === null) {
        task.limit = UNLIMITED_LIMIT;
      }
      // Ensure limit is a positive number or UNLIMITED_LIMIT
      if (
        typeof task.limit !== "number" ||
        (task.limit <= 0 && task.limit !== UNLIMITED_LIMIT)
      ) {
        throw new Error(
          `limit must be a positive number or ${UNLIMITED_LIMIT} for unlimited executions`
        );
      }
      break;
    default:
      throw new Error(`Invalid taskType: ${task.taskType}`);
  }
}

/**
 * Schedules a one-time task.
 * @param {Object} task - The task object.
 */
async function scheduleOneTimeTask(task) {
  try {
    console.log(
      `[${new Date().toISOString()}] Scheduling one-time task:`,
      task
    );
    // Validate time is in the future
    const currentTime = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
    if (task.time <= currentTime) {
      console.log(
        `[${new Date().toISOString()}] Time must be in the future. Adding 1-minute delay.`
      );
      task.time = currentTime + 60; // Add 60 seconds (1 minute) delay
    }

    // Save task to database
    const savedTask = await prisma.task.create({
      data: {
        taskType: task.taskType,
        time: task.time,
        action: task.action,
      },
    });

    console.log(
      `[${new Date().toISOString()}] One-time task ID ${
        savedTask.id
      } saved to database`
    );

    // Schedule execution
    const delay = (savedTask.time - Math.floor(Date.now() / 1000)) * 1000;
    const timeout = setTimeout(async () => {
      await executeTask(savedTask);
      scheduledTimeouts.delete(savedTask.id); // Clean up after execution
    }, delay);
    scheduledTimeouts.set(savedTask.id, timeout);

    console.log(
      `[${new Date().toISOString()}] One-time task ID ${
        savedTask.id
      } scheduled to execute in ${delay} ms`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error scheduling one-time task:`,
      error.message
    );
  }
}

/**
 * Schedules a repetitive task.
 * @param {Object} task - The task object.
 */
async function scheduleRepetitiveTask(task) {
  try {
    console.log(
      `[${new Date().toISOString()}] Scheduling repetitive task:`,
      task
    );
    // Validate time is in the future
    const currentTime = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
    if (task.time <= currentTime) {
      console.log(
        `[${new Date().toISOString()}] Time must be in the future. Adding 1-minute delay.`
      );
      task.time = currentTime + 60; // Add 60 seconds (1 minute) delay
    }

    if (!task.repeatTime) {
      throw new Error("repeatTime is required for repetitive tasks");
    }

    // Save task to database
    const savedTask = await prisma.task.create({
      data: {
        taskType: task.taskType,
        time: task.time,
        repeatTime: task.repeatTime,
        action: task.action,
      },
    });

    console.log(
      `[${new Date().toISOString()}] Repetitive task ID ${
        savedTask.id
      } saved to database`
    );

    // Schedule first execution
    const delay = (savedTask.time - Math.floor(Date.now() / 1000)) * 1000;
    const timeout = setTimeout(() => executeRepetitiveTask(savedTask), delay);
    scheduledTimeouts.set(savedTask.id, timeout);

    console.log(
      `[${new Date().toISOString()}] Repetitive task ID ${
        savedTask.id
      } scheduled to execute first in ${delay} ms`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error scheduling repetitive task:`,
      error.message
    );
  }
}

/**
 * Executes a repetitive task and schedules subsequent executions.
 * @param {Object} task - The task object.
 */
function executeRepetitiveTask(task) {
  console.log(
    `[${new Date().toISOString()}] Executing repetitive task ID ${task.id}`
  );
  executeTask(task)
    .then((success) => {
      if (success) {
        // Schedule next execution only if the current execution was successful
        const interval = task.repeatTime * 1000; // Convert seconds to milliseconds
        const intervalId = setInterval(() => executeTask(task), interval);
        scheduledIntervals.set(task.id, intervalId);
        console.log(
          `[${new Date().toISOString()}] Repetitive task ID ${
            task.id
          } scheduled to execute every ${interval} ms`
        );
      } else {
        console.warn(
          `[${new Date().toISOString()}] Repetitive task ID ${
            task.id
          } execution failed. Next execution not scheduled.`
        );
      }
    })
    .catch((error) => {
      console.error(
        `[${new Date().toISOString()}] Error executing repetitive task ID ${
          task.id
        }:`,
        error.message
      );
    });
}

/**
 * Schedules a trigger-based task.
 * @param {Object} task - The task object.
 */
async function scheduleTriggerBasedTask(task) {
  try {
    console.log(
      `[${new Date().toISOString()}] Scheduling trigger-based task:`,
      task
    );

    // Save task to database
    const savedTask = await prisma.task.create({
      data: {
        taskType: task.taskType,
        triggerTopic: task.trigger.topic,
        triggerValue: task.trigger.value,
        condition: task.condition || "=",
        limit: task.limit,
        action: task.action,
      },
    });

    console.log(
      `[${new Date().toISOString()}] Trigger-based task ID ${
        savedTask.id
      } saved to database`
    );

    // Subscribe to the trigger topic if not already subscribed
    const topicsToSubscribe = new Set();
    const subscribedTopics = new Set();

    // Collect all unique trigger topics from existing trigger-based tasks
    const allTriggerTasks = await prisma.task.findMany({
      where: {
        taskType: "trigger-based",
      },
    });

    allTriggerTasks.forEach((t) => topicsToSubscribe.add(t.triggerTopic));

    // Subscribe to each unique topic
    for (const topic of topicsToSubscribe) {
      if (!subscribedTopics.has(topic)) {
        client.subscribe(topic, (err) => {
          if (err) {
            console.error(
              `[${new Date().toISOString()}] Failed to subscribe to topic "${topic}":`,
              err.message
            );
          } else {
            console.log(
              `[${new Date().toISOString()}] Subscribed to topic "${topic}"`
            );
            subscribedTopics.add(topic);
          }
        });
      }
    }

    // Add to triggers map
    triggersMap[savedTask.id] = savedTask;
    console.log(
      `[${new Date().toISOString()}] Trigger-based task ID ${
        savedTask.id
      } added to triggersMap`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error scheduling trigger-based task:`,
      error.message
    );
  }
}

/**
 * Executes a task by performing its defined actions and logging the execution.
 * @param {Object} task - The task object.
 * @returns {Promise<boolean>} - Returns true if execution was successful, false otherwise.
 */
async function executeTask(task) {
  try {
    console.log(`[${new Date().toISOString()}] Executing task ID ${task.id}`);

    // Validate that task.action is an array
    if (!Array.isArray(task.action)) {
      console.error(
        `[${new Date().toISOString()}] task.action is not an array for task ID ${
          task.id
        }. Execution aborted.`
      );
      return false;
    }

    // Perform MQTT actions
    for (const action of task.action) {
      if (
        !action.mqttTopic ||
        action.value === undefined ||
        action.value === null
      ) {
        console.warn(
          `[${new Date().toISOString()}] Invalid action in task ID ${task.id}:`,
          action
        );
        continue; // Skip invalid actions
      }

      console.log(
        `[${new Date().toISOString()}] Publishing to topic "${
          action.mqttTopic
        }" with value "${action.value}"`
      );
      client.publish(action.mqttTopic, action.value.toString(), (err) => {
        if (err) {
          console.error(
            `[${new Date().toISOString()}] Failed to publish to topic "${
              action.mqttTopic
            }":`,
            err.message
          );
        } else {
          console.log(
            `[${new Date().toISOString()}] Successfully published to topic "${
              action.mqttTopic
            }"`
          );
        }
      });
    }

    // Log execution in the database
    await prisma.taskExecution.create({
      data: {
        taskId: task.id,
        executedAt: new Date(), // Prisma handles date-time formatting
      },
    });

    console.log(
      `[${new Date().toISOString()}] Task ID ${task.id} executed successfully`
    );

    return true; // Indicate successful execution
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Failed to execute task ID ${task.id}:`,
      error.message
    );
    return false; // Indicate failed execution
  }
}

/**
 * Deletes a task by its ID.
 * @param {number} taskId - The ID of the task to delete.
 */
/**
 * Deletes a task by its ID.
 * @param {number} taskId - The ID of the task to delete.
 */
/**
 * Deletes a task by its ID.
 * @param {string} taskId - The ID of the task to delete.
 */
async function deleteTask(taskId) {
  try {
    // Fetch the task from the database
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      console.warn(
        `[${new Date().toISOString()}] Task ID ${taskId} does not exist.`
      );
      return; // Exit the function as there's nothing to delete
    }

    // Proceed with deletion as per task type
    // ... (rest of your deletion logic)

    // Delete related TaskExecution records before deleting the Task
    const deletedExecutions = await prisma.taskExecution.deleteMany({
      where: {
        taskId: taskId,
      },
    });

    console.log(
      `[${new Date().toISOString()}] Deleted ${
        deletedExecutions.count
      } TaskExecution record(s) for Task ID ${taskId}`
    );

    // Cancel scheduled timeouts or intervals based on task type
    if (task.taskType === "one-time") {
      const timeout = scheduledTimeouts.get(taskId);
      if (timeout) {
        clearTimeout(timeout);
        scheduledTimeouts.delete(taskId);
        console.log(
          `[${new Date().toISOString()}] Cleared timeout for one-time task ID ${taskId}`
        );
      }
    } else if (task.taskType === "repetitive") {
      const interval = scheduledIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        scheduledIntervals.delete(taskId);
        console.log(
          `[${new Date().toISOString()}] Cleared interval for repetitive task ID ${taskId}`
        );
      }
    } else if (task.taskType === "trigger-based") {
      // Remove from triggersMap
      delete triggersMap[taskId];
      console.log(
        `[${new Date().toISOString()}] Removed trigger-based task ID ${taskId} from triggersMap`
      );

      // Check if any other tasks are using the same MQTT topic
      const remainingTasks = await prisma.task.findMany({
        where: {
          triggerTopic: task.triggerTopic,
        },
      });

      if (remainingTasks.length === 0) {
        client.unsubscribe(task.triggerTopic, (err) => {
          if (err) {
            console.error(
              `[${new Date().toISOString()}] Failed to unsubscribe from topic "${
                task.triggerTopic
              }":`,
              err.message
            );
          } else {
            console.log(
              `[${new Date().toISOString()}] Unsubscribed from topic "${
                task.triggerTopic
              }"`
            );
          }
        });
      }
    }

    // Delete the task from the database
    await prisma.task.delete({
      where: { id: taskId },
    });

    console.log(
      `[${new Date().toISOString()}] Task ID ${taskId} deleted successfully`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error deleting task ID ${taskId}:`,
      error.message
    );
  }
}

/**
 * Updates a task by its ID with new data.
 * @param {number} taskId - The ID of the task to update.
 * @param {Object} updatedData - An object containing the fields to update.
 */
async function updateTask(taskId, updatedData) {
  try {
    // Fetch the existing task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      console.warn(
        `[${new Date().toISOString()}] Task ID ${taskId} does not exist.`
      );
      return;
    }

    // Delete the current scheduling
    await deleteTask(taskId);

    // Merge existing task data with updated data
    const newTaskData = { ...existingTask, ...updatedData };

    // Remove fields that shouldn't be manually set (like ID)
    delete newTaskData.id;
    delete newTaskData.executedCount;

    // Validate the updated task
    validateTask(newTaskData);

    // Reschedule the task with updated data
    await scheduleTask({ id: taskId, ...newTaskData });

    console.log(
      `[${new Date().toISOString()}] Task ID ${taskId} updated successfully`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error updating task ID ${taskId}:`,
      error.message
    );
  }
}

/**
 * Parses the condition and value from a trigger value string.
 * @param {string} value - The trigger value string.
 * @returns {Object} - An object containing the condition and the parsed value.
 */
function parseCondition(value) {
  const operators = [
    "startsWith",
    "contains",
    "matches",
    "<=",
    ">=",
    "!=",
    "<",
    ">",
    "=",
  ];
  for (const operator of operators) {
    if (value.startsWith(operator)) {
      const operand = value.slice(operator.length).trim();
      return {
        condition: operator,
        value: operand,
      };
    }
  }
  // If no operator is found, default to "="
  return {
    condition: "=",
    value: value,
  };
}

/**
 * Validates the task object to ensure all required fields are present.
 * @param {Object} task - The task object to validate.
 * @throws Will throw an error if validation fails.
 */
function validateTask(task) {
  const validConditions = [
    "<",
    ">",
    "=",
    "<=",
    ">=",
    "!=",
    "startsWith",
    "contains",
    "matches",
  ];

  if (!task.taskType) {
    throw new Error("taskType is required");
  }

  if (!task.action) {
    throw new Error("action is required");
  }

  // Ensure action is an array
  if (!Array.isArray(task.action)) {
    console.warn(
      `[${new Date().toISOString()}] task.action is not an array. It will be converted to an array.`
    );
    task.action = [task.action];
  }

  switch (task.taskType) {
    case "one-time":
    case "repetitive":
      // Existing validation for 'one-time' and 'repetitive' tasks
      break;
    case "trigger-based":
      if (!task.trigger) {
        throw new Error("trigger is required for trigger-based tasks");
      }
      if (!task.trigger.topic || !task.trigger.value) {
        throw new Error(
          "trigger must include both topic and value for trigger-based tasks"
        );
      }
      if (!task.condition) {
        // Parse condition and value from trigger.value
        const parsed = parseCondition(task.trigger.value);
        task.condition = parsed.condition;
        task.trigger.value = parsed.value;
      }
      if (!validConditions.includes(task.condition)) {
        throw new Error(`Invalid condition: ${task.condition}`);
      }
      if (task.limit === undefined || task.limit === null) {
        task.limit = UNLIMITED_LIMIT;
      }
      // Ensure limit is a positive number or UNLIMITED_LIMIT
      if (
        typeof task.limit !== "number" ||
        (task.limit <= 0 && task.limit !== UNLIMITED_LIMIT)
      ) {
        throw new Error(
          `limit must be a positive number or ${UNLIMITED_LIMIT} for unlimited executions`
        );
      }
      break;
    default:
      throw new Error(`Invalid taskType: ${task.taskType}`);
  }
}

/**
 * Executes a task by performing its defined actions and logging the execution.
 * @param {Object} task - The task object.
 * @returns {Promise<boolean>} - Returns true if execution was successful, false otherwise.
 */
async function executeTask(task) {
  try {
    console.log(`[${new Date().toISOString()}] Executing task ID ${task.id}`);

    // Validate that task.action is an array
    if (!Array.isArray(task.action)) {
      console.error(
        `[${new Date().toISOString()}] task.action is not an array for task ID ${
          task.id
        }. Execution aborted.`
      );
      return false;
    }

    // Perform MQTT actions
    for (const action of task.action) {
      if (
        !action.mqttTopic ||
        action.value === undefined ||
        action.value === null
      ) {
        console.warn(
          `[${new Date().toISOString()}] Invalid action in task ID ${task.id}:`,
          action
        );
        continue; // Skip invalid actions
      }

      console.log(
        `[${new Date().toISOString()}] Publishing to topic "${
          action.mqttTopic
        }" with value "${action.value}"`
      );
      client.publish(action.mqttTopic, action.value.toString(), (err) => {
        if (err) {
          console.error(
            `[${new Date().toISOString()}] Failed to publish to topic "${
              action.mqttTopic
            }":`,
            err.message
          );
        } else {
          console.log(
            `[${new Date().toISOString()}] Successfully published to topic "${
              action.mqttTopic
            }"`
          );
        }
      });
    }

    // Log execution in the database
    await prisma.taskExecution.create({
      data: {
        taskId: task.id,
        executedAt: new Date(), // Prisma handles date-time formatting
      },
    });

    console.log(
      `[${new Date().toISOString()}] Task ID ${task.id} executed successfully`
    );

    return true; // Indicate successful execution
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Failed to execute task ID ${task.id}:`,
      error.message
    );
    return false; // Indicate failed execution
  }
}

/**
 * Deletes a task by its ID.
 * @param {number} taskId - The ID of the task to delete.
 */
async function deleteTask(taskId) {
  try {
    // Fetch the task from the database
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      console.warn(
        `[${new Date().toISOString()}] Task ID ${taskId} does not exist.`
      );
      return;
    }

    // Cancel scheduled timeouts or intervals based on task type
    if (task.taskType === "one-time") {
      const timeout = scheduledTimeouts.get(taskId);
      if (timeout) {
        clearTimeout(timeout);
        scheduledTimeouts.delete(taskId);
        console.log(
          `[${new Date().toISOString()}] Cleared timeout for one-time task ID ${taskId}`
        );
      }
    } else if (task.taskType === "repetitive") {
      const interval = scheduledIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        scheduledIntervals.delete(taskId);
        console.log(
          `[${new Date().toISOString()}] Cleared interval for repetitive task ID ${taskId}`
        );
      }
    } else if (task.taskType === "trigger-based") {
      // Remove from triggersMap
      delete triggersMap[taskId];
      console.log(
        `[${new Date().toISOString()}] Removed trigger-based task ID ${taskId} from triggersMap`
      );

      // Optionally unsubscribe from the MQTT topic if no other tasks are using it
      const remainingTasks = await prisma.task.findMany({
        where: {
          triggerTopic: task.triggerTopic,
        },
      });

      if (remainingTasks.length === 0) {
        client.unsubscribe(task.triggerTopic, (err) => {
          if (err) {
            console.error(
              `[${new Date().toISOString()}] Failed to unsubscribe from topic "${
                task.triggerTopic
              }":`,
              err.message
            );
          } else {
            console.log(
              `[${new Date().toISOString()}] Unsubscribed from topic "${
                task.triggerTopic
              }"`
            );
          }
        });
      }
    }

    // Delete the task from the database
    await prisma.task.delete({
      where: { id: taskId },
    });

    console.log(
      `[${new Date().toISOString()}] Task ID ${taskId} deleted successfully`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error deleting task ID ${taskId}:`,
      error.message
    );
  }
}

/**
 * Updates a task by its ID with new data.
 * @param {number} taskId - The ID of the task to update.
 * @param {Object} updatedData - An object containing the fields to update.
 */
async function updateTask(taskId, updatedData) {
  try {
    // Fetch the existing task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      console.warn(
        `[${new Date().toISOString()}] Task ID ${taskId} does not exist.`
      );
      return;
    }

    // Delete the current scheduling
    await deleteTask(taskId);

    // Merge existing task data with updated data
    const newTaskData = { ...existingTask, ...updatedData };

    // Remove fields that shouldn't be manually set (like ID)
    delete newTaskData.id;
    delete newTaskData.executedCount;

    // Validate the updated task
    validateTask(newTaskData);

    // Reschedule the task with updated data
    await scheduleTask({ id: taskId, ...newTaskData });

    console.log(
      `[${new Date().toISOString()}] Task ID ${taskId} updated successfully`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error updating task ID ${taskId}:`,
      error.message
    );
  }
}

// Export the scheduleTask, deleteTask, and updateTask functions for external use
module.exports = {
  scheduleTask,
  deleteTask,
  updateTask,
  getAllTasks,
  getTaskById,
};

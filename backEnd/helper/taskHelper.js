const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883"); // Use your MQTT broker address

const triggersMap = {};

client.on("connect", () => {
  console.log("Connected to MQTT Broker");
});

client.on("message", async (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message.toString()}`);
  try {
    const tasks = await prisma.task.findMany({
      where: {
        triggerTopic: topic,
      },
    });

    console.log(`Found ${tasks.length} tasks for topic ${topic}`);

    tasks.forEach(async (task) => {
      if (
        evaluateCondition(message.toString(), task.triggerValue, task.condition)
      ) {
        console.log(`Condition met for task ID ${task.id}`);
        if (task.executedCount < task.limit || task.limit === 696969) {
          console.log(`Executing task ID ${task.id}`);
          await executeTask(task);
          // Update executed count
          await prisma.task.update({
            where: { id: task.id },
            data: { executedCount: { increment: 1 } },
          });
          console.log(`Updated executed count for task ID ${task.id}`);
        } else {
          console.log(`Task ID ${task.id} has reached execution limit`);
        }
      } else {
        console.log(`Condition not met for task ID ${task.id}`);
      }
    });
  } catch (error) {
    console.error(`Error processing message on topic ${topic}:`, error);
  }
});

function evaluateCondition(messageValue, triggerValue, condition) {
  const msgVal = parseFloat(messageValue);
  const trigVal = parseFloat(triggerValue);

  switch (condition) {
    case "<":
      return msgVal < trigVal;
    case ">":
      return msgVal > trigVal;
    case "=":
      return msgVal === trigVal;
    default:
      return msgVal === trigVal;
  }
}

async function scheduleTask(task) {
  try {
    console.log("Scheduling task:", task);
    validateTask(task);

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
        throw new Error("Invalid taskType");
    }
  } catch (error) {
    console.error("Error scheduling task:", error);
  }
}

function validateTask(task) {
  if (!task.taskType) {
    throw new Error("taskType is required");
  }

  if (!Array.isArray(task.action) || task.action.length === 0) {
    throw new Error("action is required and should be a non-empty array");
  }

  if (task.taskType === "one-time" || task.taskType === "repetitive") {
    if (!task.time) {
      throw new Error("time is required for one-time and repetitive tasks");
    }
    if (task.taskType === "repetitive" && !task.repeatTime) {
      throw new Error("repeatTime is required for repetitive tasks");
    }
  }

  if (task.taskType === "trigger-based") {
    if (!task.trigger || !task.condition || !task.limit) {
      throw new Error(
        "trigger, condition, and limit are required for trigger-based tasks"
      );
    }
  }
}

async function scheduleOneTimeTask(task) {
  try {
    console.log("Scheduling one-time task:", task);
    // Validate time is in the future
    if (task.time <= Math.floor(Date.now() / 1000)) {
      throw new Error("Time must be in the future");
    }

    // Save task to database
    const savedTask = await prisma.task.create({
      data: {
        taskType: task.taskType,
        time: task.time,
        action: task.action,
      },
    });

    console.log(`One-time task ID ${savedTask.id} saved to database`);

    // Schedule execution
    const delay = (task.time - Math.floor(Date.now() / 1000)) * 1000;
    setTimeout(() => executeTask(savedTask), delay);
  } catch (error) {
    console.error("Error scheduling one-time task:", error);
  }
}

async function scheduleRepetitiveTask(task) {
  try {
    console.log("Scheduling repetitive task:", task);
    // Validate time is in the future
    if (task.time <= Math.floor(Date.now() / 1000)) {
      throw new Error("Time must be in the future");
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

    console.log(`Repetitive task ID ${savedTask.id} saved to database`);

    // Schedule first execution
    const delay = (task.time - Math.floor(Date.now() / 1000)) * 1000;
    setTimeout(() => executeRepetitiveTask(savedTask), delay);
  } catch (error) {
    console.error("Error scheduling repetitive task:", error);
  }
}

function executeRepetitiveTask(task) {
  console.log(`Executing repetitive task ID ${task.id}`);
  executeTask(task);

  // Schedule next execution
  setInterval(() => executeTask(task), task.repeatTime * 1000);
}

async function scheduleTriggerBasedTask(task) {
  try {
    console.log("Scheduling trigger-based task:", task);
    if (!task.trigger || !task.condition || !task.limit) {
      throw new Error(
        "trigger, condition, and limit are required for trigger-based tasks"
      );
    }

    // Save task to database
    const savedTask = await prisma.task.create({
      data: {
        taskType: task.taskType,
        triggerTopic: task.trigger.topic,
        triggerValue: task.trigger.value,
        condition: task.condition,
        limit: task.limit,
        action: task.action,
      },
    });

    console.log(`Trigger-based task ID ${savedTask.id} saved to database`);

    // Subscribe to the trigger topic
    client.subscribe(task.trigger.topic);
    console.log(`Subscribed to topic ${task.trigger.topic}`);

    // Add to triggers map
    triggersMap[task.id] = savedTask;
  } catch (error) {
    console.error("Error scheduling trigger-based task:", error);
  }
}

async function executeTask(task) {
  try {
    console.log(`Executing task ID ${task.id}`);
    // Perform MQTT actions
    task.action.forEach((action) => {
      console.log(
        `Publishing to topic ${action.mqttTopic} with value ${action.value}`
      );
      client.publish(action.mqttTopic, action.value.toString());
    });

    // Log execution
    await prisma.taskExecution.create({
      data: {
        taskId: task.id,
        executedAt: new Date(), // ensure correct date time handling
      },
    });

    console.log(`Task ID ${task.id} executed successfully`);
  } catch (error) {
    console.error("Failed to execute task ID ${task.id}:", error);
    // Handle specific Prisma or database related errors
  }
}

module.exports = {
  scheduleTask,
};

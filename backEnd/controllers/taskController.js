const { PrismaClient } = require("@prisma/client");
const taskHelper = require("../helper/taskHelper");

const prisma = new PrismaClient();

const scheduleTask = async (req, res) => {
  const task = req.body.scheduleTask;
  try {
    await taskHelper.scheduleTask(task);
    res.json({ message: "Task scheduled successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTaskHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const history = await prisma.taskExecution.findMany({
      where: { taskId: id },
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({
      where: { id },
    });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  scheduleTask,
  getAllTasks,
  getTaskHistory,
  deleteTask
};
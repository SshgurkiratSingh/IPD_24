"use client";
import { Button } from "@nextui-org/button";
import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@nextui-org/table";
import {
  FaTrashAlt,
  FaPlus,
  FaClock,
  FaBolt,
  FaInfoCircle,
} from "react-icons/fa";
import { CiRepeat } from "react-icons/ci";

import { Select, SelectSection, SelectItem } from "@nextui-org/select";
import { Input } from "@nextui-org/input";

interface Action {
  mqttTopic: string;
  value: string;
}

interface Trigger {
  topic: string;
  value: string;
}

interface Task {
  id: number;
  taskType: string;
  time?: number;
  repeatTime?: number;
  action: Action[];
  trigger?: Trigger;
  condition?: string;
  limit?: number;
  executedCount?: number;
}

export default function ControlPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // State for form data
  const [formData, setFormData] = useState<Task>({
    id: 0, // Placeholder, will be ignored on the backend
    taskType: "one-time",
    action: [{ mqttTopic: "", value: "" }],
    trigger: { topic: "", value: "" },
  });

  // Helper function to convert Unix timestamp to datetime-local string
  const unixToDateTimeLocal = (unix: number | undefined): string => {
    if (!unix) return "";
    const date = new Date(unix * 1000); // Convert to milliseconds
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().slice(0, 16);
  };

  // Helper function to convert datetime-local string to Unix timestamp
  const dateTimeLocalToUnix = (dateTime: string): number => {
    const date = new Date(dateTime);
    return Math.floor(date.getTime() / 1000);
  };

  // Fetch tasks from the backend API
  useEffect(() => {
    fetch("/api/v2")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      });
  }, []);

  // Handler for deleting a task
  const handleDelete = (id: number) => {
    fetch(`/api/v2/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.ok) {
          setTasks(tasks.filter((task) => task.id !== id));
        } else {
          console.error("Failed to delete task");
        }
      })
      .catch((error) => console.error("Error deleting task:", error));
  };

  // Handler for opening the modal to create a new task
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Handler for closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset form data
    setFormData({
      id: 0,
      taskType: "one-time",
      action: [{ mqttTopic: "", value: "" }],
      trigger: { topic: "", value: "" },
    });
  };

  // Handler for form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Prepare data to send to the backend
    const data = { ...formData };
    // No need to convert time fields here as they are already in Unix timestamp

    fetch("/api/v2/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (res.ok) {
          // Refresh the task list
          return res.json();
        } else {
          throw new Error("Failed to create task");
        }
      })
      .then(() => {
        // Close the modal and refresh the task list
        handleCloseModal();
        return fetch("/api/v2")
          .then((res) => res.json())
          .then((data) => setTasks(data));
      })
      .catch((error) => console.error("Error creating task:", error));
  };

  // Handler for form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      if (name.startsWith("action")) {
        // Handle action array inputs
        const [_, indexStr, field] = name.split(".");
        const index = parseInt(indexStr, 10);
        const newAction = [...prevData.action];
        (newAction[index] as any)[field as keyof Action] = value; // Cast to any to help TypeScript
        return { ...prevData, action: newAction } as Task;
      } else if (name.startsWith("trigger")) {
        // Handle trigger inputs
        const field = name.split(".")[1];
        return {
          ...prevData,
          trigger: { ...prevData.trigger, [field]: value },
        } as Task;
      } else if (name === "time") {
        // Handle datetime-local input
        return {
          ...prevData,
          time: dateTimeLocalToUnix(value),
        } as Task;
      } else {
        return { ...prevData, [name]: value } as Task;
      }
    });
  };

  // Handler to add a new action
  const handleAddAction = () => {
    setFormData((prevData) => ({
      ...prevData,
      action: [...prevData.action, { mqttTopic: "", value: "" }],
    }));
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Control Panel</h2>
        <Button
          color="primary"
          onClick={handleOpenModal}
          startContent={<FaPlus />}
        >
          Add Task
        </Button>
      </CardHeader>
      <Divider />
      <CardBody>
        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p>No tasks available.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Type</TableColumn>
              <TableColumn>Time/Trigger</TableColumn>
              <TableColumn>Actions</TableColumn>
              <TableColumn>Options</TableColumn>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.id}</TableCell>
                  <TableCell>
                    {task.taskType === "one-time" && (
                      <FaClock className="inline mr-2" />
                    )}
                    {task.taskType === "repetitive" && (
                      <CiRepeat className="inline mr-2" />
                    )}
                    {task.taskType === "trigger-based" && (
                      <FaBolt className="inline mr-2" />
                    )}
                    {task.taskType}
                  </TableCell>
                  <TableCell>
                    {task.taskType === "trigger-based" ? (
                      <span>
                        Topic: {task.trigger?.topic}, Value:{" "}
                        {task.trigger?.value}
                      </span>
                    ) : task.time ? (
                      <span>{new Date(task.time * 1000).toLocaleString()}</span>
                    ) : (
                      <span>N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.action.map((action, index) => (
                      <div key={index}>
                        Topic: {action.mqttTopic}, Value: {action.value}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Button
                      color="danger"
                      variant="light"
                      onClick={() => handleDelete(task.id)}
                      startContent={<FaTrashAlt />}
                    >
                      Delete
                    </Button>
                    {/* Add Edit Button if needed */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardBody>
      <Divider />
      <CardFooter>{/* You can add footer content here */}</CardFooter>

      {/* Modal for creating a new task */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Create New Task</ModalHeader>
              <form onSubmit={handleSubmit}>
                <ModalBody>
                  <Select
                    label="Task Type"
                    name="taskType"
                    selectedKeys={new Set([formData.taskType])}
                    onSelectionChange={(keys) => {
                      const selectedTaskType = Array.from(keys).join("");
                      setFormData((prevData) => ({
                        ...prevData,
                        taskType: selectedTaskType,
                      }));
                    }}
                  >
                    <SelectItem key="one-time" startContent={<FaClock />}>
                      One-Time
                    </SelectItem>
                    <SelectItem key="repetitive" startContent={<CiRepeat />}>
                      Repetitive
                    </SelectItem>
                    <SelectItem key="trigger-based" startContent={<FaBolt />}>
                      Trigger-Based
                    </SelectItem>
                  </Select>

                  {/* Conditional rendering based on task type */}
                  {formData.taskType !== "trigger-based" && (
                    <Input
                      label="Time"
                      name="time"
                      type="datetime-local"
                      value={unixToDateTimeLocal(formData.time)}
                      onChange={handleInputChange}
                      required
                    />
                  )}

                  {formData.taskType === "repetitive" && (
                    <Input
                      label="Repeat Time (seconds)"
                      name="repeatTime"
                      type="number"
                      value={
                        formData.repeatTime
                          ? formData.repeatTime.toString()
                          : ""
                      }
                      onChange={handleInputChange}
                      required
                    />
                  )}

                  {formData.taskType === "trigger-based" && (
                    <>
                      <Input
                        label="Trigger Topic"
                        name="trigger.topic"
                        value={formData.trigger?.topic || ""}
                        onChange={handleInputChange}
                        required
                        startContent={
                          <FaBolt className="text-default-400 pointer-events-none flex-shrink-0" />
                        }
                      />
                      <Input
                        label="Trigger Value"
                        name="trigger.value"
                        value={formData.trigger?.value || ""}
                        onChange={handleInputChange}
                        required
                        startContent={
                          <FaInfoCircle className="text-default-400 pointer-events-none flex-shrink-0" />
                        }
                      />
                      <Input
                        label="Condition"
                        name="condition"
                        value={formData.condition || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., >, <, =, contains"
                        required
                        startContent={
                          <FaInfoCircle className="text-default-400 pointer-events-none flex-shrink-0" />
                        }
                      />
                      <Input
                        label="Execution Limit"
                        name="limit"
                        type="number"
                        value={formData.limit ? formData.limit.toString() : ""}
                        onChange={handleInputChange}
                        startContent={
                          <FaInfoCircle className="text-default-400 pointer-events-none flex-shrink-0" />
                        }
                      />
                    </>
                  )}

                  {/* Actions */}
                  <div>
                    <h3 className="font-semibold">Actions</h3>
                    {formData.action.map((action, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          label="MQTT Topic"
                          name={`action.${index}.mqttTopic`}
                          value={action.mqttTopic}
                          onChange={handleInputChange}
                          required
                          startContent={
                            <FaBolt className="text-default-400 pointer-events-none flex-shrink-0" />
                          }
                        />
                        <Input
                          label="Value"
                          name={`action.${index}.value`}
                          value={action.value}
                          onChange={handleInputChange}
                          required
                          startContent={
                            <FaInfoCircle className="text-default-400 pointer-events-none flex-shrink-0" />
                          }
                        />
                      </div>
                    ))}
                    <Button
                      variant="light"
                      onClick={handleAddAction}
                      startContent={<FaPlus />}
                    >
                      Add Action
                    </Button>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="light"
                    onClick={handleCloseModal}
                    startContent={<FaTrashAlt />}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    startContent={<FaPlus />}
                  >
                    Create Task
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  );
}

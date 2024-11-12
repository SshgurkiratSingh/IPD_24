"use client";
import { Button } from "@nextui-org/button";
import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import React, { useState, ChangeEvent, FormEvent, useRef, useCallback, lazy, Suspense } from "react";
import { useTasksData } from "../hooks/useTasksData";
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
import { FaTrashAlt, FaPlus, FaExclamationTriangle } from "react-icons/fa";
import { CiRepeat } from "react-icons/ci";

import { Select, SelectSection, SelectItem } from "@nextui-org/select";
import { Input } from "@nextui-org/input";
import { Skeleton } from "@nextui-org/skeleton";
import { useVirtualizer } from '@tanstack/react-virtual';
import { Spinner } from "@nextui-org/spinner";

const FaClock = lazy(() => import('react-icons/fa').then(module => ({ default: module.FaClock })));
const FaBolt = lazy(() => import('react-icons/fa').then(module => ({ default: module.FaBolt })));
const FaInfoCircle = lazy(() => import('react-icons/fa').then(module => ({ default: module.FaInfoCircle })));

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
  const { tasks, isLoading, error, mutate } = useTasksData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // State for form data
  const [formData, setFormData] = useState<Task>({
    id: 0, // Placeholder, will be ignored on the backend
    taskType: "one-time",
    action: [{ mqttTopic: "", value: "" }],
    trigger: { topic: "", value: "" },
  });

  // Add a callback for SWR to track background refreshes
  const onSuccess = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    mutate().then(onSuccess);
  }, [mutate, onSuccess]);

  // Refresh data every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

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

  if (error) {
    console.error("Error fetching tasks:", error);
  }

  // Handler for deleting a task
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const handleDelete = (id: number) => {
    setDeleteError(null);
    fetch(`/api/v2/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.ok) {
          mutate(); // Trigger a re-fetch of the tasks
        } else {
          throw new Error("Failed to delete task");
        }
      })
      .catch((error) => {
        console.error("Error deleting task:", error);
        setDeleteError("Failed to delete task. Please try again.");
      });
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

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
        mutate(); // Trigger a re-fetch of the tasks
      })
      .catch((error) => {
        console.error("Error creating task:", error);
        setSubmitError("Failed to create task. Please try again.");
      });
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Control Panel</h2>
        <div className="flex items-center">
          {isRefreshing && <Spinner size="sm" color="primary" className="mr-2" />}
          <Button
            color="primary"
            onClick={handleOpenModal}
            startContent={<FaPlus />}
          >
            Add Task
          </Button>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="overflow-hidden">
        {isLoading ? (
          <div>
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-12 w-full mb-2" />
            ))}
          </div>
        ) : error ? (
          <div className="text-danger flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <span>Error loading tasks. Please try again later.</span>
          </div>
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
              {useVirtualizer({
                count: tasks.length,
                getScrollElement: () => document.querySelector('.nextui-table-body'),
                estimateSize: useCallback(() => 50, []),
                overscan: 5,
              }).getVirtualItems().map((virtualRow) => {
                const task = tasks[virtualRow.index];
                return (
                  <TableRow key={task.id}>
                    <TableCell>{task.id}</TableCell>
                    <TableCell>
                      <Suspense fallback={<Spinner size="sm" />}>
                        {task.taskType === "one-time" && (
                          <FaClock className="inline mr-2" />
                        )}
                        {task.taskType === "repetitive" && (
                          <CiRepeat className="inline mr-2" />
                        )}
                        {task.taskType === "trigger-based" && (
                          <FaBolt className="inline mr-2" />
                        )}
                      </Suspense>
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardBody>
      <Divider />
      <CardFooter>
        {deleteError && (
          <div className="text-danger flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <span>{deleteError}</span>
          </div>
        )}
      </CardFooter>

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
                          <Suspense fallback={<Spinner size="sm" />}>
                            <FaBolt className="text-default-400 pointer-events-none flex-shrink-0" />
                          </Suspense>
                        }
                      />
                      <Input
                        label="Trigger Value"
                        name="trigger.value"
                        value={formData.trigger?.value || ""}
                        onChange={handleInputChange}
                        required
                        startContent={
                          <Suspense fallback={<Spinner size="sm" />}>
                            <FaInfoCircle className="text-default-400 pointer-events-none flex-shrink-0" />
                          </Suspense>
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
                  {submitError && (
                    <div className="text-danger flex items-center mb-2">
                      <FaExclamationTriangle className="mr-2" />
                      <span>{submitError}</span>
                    </div>
                  )}
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

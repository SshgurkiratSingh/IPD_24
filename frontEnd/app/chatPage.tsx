"use client";
import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import { CiUser } from "react-icons/ci";
import { AiOutlineRobot } from "react-icons/ai";

import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { BsInfoCircle } from "react-icons/bs";
import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/breadcrumbs";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Input } from "@nextui-org/input";
import { Tooltip } from "@nextui-org/tooltip";
import { Avatar } from "@nextui-org/avatar";
import { Badge } from "@nextui-org/badge";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { Listbox, ListboxItem } from "@nextui-org/listbox";
import { MdSchedule, MdUpdate } from "react-icons/md";

// Initialize SpeechRecognition (Assuming it's used elsewhere)

interface ChatMessage {
  type: "user" | "assistant";
  text: string;
  data?: AssistantData;
}

interface AssistantData {
  reply: string;
  update: any[];
  contextNeed: any[];
  suggestedQuestions: string[];
  scheduleTask: any;
}

interface Action {
  mqttTopic: string;
  value: string;
}

const suggestedQuestions = [
  "Turn on the light in room",
  "Tell me about temperature and humidity in room",
  "When PIR gets activated in room, turn on the lights",
  "What can you do",
  "Schedule turning off lawn light everyday at 7am",
  "Schedule turning on lawn light everyday at 7pm",
  "Which song is playing",
  "Change the song",
  "Turn off hall TV after 5 minutes",
  "Turn off music after half an hour",
  "What's the current temperature in the living room?",
  "Set bedroom lights to 50% brightness",
  "Lock all doors",
  "Open the garage door",
  "turn on room switchboard",
  "Turn on fan for 2 hours in hall",
  "Is front door locked?",
  "Turn off all lights in home except lawn",
  "start playing song",
];

const getRandomQuestions = (questions: string[]) => {
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
};

const ChatPage: React.FC = () => {
  const [userInput, setUserInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [randomQuestions, setRandomQuestions] = useState<string[]>([]); // New state for random questions
  useEffect(() => {
    setRandomQuestions(getRandomQuestions(suggestedQuestions));
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage.type === "assistant") {
        const utterance = new SpeechSynthesisUtterance(
          lastMessage.data?.reply || lastMessage.text
        );
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [chatHistory]);

  const handleUserInput = (e: ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim()) {
      return;
    }

    const newMessage: ChatMessage = {
      type: "user",
      text: userInput,
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      // Prepare conversation history for the API
      const historyForAPI = chatHistory.map((msg) => ({
        role: msg.type === "user" ? "user" : "assistant",
        content:
          msg.type === "user" ? msg.text : msg.data ? msg.data.reply : msg.text,
      }));

      const response = await fetch("http://192.168.1.100:2500/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: newMessage.text,
          history: historyForAPI.slice(-5),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantData = data.reply;

        const assistantMessage: ChatMessage = {
          type: "assistant",
          text: assistantData.reply,
          data: assistantData,
        };

        setChatHistory((prev) => [...prev, assistantMessage]);
      } else {
        console.error("Error from API:", data.error);
        const assistantMessage: ChatMessage = {
          type: "assistant",
          text: "An error occurred. Please try again later.",
        };
        setChatHistory((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const assistantMessage: ChatMessage = {
        type: "assistant",
        text: "An error occurred. Please try again later.",
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleSuggestedQuestionClick = (question: string) => {
    setUserInput(question);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  return (
    <div className="w-full flex flex-col">
      <Card className="flex flex-col flex-1 p-4 text-white">
        <CardHeader className="text-2xl font-bold text-gray-300 neon-text">
          <Breadcrumbs>
            <BreadcrumbItem>
              <span>Home</span>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrent>
              <span>Chat Assistant</span>
            </BreadcrumbItem>
          </Breadcrumbs>
        </CardHeader>
        <Divider className="neon-divider" />
        <CardBody className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto mb-4 pr-2">
            {chatHistory.length === 0 ? (
              <div className="mt-4">
                <p className="font-bold text-lg">Try asking:</p>
                <div className="flex flex-wrap mt-2">
                  {randomQuestions.map((question, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant="flat"
                      className="m-1 bg-blue-600 hover:bg-blue-700 hover:animate-bounce gradient-text2"
                      onClick={() => handleSuggestedQuestionClick(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  } my-2`}
                >
                  {message.type === "assistant" && (
                    <Avatar
                      icon={<AiOutlineRobot />}
                      className="mr-2 bg-blue-600"
                    />
                  )}
                  <div
                    className={`max-w-full sm:max-w-md px-4 py-2 rounded-xl shadow ${
                      message.type === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-800 text-white rounded-bl-none"
                    }`}
                  >
                    {message.type === "user" ? (
                      <p>{message.text}</p>
                    ) : (
                      <div>
                        {/* Render assistant's reply with markdown support */}
                        <ReactMarkdown>
                          {message.data?.reply || message.text}
                        </ReactMarkdown>

                        {/* Display Updates */}
                        {message.data?.update &&
                          message.data.update.length > 0 && (
                            <Accordion className="mt-4">
                              <AccordionItem
                                title={
                                  <div className="flex items-center gradient-text">
                                    <MdUpdate className="mr-2" />
                                    <span className="font-semibold">
                                      Updates
                                    </span>
                                  </div>
                                }
                              >
                                <Listbox className="mt-2">
                                  {message.data.update.map((update, idx) => (
                                    <ListboxItem key={idx}>
                                      <div className="flex items-center">
                                        <div>
                                          <p className="font-medium">
                                            {update.topic}
                                          </p>
                                          <p className="text-sm text-gray-400">
                                            Value: {update.value}
                                          </p>
                                        </div>
                                      </div>
                                    </ListboxItem>
                                  ))}
                                </Listbox>
                              </AccordionItem>
                            </Accordion>
                          )}

                        {/* Display Context Needed */}
                        {message.data?.contextNeed &&
                          message.data.contextNeed.length > 0 && (
                            <div className="mt-4">
                              <p className="font-bold flex items-center">
                                Context Needed
                                <Tooltip content="Additional permissions required">
                                  <BsInfoCircle className="ml-1 text-gray-500" />
                                </Tooltip>
                              </p>
                              <div className="flex flex-wrap mt-2">
                                {message.data.contextNeed.map((topic, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="flat"
                                    color="warning"
                                    className="m-1"
                                  >
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Display Scheduled Tasks */}
                        {message.data?.scheduleTask &&
                          Object.keys(message.data.scheduleTask).length > 0 && (
                            <Accordion className="mt-4">
                              <AccordionItem
                                title={
                                  <div className="flex items-center">
                                    <MdSchedule className="mr-2" />
                                    <span className="font-semibold animate-gradient-flow">
                                      Scheduled Task
                                    </span>
                                  </div>
                                }
                              >
                                <div className="p-4 rounded mt-2 bg-gray-900">
                                  <div className="mb-2">
                                    <p className="text-lg font-semibold">
                                      Task Details
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    <div>
                                      <p className="font-medium">Task Type:</p>
                                      <p>
                                        {message.data.scheduleTask.taskType}
                                      </p>
                                    </div>
                                    {message.data.scheduleTask.time && (
                                      <div>
                                        <p className="font-medium">Time:</p>
                                        <p>
                                          {new Date(
                                            message.data.scheduleTask.time *
                                              1000
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                    )}
                                    {message.data.scheduleTask.trigger && (
                                      <div>
                                        <p className="font-medium">Trigger:</p>
                                        <p>
                                          Topic:{" "}
                                          {
                                            message.data.scheduleTask.trigger
                                              .topic
                                          }
                                          , Value:{" "}
                                          {
                                            message.data.scheduleTask.trigger
                                              .value
                                          }
                                        </p>
                                      </div>
                                    )}
                                    {message.data.scheduleTask.repeatTime && (
                                      <div>
                                        <p className="font-medium">
                                          Repeat Every:
                                        </p>
                                        <p>
                                          {message.data.scheduleTask.repeatTime}{" "}
                                          seconds
                                        </p>
                                      </div>
                                    )}
                                    {message.data.scheduleTask.limit && (
                                      <div>
                                        <p className="font-medium">Limit:</p>
                                        <p>
                                          {message.data.scheduleTask.limit ===
                                          696969
                                            ? "Infinite"
                                            : message.data.scheduleTask.limit}
                                        </p>
                                      </div>
                                    )}
                                    {message.data.scheduleTask.action && (
                                      <div>
                                        <p className="font-medium">Actions:</p>
                                        <Listbox className="mt-2">
                                          {message.data.scheduleTask.action.map(
                                            (
                                              actionItem: Action,
                                              idx: number
                                            ) => (
                                              <ListboxItem key={idx}>
                                                <div className="flex items-center">
                                                  <div>
                                                    <p className="font-medium">
                                                      Topic:{" "}
                                                      {actionItem.mqttTopic}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                      Value: {actionItem.value}
                                                    </p>
                                                  </div>
                                                </div>
                                              </ListboxItem>
                                            )
                                          )}
                                        </Listbox>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </AccordionItem>
                            </Accordion>
                          )}

                        {/* Display Suggested Questions */}
                        {message.data?.suggestedQuestions &&
                          message.data.suggestedQuestions.length > 0 && (
                            <div className="mt-4">
                              <p className="font-bold flex items-center">
                                Suggested Questions
                              </p>
                              <div className="flex flex-wrap mt-2">
                                {message.data.suggestedQuestions.map(
                                  (question, idx) => (
                                    <Button
                                      key={idx}
                                      size="sm"
                                      variant="flat"
                                      className="m-1 bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={() =>
                                        handleSuggestedQuestionClick(question)
                                      }
                                    >
                                      {question}
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                    {message.type === "user" && (
                      <Avatar icon={<CiUser />} className="ml-2 bg-blue-600" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex items-center">
            <Input
              placeholder="Type your message..."
              size="lg"
              value={userInput}
              onChange={handleUserInput}
              fullWidth
              className="text-white"
              color="primary"
            />

            <Button
              type="submit"
              isLoading={isLoading}
              isDisabled={isLoading || !userInput.trim()}
              className="ml-2 bg-blue-600 hover:bg-blue-700"
            >
              Send
            </Button>
          </form>
        </CardBody>
        <CardFooter>
          <Button
            variant="shadow"
            color="secondary"
            className={`${chatHistory.length > 0 ? "" : "hidden"}`}
            onClick={() => {
              setChatHistory([]);
            }}
          >
            Clear Chat
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatPage;

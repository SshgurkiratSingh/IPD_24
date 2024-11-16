"use client";
import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import { CiUser } from "react-icons/ci";
import { AiOutlineRobot } from "react-icons/ai";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa"; // Import microphone icons

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
import ChatHeader from "@/components/ChatHeader";

// **Import the ChatMessage Component**
import ChatMessage from "@/components/ChatMessage";
import SuggestedQuestions from "@/components/SuggestedQuestions";

// Define SpeechRecognition type for TypeScript
const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || (window as any).webkitSpeechRecognition);

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
  "Notify me about temperature and humidity in room",
  "Tell me about temperature and humidity in room",
  "When PIR gets activated in room, turn on the lights",
  "What can you do",
  "Schedule turning off lawn light everyday at 7am",
  "Schedule turning on lawn light everyday at 7pm",
  "Which song is playing",
  "Change the song",
  "Alert when PIR gets 1",
  "Turn off hall TV after 5 minutes",
  "Turn off music after half an hour",
  "What's the current temperature in the living room?",
  "Set bedroom lights to 50% brightness",
  "Open the garage door",
  "Turn on room switchboard",
  "Is everything off in room?",
  "Turn off all lights in home except lawn",
  "Start playing song",
];

const getRandomQuestions = (questions: string[]) => {
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
};

const ChatPage: React.FC = () => {
  const [userInput, setUserInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [randomQuestions, setRandomQuestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false); // New state for listening
  const recognitionRef = useRef<any>(null); // Ref to hold the SpeechRecognition instance

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

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setUserInput((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API is not supported in this browser.");
    }
  }, []);

  const handleUserInput = (e: ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  const handleVoiceInput = () => {
    if (!SpeechRecognition) {
      alert("Sorry, your browser does not support speech recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
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

      const response = await fetch("/api/v1/chat", {
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
        <ChatHeader />
        <Divider className="neon-divider" />
        <CardBody className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto mb-4 pr-2">
            {chatHistory.length === 0 ? (
              <div className="mt-4">
                <div className="flex flex-wrap mt-2">
                  <SuggestedQuestions
                    questions={randomQuestions}
                    onQuestionClick={handleSuggestedQuestionClick}
                  />
                </div>
              </div>
            ) : (
              // **Replace Inline Rendering with ChatMessage Component**
              chatHistory.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  onSuggestedQuestionClick={handleSuggestedQuestionClick}
                />
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

            {/* Voice Input Button */}
            <Button
              type="button"
              onClick={handleVoiceInput}
              className="ml-2 bg-green-600 hover:bg-green-700 flex items-center justify-center"
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
            >
              {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </Button>

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

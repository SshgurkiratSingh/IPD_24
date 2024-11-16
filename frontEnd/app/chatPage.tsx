"use client";
import React, {
  useState,
  ChangeEvent,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";
import { Input } from "@nextui-org/input";
import ChatHeader from "@/components/ChatHeader";

// Import the ChatMessage Component
import ChatMessage from "@/components/ChatMessage";
import SuggestedQuestions from "@/components/SuggestedQuestions";
import LoadV1 from "@/components/loader";

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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(false); // New state for voice mode
  const [liveTranscript, setLiveTranscript] = useState<string>(""); // Live transcript state
  const recognitionRef = useRef<any>(null);

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
  const handleVoiceInputSubmit = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) {
        return;
      }

      const newMessage: ChatMessage = {
        type: "user",
        text: transcript.trim(),
      };

      setChatHistory((prev) => [...prev, newMessage]);
      setIsLoading(true);
      setLiveTranscript("");

      try {
        // Prepare conversation history for the API
        const historyForAPI = [...chatHistory, newMessage].map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content:
            msg.type === "user"
              ? msg.text
              : msg.data
                ? msg.data.reply
                : msg.text,
        }));

        const response = await fetch("/api/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userMessage: newMessage.text,
            history: historyForAPI.slice(-2),
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
          setLiveTranscript(assistantData.reply);
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
    },
    [chatHistory]
  );
  // Initialize Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setLiveTranscript(finalTranscript + interimTranscript);

        if (finalTranscript) {
          handleVoiceInputSubmit(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setIsVoiceMode(false);
      };

      recognition.onend = () => {
        if (isVoiceMode) {
          recognition.start(); // Restart recognition for continuous listening
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API is not supported in this browser.");
    }
  }, [isVoiceMode, handleVoiceInputSubmit]);

  const handleUserInput = (e: ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  // Function to handle voice mode activation
  const handleVoiceMode = () => {
    if (!SpeechRecognition) {
      alert("Sorry, your browser does not support speech recognition.");
      return;
    }
    setIsVoiceMode(true);
    setIsListening(true);
    setLiveTranscript("");
    recognitionRef.current.start();
  };

  // Function to end voice mode
  const endVoiceMode = () => {
    recognitionRef.current.stop();
    setIsVoiceMode(false);
    setIsListening(false);
    setLiveTranscript("");
  };

  // Handle the submission of voice input

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim()) {
      return;
    }

    const newMessage: ChatMessage = {
      type: "user",
      text: userInput.trim(),
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      // Prepare conversation history for the API
      const historyForAPI = [...chatHistory, newMessage].map((msg) => ({
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
        {/* Header with Voice Mode Activation Button */}
        <CardHeader className="flex items-center justify-between">
          <ChatHeader />
        </CardHeader>
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

          {/* Input Area */}
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
              scrollToBottom();
              setUserInput("");
              setIsLoading(false);
              setRandomQuestions(getRandomQuestions(suggestedQuestions));
              setIsVoiceMode(false);
              setIsListening(false);
              setLiveTranscript("");

              recognitionRef.current.stop();
            }}
          >
            Clear Chat
          </Button>
          <Button
            onClick={handleVoiceMode}
            className="bg-blue-600 hover:bg-blue-700 flex items-center"
          >
            <FaMicrophone className="mr-2" />
            Voice Mode
          </Button>
        </CardFooter>
      </Card>

      {/* Voice Mode Overlay */}
      {isVoiceMode && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
          {/* Animation (you can replace this with any animation you like) */}
          <div className="mb-8">
            {/* Simple pulsating circle animation */}
            {/* <div className="w-24 h-24 rounded-full bg-blue-500 animate-pulse"></div> */}
            <LoadV1 />
          </div>

          {/* Live Transcript */}
          <div className="gradient-text4 text-2xl text-center px-4">
            {liveTranscript || "Listening..."}
          </div>

          {/* End Conversation Button */}
          <Button
            onClick={endVoiceMode}
            className="mt-8 bg-red-600 hover:bg-red-700 flex items-center"
          >
            <FaMicrophoneSlash className="mr-2" />
            End Conversation
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatPage;

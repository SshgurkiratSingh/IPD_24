"use client";

import React, { useState } from "react";
import {
  Card,
  Button,
  Textarea,
  Select,
  SelectItem,
  CardBody,
} from "@nextui-org/react";
import axios from "axios";

interface ChatHistoryEntry {
  role: "user" | "assistant";
  parts: Array<{ text: string }>;
}

export default function VideoCamFeed(): JSX.Element {
  const [selectedStream, setSelectedStream] = useState<string>("door");
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Define available streams
  const availableStreams: { name: string; endpoint: string }[] = [
    { name: "Door", endpoint: "door" },
    { name: "Garage", endpoint: "garage" },
    { name: "Lawn", endpoint: "lawn" },
    // Add more streams if needed
  ];

  const handleSend = async (): Promise<void> => {
    if (userQuestion.trim() === "") return;

    setLoading(true);

    try {
      const response = await axios.post<{ response: string }>(
        "http://localhost:2500/api/v4/chat",
        {
          imageName: `${selectedStream}.mp4`,
          userQuestion,
          history: chatHistory,
        }
      );

      const assistantResponse: string = response.data.response;

      // Update chat history
      setChatHistory([
        ...chatHistory,
        { role: "user", parts: [{ text: userQuestion }] },
        { role: "assistant", parts: [{ text: assistantResponse }] },
      ]);

      setUserQuestion("");
    } catch (error) {
      console.error("Error:", error);
      // Optionally, you can set an error state here to display to the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardBody>
          <div className="flex flex-col space-y-4">
            {/* Stream Selection */}
            <Select
              label="Select Stream"
              placeholder="Choose a stream"
              selectedKeys={new Set([selectedStream])}
              onSelectionChange={(keys) =>
                setSelectedStream(Array.from(keys)[0] as string)
              }
            >
              {availableStreams.map((stream) => (
                <SelectItem key={stream.endpoint} value={stream.endpoint}>
                  {stream.name}
                </SelectItem>
              ))}
            </Select>

            {/* Display Live Stream */}
            <div className="w-full h-auto border rounded">
              <img
                src={`http://localhost:5000/${selectedStream}`}
                alt={`${selectedStream} Stream`}
                className="w-full h-auto"
              />
            </div>

            {/* User Question Input */}
            <Textarea
              label="Your Question"
              placeholder="Ask something about the stream..."
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
            />

            {/* Send Button */}
            <Button onClick={handleSend} isLoading={loading}>
              Send
            </Button>

            {/* Chat History */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Chat History</h3>
              <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                {chatHistory.map((entry, index) => (
                  <div key={index}>
                    <p
                      className={`${
                        entry.role === "user"
                          ? "text-blue-600"
                          : "text-green-600"
                      }`}
                    >
                      <strong>
                        {entry.role === "user" ? "You" : "Assistant"}:
                      </strong>{" "}
                      {entry.parts[0].text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

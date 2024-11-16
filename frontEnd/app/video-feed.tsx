"use client";
import React, { useState } from "react";
import {
  Card,
  Button,
  Input,
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

export default function VideoFeed(): JSX.Element {
  const [selectedImage, setSelectedImage] = useState<string>("hall1.png");
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const sampleImages: string[] = [
    "door1.png",
    "garage1.png",
    "hall1.png",
    "hall2.png",
    "hall3.png",
    "lawn1.png",
    "room1.png",
    "room2.png",
  ];

  const handleSend = async (): Promise<void> => {
    if (userQuestion.trim() === "") return;

    setLoading(true);

    try {
      const response = await axios.post<{ response: string }>(
        "http://localhost:2500/api/v4/chat",
        {
          imageName: selectedImage,
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
      // Handle error appropriately in your app
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardBody>
          <div className="flex flex-col space-y-4">
            {/* Image Selection */}
            <Select
              label="Select Image"
              placeholder="Choose an image"
              selectedKeys={new Set([selectedImage])}
              onSelectionChange={(keys) =>
                setSelectedImage(Array.from(keys)[0])
              }
            >
              {sampleImages.map((image) => (
                <SelectItem key={image}>{image}</SelectItem>
              ))}
            </Select>

            {/* Display Selected Image */}
            <img
              src={`https://ipd-24.vercel.app/${selectedImage}`}
              alt="Selected CCTV"
              className="w-full h-auto border rounded"
            />

            {/* User Question Input */}
            <Textarea
              label="Your Question"
              placeholder="Ask something about the image..."
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

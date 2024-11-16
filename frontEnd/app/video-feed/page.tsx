// VideoFeed.tsx

"use client";
import React, { useState } from "react";

import axios from "axios";
import { Select, SelectItem } from "@nextui-org/select";
import { Textarea } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import {
  FaRegFolder,
  FaRegFolderOpen,
  FaPaperPlane,
  FaImage,
  FaQuestion,
  FaRobot,
  FaUser,
} from "react-icons/fa";

export interface ObjectIdentification {
  type: string; // Type of object (e.g., person, vehicle, animal)
  count: string; // Number of this type observed
  details: string; // Additional details
}

export interface BehaviorAnalysis {
  description: string; // Detail of any unusual or suspicious behavior
  severity: string; // Severity level (e.g., low, medium, high)
}

export interface PotentialConcerns {
  type: string; // Type of concern (e.g., safety, security)
  description: string; // Specific description of the concern
}

export interface AdditionalInsights {
  insight: string; // Additional interpretations or strategic assessments
  impact: string; // Potential impact or significance of the insight
}

export interface ChatResponse {
  type: string;
  room_context: string;
  scene_overview: string;
  user_query_response: string;
  object_identification: ObjectIdentification[];
  behavior_analysis: BehaviorAnalysis[];
  potential_concerns: PotentialConcerns[];
  additional_insights: AdditionalInsights[];
  summary: string;
}

export interface ChatHistoryEntry {
  role: "user" | "assistant";
  content: string | ChatResponse;
}

export default function VideoFeed(): JSX.Element {
  const [selectedImage, setSelectedImage] = useState<string>("hall1.png");
  const [userQuestion, setUserQuestion] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const sampleImages: string[] = [
    "room2.png",
    "room1.png",
    "lawn1.png",
    "hall3.png",
    "hall2.png",
    "hall1.png",
    "garage1.png",
    "door1.png",
  ];

  const handleSend = async (): Promise<void> => {
    if (userQuestion.trim() === "") return;

    setLoading(true);

    try {
      const response = await axios.post<ChatResponse>("/api/v4/chat", {
        imageName: selectedImage,
        userQuestion,
      });

      const assistantResponse: ChatResponse = response.data;

      // Update chat history with latest message at the top
      setChatHistory((prevHistory) => [
        { role: "user", content: userQuestion },
        { role: "assistant", content: assistantResponse },
        ...prevHistory,
      ]);

      setUserQuestion("");
    } catch (error) {
      console.error("Error:", error);
      // Handle error appropriately in your app, e.g., show a notification
    } finally {
      setLoading(false);
    }
  };

  // Helper component to render assistant responses using Expandable Cards
  const renderAssistantResponse = (response: ChatResponse) => (
    <div className="space-y-4">
      {/* Render user_query_response outside of Cards */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold">Your Question Response</h2>
          <p>{response.user_query_response}</p>
        </CardBody>
      </Card>

      {/* Render each section as an Expandable Card */}
      <ExpandableCard title="Scene Overview">
        <p>{response.scene_overview}</p>
      </ExpandableCard>

      <ExpandableCard title="Object Identification">
        <ul className="list-disc list-inside">
          {response.object_identification.map((obj, idx) => (
            <li key={idx}>
              <strong>{obj.type}</strong>: {obj.count} observed. Details:{" "}
              {obj.details}
            </li>
          ))}
        </ul>
      </ExpandableCard>

      <ExpandableCard title="Behavior Analysis">
        <ul className="list-disc list-inside">
          {response.behavior_analysis.map((beh, idx) => (
            <li key={idx}>
              <strong>Description:</strong> {beh.description} |{" "}
              <strong>Severity:</strong> {beh.severity}
            </li>
          ))}
        </ul>
      </ExpandableCard>

      <ExpandableCard title="Potential Concerns">
        <ul className="list-disc list-inside">
          {response.potential_concerns.map((concern, idx) => (
            <li key={idx}>
              <strong>Type:</strong> {concern.type} |{" "}
              <strong>Description:</strong> {concern.description}
            </li>
          ))}
        </ul>
      </ExpandableCard>

      <ExpandableCard title="Additional Insights">
        <ul className="list-disc list-inside">
          {response.additional_insights.map((insight, idx) => (
            <li key={idx}>
              <strong>Insight:</strong> {insight.insight} |{" "}
              <strong>Impact:</strong> {insight.impact}
            </li>
          ))}
        </ul>
      </ExpandableCard>

      <ExpandableCard title="Summary">
        <p>{response.summary}</p>
      </ExpandableCard>
    </div>
  );

  // ExpandableCard Component
  interface ExpandableCardProps {
    title: string;
    children: React.ReactNode;
  }

  const ExpandableCard: React.FC<ExpandableCardProps> = ({
    title,
    children,
  }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const toggleOpen = () => {
      setIsOpen((prev) => !prev);
    };

    return (
      <Card>
        <CardHeader
          className="flex justify-between items-center cursor-pointer"
          onClick={toggleOpen}
        >
          <h3 className="font-semibold">{title}</h3>
          {isOpen ? (
            <FaRegFolderOpen className="h-5 w-5 text-gray-500" />
          ) : (
            <FaRegFolder className="h-5 w-5 text-gray-500" />
          )}
        </CardHeader>
        {isOpen && <CardBody>{children}</CardBody>}
      </Card>
    );
  };

  return (
    <div className="w-full h-screen flex flex-row">
      {/* Left Panel: Image Selection and Display */}
      <div className="w-full md:w-1/2 lg:w-2/5 p-4 flex flex-col space-y-4 overflow-y-auto">
        <div>
          <Select
            label="Select Image"
            startContent={<FaImage className="text-default-400" />}
            placeholder="Choose an image"
            selectedKeys={new Set([selectedImage])}
            onSelectionChange={(keys) =>
              setSelectedImage(Array.from(keys)[0] as string)
            }
            fullWidth
          >
            {sampleImages.map((image) => (
              <SelectItem key={image}>{image}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex-grow">
          <img
            src={`https://ipd-24.vercel.app/${selectedImage}`}
            alt="Selected CCTV"
            className="w-full h-auto border rounded shadow-md"
          />
        </div>
      </div>

      {/* Right Panel: Chat History and User Input */}
      <div className="w-full md:w-1/2 lg:w-3/5 p-4 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-end">
          <Textarea
            label="Your Question"
            placeholder="Ask something about the image..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            fullWidth
            rows={3}
          />
          <Button
            onClick={handleSend}
            isLoading={loading}
            disabled={loading}
            className="mt-2 md:mt-0 md:ml-4 self-end"
            endContent={<FaPaperPlane className="h-4 w-4" />}
          >
            Send
          </Button>
        </div>
        {/* Chat History */}
        <div className="flex-grow overflow-y-auto mb-4">
          <h3 className="text-2xl font-semibold mb-4 gradient-text3">
            Chat History
          </h3>
          <div className="space-y-4">
            {chatHistory.map((entry, index) => (
              <div key={index}>
                {entry.role === "user" ? (
                  <Card className="">
                    <CardBody>
                      <h1 className="text-primary font-medium flex items-center gap-2">
                        <FaUser className="h-4 w-4" />
                        {typeof entry.content === "string" ? (
                          <p>{entry.content}</p>
                        ) : (
                          JSON.stringify(entry.content)
                        )}
                      </h1>
                    </CardBody>
                  </Card>
                ) : (
                  <Card className="">
                    <CardBody>
                      <h1 className="text-success font-semibold flex items-center gap-2">
                        <FaRobot className="h-4 w-4" />
                        <strong>Assistant:</strong>
                      </h1>
                      {typeof entry.content === "string" ? (
                        <p>{entry.content}</p>
                      ) : (
                        renderAssistantResponse(entry.content)
                      )}
                    </CardBody>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Input */}
      </div>
    </div>
  );
}

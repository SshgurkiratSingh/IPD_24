"use client";

import React, { useState } from "react";
import { Card, Button, Select, SelectItem, CardBody } from "@nextui-org/react";

export default function VideoCamFeed(): JSX.Element {
  const [selectedStream, setSelectedStream] = useState<string>("door");

  // Define available streams
  const availableStreams: { name: string; endpoint: string }[] = [
    { name: "Room ", endpoint: "door" },
    { name: "Garage", endpoint: "garage" },
    { name: "Hall ", endpoint: "lawn" },
    // Add more streams if needed
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-1/3 h-1/3">
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
            <div className="w-full  border rounded h-1/3">
              <iframe
                src={`/api/v5/stream/${selectedStream}`}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

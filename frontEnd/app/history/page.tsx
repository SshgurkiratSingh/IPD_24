"use client";
import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@nextui-org/table";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Select, SelectSection, SelectItem } from "@nextui-org/select";
import { Button } from "@nextui-org/button";
import { Divider } from "@nextui-org/divider";

interface HistoryEntry {
  timestamp: string;
  value: string | number;
}

interface GroupedTopics {
  [key: string]: string[];
}

export default function App() {
  const [topic, setTopic] = useState<string>("room/temperature");
  const [data, setData] = useState<HistoryEntry[]>([]);

  const topicOptions: string[] = [
    // Room Topics
    "room/temperature",
    "room/humidity", 
    "room/light",
    "room/fan",
    "room/brightness",
    "room/switchboard",
    "room/pir",
    "room/alert",

    // Hall Topics
    "hall/temperature",
    "hall/humidity",
    "hall/light1",
    "hall/ambientLight",
    "hall/fan",
    "hall/brightness",
    "hall/oled",
    "hall/tv",
    "hall/gas",
    "hall/switchboard",
    "hall/alert",

    // Water Tank Topics
    "waterTank/waterLevel",
    "waterTank/ph",
    "waterTank/turbidity",

    // Lawn Topics
    "lawn/light1",
    "lawn/light2",
    "lawn/light3",
    "lawn/light4",
    "lawn/ultrasonic1",
    "lawn/ultrasonic2",
    "lawn/lightIntensity",
    "lawn/autonomousLighting",

    // Home Garden Topics
    "homeGarden/rainSensor",
    "homeGarden/soilMoisture",
    "homeGarden/pumpStatus",
    "homeGarden/gateStatus",

    // Dustbin Topics
    "dustbin/fullStatus",

    // Garage Topics
    "garage/light1",
    "garage/doorStatus",
    "garage/pir1",
    "garage/alert",

    // Multimedia Topics
    "c/Artist",
    "c/Song",
  ];

  const fetchData = async (): Promise<void> => {
    try {
      const params = new URLSearchParams({
        topic
      });

      const response = await fetch(`/api/v3/history?${params.toString()}`);
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // Function to group topics by category
  const groupedTopics: GroupedTopics = {
    Room: topicOptions.filter((t) => t.startsWith("room/")),
    Hall: topicOptions.filter((t) => t.startsWith("hall/")),
    WaterTank: topicOptions.filter((t) => t.startsWith("waterTank/")),
    Lawn: topicOptions.filter((t) => t.startsWith("lawn/")),
    HomeGarden: topicOptions.filter((t) => t.startsWith("homeGarden/")),
    Dustbin: topicOptions.filter((t) => t.startsWith("dustbin/")),
    Garage: topicOptions.filter((t) => t.startsWith("garage/")),
    Multimedia: topicOptions.filter((t) => t.startsWith("c/")),
  };

  return (
    <Card>
      <CardHeader className="flex gap-3 gradient-text bold text-2xl">
        History
      </CardHeader>
      <Divider />
      <CardBody>
        <div style={{ marginBottom: "1rem" }}>
          <Select
            label="Topic"
            placeholder="Select a topic"
            value={topic}
            onValueChange={(selected: string) => setTopic(selected)}
            fullWidth
            clearable
          >
            {Object.entries(groupedTopics).map(([group, topics]) => (
              <SelectSection key={group}>
                {topics.map((topicOption) => (
                  <SelectItem key={topicOption} value={topicOption}>
                    {topicOption}
                  </SelectItem>
                ))}
              </SelectSection>
            ))}
          </Select>
        </div>
        <Button onPress={fetchData}>Fetch History</Button>
        <Divider style={{ margin: "1rem 0" }} />
        {data.length > 0 ? (
          <Table aria-label="History Data" selectionMode="none">
            <TableHeader>
              <TableColumn>Timestamp</TableColumn>
              <TableColumn>Value</TableColumn>
            </TableHeader>
            <TableBody>
              {data.map((entry) => (
                <TableRow key={entry.timestamp}>
                  <TableCell>
                    {new Date(entry.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{entry.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p>No data available.</p>
        )}
      </CardBody>
      <Divider />
      <CardFooter></CardFooter>
    </Card>
  );
}

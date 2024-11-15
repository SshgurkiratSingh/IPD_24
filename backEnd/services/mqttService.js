const mqtt = require("mqtt");
const express = require("express");

// Initialize MQTT client
const client = mqtt.connect("mqtt://localhost:1883");
let logs = [];

// Using a Set to ensure all topics are unique
const topicSet = new Set([
  // Room Topics
  "room/temperature", "room/humidity", "room/light", "room/fan",
  "room/brightness", "room/switchboard", "room/pir", "room/alert",

  // Hall Topics
  "hall/temperature", "hall/humidity", "hall/light1", "hall/ambientLight",
  "hall/fan", "hall/brightness", "hall/oled", "hall/tv", "hall/gas",
  "hall/switchboard", "hall/alert",

  // Water Tank Topics
  "waterTank/waterLevel", "waterTank/ph", "waterTank/turbidity",

  // Lawn Topics
  "lawn/light1", "lawn/light2", "lawn/light3", "lawn/light4",
  "lawn/ultrasonic1", "lawn/ultrasonic2", "lawn/lightIntensity",
  "lawn/autonomousLighting",

  // Home Garden Topics
  "homeGarden/rainSensor", "homeGarden/soilMoisture",
  "homeGarden/pumpStatus", "homeGarden/gateStatus",

  // Dustbin Topics
  "dustbin/fullStatus",

  // Garage Topics
  "garage/light1", "garage/doorStatus", "garage/pir1", "garage/alert",

  //multimedia Topics
  "c/Artist", "c/Song"
]);

// Convert the Set to an Array
const topics = Array.from(topicSet);

// Setup MQTT client event handlers
client.on("connect", () => {
  client.subscribe(topics, { qos: 1 }, (err, granted) => {
    if (err) {
      console.error("Subscription error:", err);
    } else {
      granted.forEach((sub) => {
        console.log(`- ${sub.topic} (QoS: ${sub.qos})`);
      });
    }
  });
});

client.on("message", (topic, message) => {
  const payload = message.toString();
  const topicParts = topic.split("/");
  
  if (topicParts.length !== 2) {
    console.warn(`Received message on unexpected topic format: ${topic}`);
    return;
  }

  const [area, component] = topicParts;
  logs = logs.filter((log) => log.topic !== topic);
  console.log(topic, message.toString());
  logs.push({
    topic: topic,
    value: message.toString(),
  });
});

client.on("error", (err) => {
  console.error("Connection error:", err);
  client.end();
});

client.on("close", () => {
  console.log("Disconnected from MQTT broker");
});

client.on("offline", () => {
  console.log("MQTT client is offline");
});

client.on("reconnect", () => {
  console.log("Reconnecting to MQTT broker...");
});

// Export MQTT functions
module.exports = {
  client,
  logs,
  publishMessage: (topic, value, retainFlag = true) => {
    if (!topic || value === undefined) {
      throw new Error("Topic and value are required");
    }
    client.publish(topic, value.toString(), { retain: retainFlag });
  },
  getAllLogs: () => logs
};
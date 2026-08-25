#!/bin/bash

# MQTT Broker address and port
BROKER_ADDRESS="192.168.1.100" # Replace with your actual MQTT broker address
PORT=1883                      # Replace with your MQTT broker's port

# Function to publish a message to a topic
publish_message() {
    local topic=$1
    local message=$2
    mosquitto_pub -h $BROKER_ADDRESS -p $PORT -t "$topic" -m "$message" -r
}

# Loop through topics and publish random values appropriately
declare -A ranges=(
    ["room/temperature"]=25
    ["room/humidity"]=100
    ["room/fan"]=100
    ["room/brightness"]=100
    ["hall/temperature"]=25
    ["hall/humidity"]=100
    ["hall/fan"]=100
    ["hall/brightness"]=100
)

# Publish random values within specific ranges for some topics
for topic in "${!ranges[@]}"; do
    val=$((RANDOM % (${ranges[$topic]} + 1)))
    publish_message "$topic" "$val"
done

# For all other topics, publish either 0 or 1
for topic in "room/light" "room/switchboard" "room/pir" "room/alert" \
    "hall/light1" "hall/ambientLight" "hall/oled" "hall/tv" \
    "hall/gas" "hall/switchboard" "hall/alert" "waterTank/waterLevel" \
    "waterTank/ph" "waterTank/turbidity" "lawn/light1" "lawn/light2" \
    "lawn/light3" "lawn/light4" "lawn/ultrasonic1" "lawn/ultrasonic2" \
    "lawn/lightIntensity" "lawn/autonomousLighting" "homeGarden/rainSensor" \
    "homeGarden/soilMoisture" "homeGarden/pumpStatus" "homeGarden/gateStatus" \
    "dustbin/fullStatus" "garage/light1" "garage/doorStatus" "garage/pir1" "garage/alert"; do
    val=$((RANDOM % 2))
    publish_message "$topic" "$val"
done

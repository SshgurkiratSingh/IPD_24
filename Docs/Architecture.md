# System Architecture

The IPD 24 project follows a distributed architecture, leveraging cloud or edge servers for heavy computation and lightweight microcontrollers for physical world interaction.

## High-Level Overview

The system consists of three main tiers:
1.  **Edge Devices (Firmware Tier):** ESP32 and ESP8266 microcontrollers connected to various sensors and actuators.
2.  **Central Server (Backend Tier):** A Node.js backend acting as the central nervous system.
3.  **Client Interfaces (Frontend Tier):** Next.js web applications and desktop companions for user interaction.

## 1. Edge Devices (Firmware Tier)

The firmware projects reside in the `Firmware/` directory and are responsible for direct hardware interaction.

*   **Capabilities:** Relay control, ultrasonic distance measuring, RFID scanning, GPS tracking, and OLED displays.
*   **Communication:** Devices communicate primarily via the MQTT protocol to a central broker. This ensures low-latency, publish-subscribe messaging which is ideal for IoT.
*   **Frameworks:** Built using PlatformIO and Arduino frameworks for compatibility and ease of library management.

## 2. Central Server (Backend Tier)

The `Backend/` directory contains an Express.js application designed to handle the heavy lifting.

*   **API & Routing:** Provides RESTful APIs for the frontend applications to consume.
*   **Database Management:** Utilizes Prisma ORM to connect to a relational database. It stores historical telemetry, user configurations, and logs.
*   **AI Integration:** Integrates with external LLM APIs (OpenAI, Google Generative AI, Cohere) for intelligent automation, processing user prompts, and analyzing IoT data.
*   **MQTT Client:** Acts as an MQTT client itself, subscribing to edge device topics, processing incoming data, and publishing commands back to the devices.

## 3. Client Interfaces (Frontend Tier)

The `Frontend/` and `Clients/` directories provide the user-facing tools.

*   **Next.js Dashboard:** The primary interface (`frontend_next_v14`) is a modern React application. It offers real-time dashboards, historical data visualization, and configuration panels.
*   **Desktop Companion:** Provides native OS integrations, allowing users to control local edge devices via a desktop interface.
*   **Simulators:** The `Simulators/` directory contains tools like the CCTV Simulator to mock data streams, useful for testing the backend and frontend without deploying physical hardware.

## Data Flow Example: Turning on a light

1.  **User Action:** User clicks "Turn On Light" in the Next.js Frontend.
2.  **API Call:** Frontend sends an HTTP POST request to the Backend API.
3.  **Processing:** Backend validates the request and updates the desired state in the database.
4.  **MQTT Publish:** Backend publishes an MQTT message with payload `{"state": "ON"}` to the topic `home/livingroom/light/set`.
5.  **Device Action:** The ESP32 device subscribed to that topic receives the message, actuates the relay, and publishes a confirmation back to `home/livingroom/light/status`.
6.  **UI Update:** Backend receives the status update and pushes the new state to the frontend (e.g., via WebSockets or polling).

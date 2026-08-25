# IPD 24 - Home Automation & IoT Ecosystem

> **1st Prize Winner — CCET IPD Competition 2024**  
> *This project was awarded first place for its innovative approach to integrating real-time telemetry, AI-driven home automation, and robust hardware-software orchestration.*

This repository serves as a monorepo for the IPD 24 project, encompassing the complete ecosystem for a comprehensive home automation and IoT platform. It integrates firmware for multiple microcontrollers, a backend service, frontend web applications, desktop clients, and simulation tools.

## Project Structure

*   **Web_App**: The unified full-stack application (Next.js & Express.js) handling the frontend UI, APIs, database (Prisma), and MQTT integration in a single monolithic architecture.
*   **Firmware**: Source code for all edge devices and microcontrollers (ESP32, ESP8266) managing hardware integration like relays, ultrasonics, and RFIDs.
*   **Clients**: Desktop companion applications for managing the system locally.
*   **Simulators**: Tools such as the CCTV Simulator used for testing data ingestion without physical hardware.
*   **Docs**: Project architecture, schema references, assets, and deployment strategies.
*   **Tools_and_Scripts**: Bash and CMD scripts used for setup, operations, and testing.

## Integration & Deployment

The full-stack application is fully integrated and containerized via Docker. We utilize a `docker-compose.yml` to orchestrate the unified Web_App, ensuring rapid startup in a production-ready environment.

To start the system via Docker:

```bash
docker-compose up -d --build
```

This spins up the monolithic application (Next.js + Express API) on port 3000.

## Documentation

For a deeper dive into how to deploy, manage, and scale this ecosystem, refer to the documentation in the `Docs` directory:

*   [System Architecture](./Docs/Architecture.md)
*   [Deployment Strategies](./Docs/Deployment_Strategy.md)

## Requirements

*   Node.js (v20+)
*   Docker & Docker Compose
*   PlatformIO (for Firmware compilation)
*   Arduino IDE (for legacy ESP code)

## Contribution Guidelines

1.  Keep firmware code specific to its hardware controller.
2.  Ensure backend API routes are documented and validated.
3.  Test frontend features against the latest Node.js LTS versions.

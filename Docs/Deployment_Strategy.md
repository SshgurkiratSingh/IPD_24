# Deployment Strategies

This document outlines the recommended procedures and strategies for deploying the IPD 24 ecosystem. The objective is to achieve a reliable, scalable, and secure deployment across both cloud and local edge environments.

## 1. Containerized Deployment (Recommended)

The most robust way to deploy the web interface and backend API is via Docker and Docker Compose. This ensures the environment is consistent across development, testing, and production.

### Requirements:
*   Docker Engine
*   Docker Compose

### Steps:
1.  Navigate to the repository root.
2.  Review `docker-compose.yml` to ensure port mappings (3000 for frontend, 5000 for backend) are available on the host machine.
3.  Set necessary environment variables (like `DATABASE_URL`, MQTT broker details) either in `.env` files or directly in the docker-compose configuration.
4.  Execute `docker-compose up --build -d` to build the images and run the containers in detached mode.

### CI/CD Integration:
*   Use GitHub Actions or GitLab CI to build Docker images automatically on merging to the `main` branch.
*   Push images to a container registry (e.g., Docker Hub, AWS ECR).
*   Use tools like Watchtower on the deployment server to automatically pull and restart containers when new images are pushed.

## 2. Bare-Metal / Virtual Machine Deployment

For edge servers (such as a Raspberry Pi or a local home server) where Docker overhead might be undesirable, you can run the applications natively using Node.js and PM2.

### Backend Setup:
1.  Navigate to `Backend/`.
2.  Run `npm install --production`.
3.  Run `npx prisma generate` and `npx prisma migrate deploy` to set up the database schema.
4.  Start the service with PM2: `pm2 start index.js --name "ipd24-backend"`.

### Frontend Setup:
1.  Navigate to `Frontend/frontend_next_v14/`.
2.  Run `npm install`.
3.  Build the application: `npm run build`.
4.  Start the service with PM2: `pm2 start npm --name "ipd24-frontend" -- start`.

## 3. Firmware Flashing Strategy

Edge devices (ESP32/ESP8266) require firmware updates when new features or bug fixes are introduced.

### OTA (Over-The-Air) Updates:
*   For devices already deployed, integrate OTA capabilities in the firmware.
*   The backend should host a firmware repository route where devices can check for the latest binary and pull updates securely.

### Serial Flashing:
*   For initial provisioning or recovery, use PlatformIO or Arduino IDE over a USB Serial connection.
*   Keep baud rates consistent across devices (typically 115200).

## 4. Security Considerations

*   **Reverse Proxy:** Always deploy behind a reverse proxy like Nginx or Traefik. This handles SSL/TLS termination and routes traffic securely to port 3000 and 5000.
*   **Database Security:** Ensure the database port is only exposed to the backend container/service and not to the public internet.
*   **MQTT Security:** If hosting a custom MQTT broker (like Mosquitto), ensure MQTTS (TLS) is enforced and devices authenticate using client certificates or strong passwords.

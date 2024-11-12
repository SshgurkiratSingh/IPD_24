#include <Arduino.h>
#include <NewPingESP8266.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// -------------------------- Definitions --------------------------

// Ultrasonic Sensor 1
#define TRIGGER_PIN1 D0
#define ECHO_PIN1 D1
#define MAX_DISTANCE 200 // Maximum distance (in cm) to ping

// Ultrasonic Sensor 2
#define TRIGGER_PIN2 D2
#define ECHO_PIN2 D3

// WiFi Credentials
#define WIFI_SSID "ConForNode1"
#define WIFI_PASSWORD "12345678"

// MQTT Broker Settings
#define MQTT_SERVER "ec2-35-170-242-83.compute-1.amazonaws.com"
#define MQTT_PORT 1883

// LED Pins
const int led_pin[4] = {D4, D5, D6, D7};

// MQTT Topics for LEDs
const String Topic_To_Sub[4] = {
    "lawn/light1",
    "lawn/light2",
    "lawn/light3",
    "lawn/light4",
};

// MQTT Topics for Sensors
const String Topic_Sonar1 = "lawn/ultrasonic1";
const String Topic_Sonar2 = "lawn/ultrasonic2";

// LED Status
bool pinStatus[4] = {false, false, false, false};

// -------------------------- Objects --------------------------

NewPingESP8266 sonar1(TRIGGER_PIN1, ECHO_PIN1, MAX_DISTANCE);
NewPingESP8266 sonar2(TRIGGER_PIN2, ECHO_PIN2, MAX_DISTANCE);
WiFiClient espClient;
PubSubClient client(espClient);

// -------------------------- Function Prototypes --------------------------

void setup_wifi();
void reconnect();
void callback(char *topic, byte *payload, unsigned int length);

// -------------------------- Setup --------------------------

void setup()
{
  // Initialize Serial Monitor
  Serial.begin(115200);
  Serial.println();
  Serial.println("ESP8266 MQTT Sonar and LED Control Starting...");

  // Initialize LED pins
  for (int i = 0; i < 4; i++)
  {
    pinMode(led_pin[i], OUTPUT);
    digitalWrite(led_pin[i], LOW); // Ensure LEDs are off initially
  }

  // Connect to WiFi
  setup_wifi();

  // Setup MQTT
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
}

// -------------------------- Main Loop --------------------------

void loop()
{
  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED)
  {
    setup_wifi();
  }

  // Ensure MQTT is connected
  if (!client.connected())
  {
    reconnect();
  }

  // Process MQTT client
  client.loop();

  // Read distance from Sonar1
  unsigned int distance1 = sonar1.ping_cm();
  if (distance1 == 0)
    distance1 = MAX_DISTANCE; // If no echo, set to MAX_DISTANCE
  Serial.print("Sonar1 Distance: ");
  Serial.print(distance1);
  Serial.println(" cm");
  client.publish(Topic_Sonar1.c_str(), String(distance1).c_str(), true); // Retained message

  // Read distance from Sonar2
  unsigned int distance2 = sonar2.ping_cm();
  if (distance2 == 0)
    distance2 = MAX_DISTANCE; // If no echo, set to MAX_DISTANCE
  Serial.print("Sonar2 Distance: ");
  Serial.print(distance2);
  Serial.println(" cm");
  client.publish(Topic_Sonar2.c_str(), String(distance2).c_str(), true); // Retained message

  // Delay between measurements
  delay(2000); // 2 seconds
}

// -------------------------- WiFi Setup Function --------------------------

void setup_wifi()
{
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(WIFI_SSID);

  // Begin WiFi connection
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Wait until connected
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  // Connected
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// -------------------------- MQTT Reconnect Function --------------------------

void reconnect()
{
  // Loop until reconnected
  while (!client.connected())
  {
    Serial.print("Attempting MQTT connection...");

    // Create a random client ID
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);

    // Attempt to connect
    if (client.connect(clientId.c_str()))
    {
      Serial.println("connected");

      // Subscribe to LED control topics
      for (int i = 0; i < 4; i++)
      {
        if (client.subscribe(Topic_To_Sub[i].c_str()))
        {
          Serial.print("Subscribed to ");
          Serial.println(Topic_To_Sub[i]);
        }
        else
        {
          Serial.print("Failed to subscribe to ");
          Serial.println(Topic_To_Sub[i]);
        }
      }
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");

      // Wait before retrying
      delay(5000);
    }
  }
}

// -------------------------- MQTT Callback Function --------------------------

void callback(char *topic, byte *payload, unsigned int length)
{
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  // Convert payload to String
  String message;
  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Determine which LED to control
  for (int i = 0; i < 4; i++)
  {
    if (String(topic) == Topic_To_Sub[i])
    {
      if (message == "1")
      {
        digitalWrite(led_pin[i], HIGH);
        pinStatus[i] = true;
        Serial.print("LED ");
        Serial.print(i + 1);
        Serial.println(" turned ON");
      }
      else if (message == "0")
      {
        digitalWrite(led_pin[i], LOW);
        pinStatus[i] = false;
        Serial.print("LED ");
        Serial.print(i + 1);
        Serial.println(" turned OFF");
      }
      else
      {
        Serial.print("Unknown command for LED ");
        Serial.println(i + 1);
      }
    }
  }
}

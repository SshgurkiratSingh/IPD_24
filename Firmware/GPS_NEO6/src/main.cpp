#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <TinyGPSPlus.h>

// ------------------- Configuration -------------------

// WiFi credentials
const char *ssid = "Node ";         // Replace with your WiFi SSID
const char *password = "whyitellyou"; // Replace with your WiFi Password

// MQTT Broker settings
const char *mqtt_server = "192.168.1.100"; // MQTT Broker IP
const uint16_t mqtt_port = 1883;           // MQTT Broker Port (default 1883)

// MQTT Topics
const char *mqtt_topic_gps = "gps";
const char *mqtt_topic_count = "count"; // New topic for count

// UART settings for GPS
#define GPS_RX_PIN 17 // GPIO17 (TX2) on ESP32
#define GPS_TX_PIN 16 // GPIO16 (RX2) on ESP32
#define GPS_BAUD 9600

// ------------------- Global Objects -------------------

WiFiClient espClient;
PubSubClient client(espClient);
TinyGPSPlus gps;

// Create a HardwareSerial instance for GPS
HardwareSerial gpsSerial(2); // UART2

// ------------------- Global Variables -------------------

// Count variable
unsigned long count = 0;

// Timing variables
unsigned long previousMillis = 0;
const long interval = 10000; // Interval at which to publish count (milliseconds)

// ------------------- Function Prototypes -------------------
void setup_wifi();
void reconnect();
void callback(char *topic, byte *payload, unsigned int length);

// ------------------- Setup Function -------------------

void setup()
{
  // Initialize Serial Monitor
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("ESP32 GPS MQTT Publisher");

  // Initialize GPS Serial
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("GPS Serial Started");

  // Initialize WiFi
  setup_wifi();

  // Initialize MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ------------------- Loop Function -------------------

void loop()
{
  // Ensure MQTT connection
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  // Read GPS data
  while (gpsSerial.available() > 0)
  {
    char c = gpsSerial.read();
    gps.encode(c);
  }

  // If a new valid location is obtained, publish it
  if (gps.location.isUpdated())
  {
    String payload = "";
    payload += "{";
    payload += "\"latitude\": " + String(gps.location.lat(), 6) + ",";
    payload += "\"longitude\": " + String(gps.location.lng(), 6) + ",";
    payload += "\"altitude\": " + String(gps.altitude.meters()) + ",";
    payload += "\"satellites\": " + String(gps.satellites.value()) + ",";
    payload += "\"hdop\": " + String(gps.hdop.value() / 100.0);
    payload += "}";

    Serial.print("Publishing GPS Data: ");
    Serial.println(payload);

    client.publish(mqtt_topic_gps, payload.c_str());
  }

  // Publish count every 10 seconds
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval)
  {
    // Save the last time count was published
    previousMillis = currentMillis;

    // Increment count
    count++;

    // Convert count to string
    String countPayload = String(count);

    // Publish count
    Serial.print("Publishing Count: ");
    Serial.println(countPayload);

    client.publish(mqtt_topic_count, countPayload.c_str());
  }
}

// ------------------- WiFi Setup Function -------------------

/**
 * @brief Set up the WiFi connection.
 */
void setup_wifi()
{
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  // Begin WiFi connection
  WiFi.begin(ssid, password);

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

// ------------------- MQTT Reconnect Function -------------------

void reconnect()
{
  // Loop until reconnected
  while (!client.connected())
  {
    Serial.print("Attempting MQTT connection...");

    // Attempt to connect
    if (client.connect("ESP32GPSClient"))
    {
      Serial.println("connected");
      // Subscribe to topics if needed
      // client.subscribe("your_topic");
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

// ------------------- MQTT Callback Function -------------------

void callback(char *topic, byte *payload, unsigned int length)
{
  // Handle incoming messages if subscribing to topics
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (unsigned int i = 0; i < length; i++)
  {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Encoder.h>

// WiFi credentials
const char *ssid = "ConForNode1";
const char *password = "12345678";

// MQTT Broker
const char *mqtt_server = "ec2-3-86-53-202.compute-1.amazonaws.com";

// Create WiFi and MQTT clients
WiFiClient espClient;
PubSubClient client(espClient);

// Light output pins
const int lightPins[4] = {16, 17, 18, 19}; // Adjust these GPIO pins as needed

// Rotary encoder pins
const int encoderPinA = 32; // Adjust these GPIO pins as needed
const int encoderPinB = 33;
const int encoderButtonPin = 25;

ESP32Encoder encoder;

// For selecting between ultrasonic1 and ultrasonic2
bool selectUltrasonic1 = true;

// MQ6 sensor pin (analog pin)
const int mq6Pin = 34; // Adjust the analog pin as needed

// Variables for encoder value
int lastEncoderValue = 0;
int currentEncoderValue = 0;

// Variables for encoder timing
unsigned long lastEncoderChangeTime = 0;
const unsigned long encoderPublishDelay = 500; // milliseconds
int lastPublishedEncoderValue = -1;            // Initialize to an invalid value

// Variable to store the last published gas value
int lastGasValue = 0;

// Function prototypes
void setup_wifi();
void callback(char *topic, byte *payload, unsigned int length);
void reconnect();
void readMQ6();
void handleEncoder();

void setup()
{
  Serial.begin(115200);

  // Initialize output pins
  for (int i = 0; i < 4; i++)
  {
    pinMode(lightPins[i], OUTPUT);
  }

  // Initialize rotary encoder
  ESP32Encoder::useInternalWeakPullResistors = puType::up; // Use internal pull-ups
  ESP32Encoder::isrServiceCpuCore = ISR_CORE_USE_DEFAULT;  // Use default ISR core
  encoder.clearCount();                                    // Clear the encoder count
  encoder.attachHalfQuad(encoderPinA, encoderPinB);        // Attach encoder in half quadrature mode
  encoder.setCount(0);                                     // Set initial count to 0

  lastEncoderValue = 0;

  // Initialize button pin
  pinMode(encoderButtonPin, INPUT_PULLUP);

  // Initialize MQ6 pin
  // No need to set pinMode for analogRead

  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  handleEncoder();
  readMQ6();

  // Remove delay to make loop non-blocking and use timing control within functions
  // delay(100); // Adjust as needed
}

void setup_wifi()
{
  delay(10);
  // Connect to Wi-Fi
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA); // Station mode
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print("WiFi connected. IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char *topic, byte *payload, unsigned int length)
{
  // Handle incoming messages
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  // Convert payload to string
  String message;
  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Handle messages for light1 to light4
  for (int i = 1; i <= 4; i++)
  {
    String lightTopic = "lawn/light" + String(i);
    if (String(topic) == lightTopic)
    {
      int value = message.toInt();
      digitalWrite(lightPins[i - 1], value);
      Serial.print("Set pin ");
      Serial.print(lightPins[i - 1]);
      Serial.print(" to ");
      Serial.println(value);
    }
  }
}

void reconnect()
{
  // Loop until we're reconnected
  while (!client.connected())
  {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str()))
    {
      Serial.println("connected");

      // Subscribe to topics
      client.subscribe("lawn/light1");
      client.subscribe("lawn/light2");
      client.subscribe("lawn/light3");
      client.subscribe("lawn/light4");
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");

      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void handleEncoder()
{
  // Read encoder value
  currentEncoderValue = (int)encoder.getCount();

  // Constrain value between 1 and 100
  int value = constrain(currentEncoderValue, 1, 100);

  if (currentEncoderValue != lastEncoderValue)
  {
    // Encoder value has changed
    lastEncoderValue = currentEncoderValue;

    // Update encoder count to constrained value
    encoder.setCount(value);

    // Update last change time
    lastEncoderChangeTime = millis();

    Serial.print("Encoder value changed to ");
    Serial.println(value);
  }
  else
  {
    // Encoder value hasn't changed
    // Check if enough time has passed since last change to publish value
    if (millis() - lastEncoderChangeTime >= encoderPublishDelay)
    {
      // Time to publish the value
      // Check if we haven't already published this value
      if (lastPublishedEncoderValue != value)
      {
        // Publish value to selected topic
        String topic = selectUltrasonic1 ? "lawn/ultrasonic1" : "lawn/ultrasonic2";
        String message = String(value);
        client.publish(topic.c_str(), message.c_str());

        Serial.print("Published final value ");
        Serial.print(value);
        Serial.print(" to topic ");
        Serial.println(topic);

        // Update last published value
        lastPublishedEncoderValue = value;
      }
    }
  }

  // Check if button is pressed
  static bool lastButtonState = HIGH;
  bool buttonState = digitalRead(encoderButtonPin);

  // Detect falling edge
  if (lastButtonState == HIGH && buttonState == LOW)
  {
    // Button pressed
    selectUltrasonic1 = !selectUltrasonic1;
    Serial.print("Switched to ");
    Serial.println(selectUltrasonic1 ? "lawn/ultrasonic1" : "lawn/ultrasonic2");
  }
  lastButtonState = buttonState;
}

void readMQ6()
{
  static unsigned long lastReadTime = 0;
  const unsigned long readInterval = 500; // Read every 500 ms (adjust as needed)

  // Check if it's time to read the sensor
  if (millis() - lastReadTime >= readInterval)
  {
    lastReadTime = millis();

    // Read analog value from MQ6 sensor
    int gasValue = analogRead(mq6Pin);

    // Define a threshold for significant change
    const int gasThreshold = 5; // Adjust as needed

    // Check if the change is significant
    if (abs(gasValue - lastGasValue) >= gasThreshold)
    {
      // Publish to "hall/gas"
      String message = String(gasValue);
      client.publish("hall/gas", message.c_str());

      Serial.print("Published gas value ");
      Serial.println(gasValue);

      // Update lastGasValue
      lastGasValue = gasValue;
    }
  }
}

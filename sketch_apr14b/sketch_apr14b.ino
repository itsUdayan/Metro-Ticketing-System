#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_Fingerprint.h>

const char* ssid = "Garden";
const char* password = "Garden@99";

const char* serverUrl = "http://192.168.82.187:3000/api";
const char* enrollEndpoint = "/enroll";
const char* verifyEndpoint = "/verify";

#define FINGERPRINT_RX 16
#define FINGERPRINT_TX 17

HardwareSerial fingerprintSerial(2);
Adafruit_Fingerprint fingerSensor = Adafruit_Fingerprint(&fingerprintSerial);

enum SystemState {
  IDLE,
  ENROLLING,
  SOURCE_VERIFICATION,
  DESTINATION_VERIFICATION
};

SystemState currentState = IDLE;
int lastFingerprintId = -1;
String deviceId = "METRO_DEVICE_001";

void setup() {
  Serial.begin(115200);
  delay(1000);

  fingerprintSerial.begin(57600, SERIAL_8N1, FINGERPRINT_RX, FINGERPRINT_TX);

  if (fingerSensor.verifyPassword()) {
    Serial.println("Fingerprint sensor connected!");
  } else {
    Serial.println("Fingerprint sensor not found :(");
    while (1) { delay(1000); }
  }

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  Serial.println("Metro Ticketing System Ready.");
  Serial.println("Waiting for commands...");
}

void loop() {
  checkForCommands();
  checkServerCommands();
  switch (currentState) {
    case IDLE:
      break;

    case ENROLLING:
      handleEnrollment();
      break;

    case SOURCE_VERIFICATION:
      handleSourceVerification();
      break;

    case DESTINATION_VERIFICATION:
      handleDestinationVerification();
      break;
  }

  delay(100);
}

void checkForCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    processCommand(command);
  }

  if (WiFi.status() == WL_CONNECTED && currentState == IDLE) {
    static unsigned long lastCommandCheck = 0;
    if (millis() - lastCommandCheck > 5000) {
      lastCommandCheck = millis();
      checkServerCommands();
    }
  }
}

void checkServerCommands() {
  HTTPClient http;
  String url = String(serverUrl) + "/commands?deviceId=" + deviceId;
  http.begin(url);

  int httpResponseCode = http.GET();
  if (httpResponseCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);

    if (doc.containsKey("command")) {
      String command = doc["command"].as<String>();
      processCommand(command);
    }
  }

  http.end();
}

void processCommand(String command) {
  Serial.print("Processing command: ");
  Serial.println(command);

  if (command.startsWith("ENROLL")) {
    int id = -1;
    startEnrollment(id);
  } else if (command == "SOURCE") {
    currentState = SOURCE_VERIFICATION;
    Serial.println("Place finger to verify source station.");
  } else if (command == "DESTINATION") {
    currentState = DESTINATION_VERIFICATION;
    Serial.println("Place finger to verify destination station.");
  } else if (command == "CANCEL") {
    currentState = IDLE;
    Serial.println("Operation cancelled.");
  }
}

void startEnrollment(int id) {
  currentState = ENROLLING;
  lastFingerprintId = id;
  Serial.println("Starting fingerprint enrollment.");
  Serial.println("Place finger on the sensor...");
}

void handleEnrollment() {
  static int enrollmentStep = 1;
  static uint32_t lastAttemptTime = 0;

  if (millis() - lastAttemptTime < 1000) {
    return;
  }
  lastAttemptTime = millis();

  if (enrollmentStep == 1) {
    Serial.println("Place finger to enroll (first scan)...");
    int p = fingerSensor.getImage();
    if (p != FINGERPRINT_OK) {
      Serial.println("Error: Could not scan finger (1st try)");
      return;
    }

    Serial.println("Image taken");
    p = fingerSensor.image2Tz(1);
    if (p != FINGERPRINT_OK) {
      Serial.println("Error: Could not process image (1st try)");
      return;
    }

    Serial.println("Remove finger");
    delay(2000);
    enrollmentStep = 2;
    return;
  }

  if (enrollmentStep == 2) {
    Serial.println("Place same finger again (second scan)...");
    int p = fingerSensor.getImage();
    if (p != FINGERPRINT_OK) {
      Serial.println("Error: Could not scan finger (2nd try)");
      return;
    }

    Serial.println("Image taken");
    p = fingerSensor.image2Tz(2);
    if (p != FINGERPRINT_OK) {
      Serial.println("Error: Could not process image (2nd try)");
      enrollmentStep = 1;
      return;
    }

    p = fingerSensor.createModel();
    if (p != FINGERPRINT_OK) {
      Serial.println("Error: Fingerprints did not match");
      enrollmentStep = 1;
      return;
    }

    // Find next available ID (if id == -1)
    uint16_t id = lastFingerprintId;
    if (id == (uint16_t)-1) {  // Handle -1 correctly
      for (id = 1; id < 128; id++) {
        // Check if slot is empty by reading template
        p = fingerSensor.loadModel(id);
        if (p != FINGERPRINT_OK) {  // If load fails, slot is empty
          break;
        }
      }
      if (id >= 128) {
        Serial.println("Error: Database full!");
        enrollmentStep = 1;
        currentState = IDLE;
        return;
      }
    }
    Serial.println(id);
    // Store the model
    p = fingerSensor.storeModel(id);
    if (p != FINGERPRINT_OK) {
      Serial.println("Error: Failed to store fingerprint (ID may be invalid)");
      Serial.print("Error code: 0x");
      Serial.println(p, HEX);
      enrollmentStep = 1;
      return;
    }

    Serial.print("Success! Fingerprint enrolled with ID: ");
    Serial.println(id);

    sendEnrollmentToServer(id);

    enrollmentStep = 1;
    currentState = IDLE;
  }
}

void handleSourceVerification() {
  uint8_t p = fingerSensor.getImage();
  if (p != FINGERPRINT_OK) {
    return;
  }

  p = fingerSensor.image2Tz();
  if (p != FINGERPRINT_OK) {
    Serial.println("Error processing fingerprint");
    return;
  }

  p = fingerSensor.fingerSearch();
  if (p != FINGERPRINT_OK) {
    Serial.println("Fingerprint not found!");
    return;
  }

  int fingerprintId = fingerSensor.fingerID;
  int confidence = fingerSensor.confidence;

  Serial.print("Found ID #");
  Serial.print(fingerprintId);
  Serial.print(" with confidence of ");
  Serial.println(confidence);

  sendVerificationToServer(fingerprintId, "source");

  currentState = IDLE;
}

void handleDestinationVerification() {
  uint8_t p = fingerSensor.getImage();
  if (p != FINGERPRINT_OK) {
    return;
  }

  p = fingerSensor.image2Tz();
  if (p != FINGERPRINT_OK) {
    Serial.println("Error processing fingerprint");
    return;
  }

  p = fingerSensor.fingerSearch();
  if (p != FINGERPRINT_OK) {
    Serial.println("Fingerprint not found!");
    return;
  }

  int fingerprintId = fingerSensor.fingerID;
  int confidence = fingerSensor.confidence;

  Serial.print("Found ID #");
  Serial.print(fingerprintId);
  Serial.print(" with confidence of ");
  Serial.println(confidence);

  sendVerificationToServer(fingerprintId, "destination");

  currentState = IDLE;
}

#include <ArduinoJson.h>  // Make sure this library is installed

void sendEnrollmentToServer(int fingerprintId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = serverUrl;
    url += enrollEndpoint;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"fingerprintId\": " + String(fingerprintId) + "}";
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Server Response:");
      Serial.println(response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}

void sendVerificationToServer(int fingerprintId, String type) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }

  HTTPClient http;
  String url = String(serverUrl) + verifyEndpoint;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  DynamicJsonDocument doc(1024);
  doc["deviceId"] = deviceId;
  doc["fingerprintId"] = fingerprintId;
  doc["type"] = type;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Server response: " + response);
  } else {
    Serial.print("Error on sending verification: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

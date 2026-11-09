// XIAO ESP32-C6 + LDR + LED, talking to the relay over WebSockets.
//
// Wiring:  3V3 -> LDR -> D0 (A0) -> 10k resistor -> GND     (more light = higher value)
//          D7 -> LED -> resistor -> GND
// Note: only D0, D1 and D2 can read analog voltages on the XIAO C6.
//
// Sends every 500 ms:   "<boardId>,<ldr>"       e.g.  "7A3F,2310"   (ldr is 0..4095)
// Listens for:          "led,<boardId>,1"  /  "led,<boardId>,0"
// The page sends those so the LED is on while this board's note is playing.
//
// Libraries (Library Manager): "WebSockets" by Markus Sattler

#include <WiFi.h>
#include <WebSocketsClient.h>

// ---- settings -------------------------------------------------------------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Local relay on the classroom WiFi:
// const char* SERVER_HOST = "192.168.4.186";
// const int   SERVER_PORT = 3000;
// const bool  USE_SSL     = false;
// Public relay on Render (hostname only, no https://):
const char* SERVER_HOST = "h4p-esp-sockets.onrender.com";
const int   SERVER_PORT = 443;
const bool  USE_SSL     = true;

const int LDR = A0;                          // = D0
const int LED = D7;
const unsigned long SEND_INTERVAL_MS = 500;
// ---------------------------------------------------------------------------

WebSocketsClient ws;
String boardId;                               // last 4 hex digits of the MAC, unique per board
unsigned long lastSend = 0;

void onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("ws connected");
      break;
    case WStype_DISCONNECTED:
      Serial.println("ws disconnected");
      digitalWrite(LED, LOW);
      break;
    case WStype_TEXT: {
      String s = String((char*)payload, length);
      if (s.startsWith("led," + boardId + ",")) {
        digitalWrite(LED, s.endsWith("1") ? HIGH : LOW);
      }
      break;
    }
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED, OUTPUT);
  analogReadResolution(12);                  // 0..4095

  // --- wifi ---
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("wifi");
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED, !digitalRead(LED));     // slow blink while connecting
    delay(300);
    Serial.print(".");
  }
  digitalWrite(LED, LOW);

  String mac = WiFi.macAddress();            // "AA:BB:CC:DD:EE:FF"
  boardId = mac.substring(12, 14) + mac.substring(15, 17);
  Serial.print(" connected, ip ");
  Serial.print(WiFi.localIP());
  Serial.print(", board id ");
  Serial.println(boardId);

  // --- websocket ---
  if (USE_SSL) {
    ws.beginSSL(SERVER_HOST, SERVER_PORT, "/");
  } else {
    ws.begin(SERVER_HOST, SERVER_PORT, "/");
  }
  ws.onEvent(onWsEvent);
  ws.setReconnectInterval(2000);
}

void loop() {
  ws.loop();

  if (ws.isConnected() && millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();
    //LDR reading
    int ldr = analogRead(LDR);
    Serial.println(ldr);
    String line = boardId + "," + String(ldr);
    ws.sendTXT(line);
  }
}

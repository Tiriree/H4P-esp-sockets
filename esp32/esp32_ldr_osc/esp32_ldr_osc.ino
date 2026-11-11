// XIAO ESP32-C6 + LDR, sending OSC over WiFi (UDP).
//
// Wiring:  3V3 -> LDR -> D0 (A0) -> 10k resistor -> GND     (more light = higher value)
//          D7 -> LED -> resistor -> GND                      (blinks while joining WiFi)
// Note: only D0, D1 and D2 can read analog voltages on the XIAO C6.
//
// Sends 20 times a second:   /ldr  <boardId>  <value>      e.g.  /ldr "5B28" 2310
//   boardId is a string (last 4 hex digits of the MAC), value is an int 0..4095
//
// OSC goes straight from the board to one computer, no server in between.
// Anything that speaks OSC can receive it: Max, Pd, TouchDesigner, Processing...
//
// Libraries (Library Manager): "OSC" by Adrian Freed / CNMAT

#include <WiFi.h>
#include <WiFiUdp.h>
#include <OSCMessage.h>

// ---- settings -------------------------------------------------------------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

const char* TARGET_IP   = "192.168.8.199";   // computer that receives the OSC
const int   TARGET_PORT = 8000;              // port it listens on

const int LDR = A0;                          // = D0
const int LED = D7;
const unsigned long SEND_INTERVAL_MS = 50;   // 20 messages per second
// ---------------------------------------------------------------------------

WiFiUDP udp;
String boardId;
unsigned long lastSend = 0;

void setup() {
  Serial.begin(115200);
  pinMode(LED, OUTPUT);
  analogReadResolution(12);                  // 0..4095

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
}

void loop() {
  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    lastSend = millis();

    OSCMessage msg("/ldr");
    msg.add(boardId.c_str());                // argument 1: string
    msg.add((int32_t)analogRead(LDR));       // argument 2: int

    udp.beginPacket(TARGET_IP, TARGET_PORT);
    msg.send(udp);
    udp.endPacket();
    msg.empty();                             // free the message's memory
  }
}
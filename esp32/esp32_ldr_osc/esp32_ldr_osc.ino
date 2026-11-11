// XIAO ESP32-C6 + LDR, sending OSC over WiFi (UDP).
//
// Wiring:  3V3 -> LDR -> D0 (A0) -> 10k resistor -> GND
// Sends:   /ldr <value>     value is an int, 0..4095, 20 times a second
//
// Library (Library Manager): "OSC" by Adrian Freed / CNMAT

#include <WiFi.h>
#include <WiFiUdp.h>
#include <OSCMessage.h>

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

const char* TARGET_IP   = "192.168.8.199";   // computer that receives the OSC
const int   TARGET_PORT = 8000;              // port it listens on

WiFiUDP udp;

void setup() {
  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println(WiFi.localIP());
}

void loop() {
  OSCMessage msg("/ldr");
  msg.add((int32_t)analogRead(A0));

  udp.beginPacket(TARGET_IP, TARGET_PORT);
  msg.send(udp);
  udp.endPacket();

  delay(50);
}
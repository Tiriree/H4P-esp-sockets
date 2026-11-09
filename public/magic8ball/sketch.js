// Magic 8-ball, shaken by the ESP32 instead of a phone.
// The C6 streams "ax,ay,az,gx,gy,gz" lines over the relay; a shake is a big
// jump in total acceleration away from gravity. Each shake toggles the LED.

// relay address: ws:// when opened over http, wss:// when opened over https
const SERVER =
  (location.protocol === "https:" ? "wss://" : "ws://") + location.host;
// from the p5 editor use the Render relay instead:
// const SERVER = "wss://esp-sockets-class-example.onrender.com";

const SHAKE_THRESHOLD = 12;   // m/s^2 away from gravity (9.8), raise if too sensitive
const MIN_TIME = 2000;        // ms between shakes

let ws;
let lastShake = 0;
let ledOn = false;
let started = false;
let currentMsg = "";

let msg = [
  "It is certain",
  "It is decidedly so",
  "Without a doubt",
  "Yes – definitely",
  "You may rely on it",
  "As I see it, yes",
  "Most likely",
  "Outlook good",
  "Yes",
  "Signs point to yes",
  "Reply hazy, try again",
  "Ask again later",
  "Better not tell you now",
  "Cannot predict now",
  "Concentrate and ask again",
  "Don’t count on it",
  "My reply is no",
  "My sources say no",
  "Outlook not so good",
  "Very doubtful",
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  textAlign(CENTER, CENTER);
  textSize(64);
  connect();
}

function connect() {
  ws = new WebSocket(SERVER);

  ws.onopen = () => console.log("connected to " + SERVER);

  ws.onmessage = (event) => {
    let v = event.data.trim().split(",").map(Number);
    if (v.length !== 6) return;            // ignore "1"/"0" LED messages etc.

    let [ax, ay, az] = v;
    let magnitude = sqrt(ax * ax + ay * ay + az * az);
    if (abs(magnitude - 9.8) > SHAKE_THRESHOLD) shaken();
  };

  ws.onclose = () => {
    console.log("disconnected, retrying...");
    setTimeout(connect, 2000);
  };
}

function shaken() {
  if (millis() - lastShake < MIN_TIME) return;   // one shake per MIN_TIME
  lastShake = millis();

  started = true;
  currentMsg = random(msg);
  background(60, 10, 150);
  text(currentMsg, width / 2, height / 2);

  ledOn = !ledOn;
  if (ws.readyState === 1) ws.send(ledOn ? "1" : "0");
}

function draw() {
  if (!started) {
    background(0);
    fill(255);
    text(ws.readyState === 1 ? "Shake the board!" : "Connecting...", width / 2, height / 2);
  } else {
    background(0, 0, 0, 2);   // slowly fade the answer
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

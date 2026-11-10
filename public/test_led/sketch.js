// Random LED + Manual Control
//
// SPACE = Random LED roulette
// A     = All LEDs ON
// O     = All LEDs OFF
//
// Boards announce themselves with "<id>,<ldr>" lines.
// LEDs are controlled with "led,<id>,1" / "led,<id>,0".

const SERVER =
  (location.protocol === "https:" ? "wss://" : "ws://") + location.host;

// const SERVER = "wss://esp-sockets-class-example.onrender.com";

const TIMEOUT_MS = 3000;
const BLINKS = 8;
const FIRST_MS = 120;
const SLOWDOWN = 1.25;

let ws;
let boards = {};
let lit = null;
let allOn = false;

// keep track of animation timers
let timers = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  noStroke();
  connect();
}

function connect() {
  ws = new WebSocket(SERVER);

  ws.onmessage = (event) => {
    let parts = event.data.trim().split(",");

    if (parts.length === 2) {
      boards[parts[0]] = millis();
    }
  };

  ws.onclose = () => setTimeout(connect, 2000);
}

function send(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(msg);
  }
}

// turn every LED ON / OFF
function setAll(on) {
  allOn = on;
  lit = null;

  for (let id in boards) {
    send("led," + id + "," + (on ? "1" : "0"));
  }
}

// cancel any running animaton
function stopAnimation() {
  for (let timer of timers) {
    clearTimeout(timer);
  }
  timers = [];
}

// random LED 
function pick() {
  let ids = Object.keys(boards);
  if (ids.length === 0) return;

 
  stopAnimation(); //

  
  setAll(false);// start with all LEDs OFF

  let t = 0;
  let d = FIRST_MS;

  for (let i = 0; i < BLINKS; i++) {
    timers.push(
      setTimeout(() => setAll(true), t)
    );

    timers.push(
      setTimeout(() => setAll(false), t + d)
    );

    t += 2 * d;
    d *= SLOWDOWN;
  }

  // leave one random board on
  timers.push(
    setTimeout(() => {
      let available = Object.keys(boards);

      if (available.length > 0) {
        lit = random(available);
        allOn = false;
        send("led," + lit + ",1");
      }

      timers = [];
    }, t)
  );
}


function keyPressed() {

  // spacebar = Random LED 
  if (key === " ") {
    pick();
  }

  // a = all LEDs on
  else if (key === "a" || key === "A") {
    stopAnimation();
    setAll(true);
  }

  // o = all LEDs off
  else if (key === "o" || key === "O") {
    stopAnimation();
    setAll(false);
  }

  return false;
}

function draw() {
  background(17);

  // Forget boards that are no longer responding
  for (let id in boards) {
    if (millis() - boards[id] > TIMEOUT_MS) {
      delete boards[id];

      if (lit === id) {
        lit = null;
      }
    }
  }

  let ids = Object.keys(boards);
  let w = width / max(1, ids.length);

  // draw 
  for (let i = 0; i < ids.length; i++) {

    // Green = LED ON
    // Gray = LED OFF
    fill(allOn || ids[i] === lit
      ? color(0, 200, 90)
      : 40
    );

    rect(i * w + 4, 60, w - 8, 120);

    fill(255);
    textSize(24);
    text(ids[i], i * w + w / 2, 120);
  }

  // Connection status
  fill(200);
  textSize(18);

  text(
    ws && ws.readyState === WebSocket.OPEN
      ? ids.length + " board(s) connected"
      : "connecting...",
    width / 2,
    30
  );

  // text
  fill(180);
  textSize(16);

  text(
    "SPACE = Random  |  A = All ON  |  O = All OFF",
    width / 2,
    220
  );
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
// LDR step sequencer.
// Every board sends "<id>,<ldr>" twice a second. Boards are laid out in rows
// of 4, in the order they first showed up. A step moves through the 4 columns;
// on each step, every row plays the board in that column. So with up to 4
// boards one plays at a time, with 5-8 boards two play together, and so on.
// The light level picks the note; the playing board gets its LED turned on.

// relay address: ws:// when opened over http, wss:// when opened over https
const SERVER =
  (location.protocol === "https:" ? "wss://" : "ws://") + location.host;
// from the p5 editor use the Render relay instead:
// const SERVER = "wss://esp-sockets-class-example.onrender.com";

const COLS = 4;            // boards per row
const STEP_MS = 500;       // time per step
const TIMEOUT_MS = 3000;   // forget a board that stays silent this long
const NOTES = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5"];  // pentatonic

let ws;
let boards = [];           // [{ id, value, lastSeen }] in order of first appearance
let synths = [];           // one synth per row
let col = -1;              // current column
let lastStep = 0;
let audioOn = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  connect();
}

function connect() {
  ws = new WebSocket(SERVER);
  ws.onopen = () => console.log("connected to " + SERVER);

  ws.onmessage = (event) => {
    let parts = event.data.trim().split(",");
    if (parts.length !== 2) return;          // ignore anything that isn't "<id>,<ldr>"
    let id = parts[0], value = Number(parts[1]);
    if (isNaN(value)) return;

    let b = boards.find((b) => b.id === id);
    if (b) {
      b.value = value;
      b.lastSeen = millis();
    } else {
      boards.push({ id, value, lastSeen: millis() });
    }
  };

  ws.onclose = () => setTimeout(connect, 2000);
}

function send(msg) {
  if (ws.readyState === 1) ws.send(msg);
}

// Tone.js may only start audio after a click
function mousePressed() {
  if (!audioOn) {
    Tone.start();
    audioOn = true;
  }
}

function step() {
  // turn off the LEDs from the previous step
  for (let r = 0; r * COLS + col < boards.length; r++) {
    if (col >= 0) send("led," + boards[r * COLS + col].id + ",0");
  }

  col = (col + 1) % COLS;

  // every row plays its board in this column
  let rows = ceil(boards.length / COLS);
  for (let r = 0; r < rows; r++) {
    let b = boards[r * COLS + col];
    if (!b) continue;
    if (!synths[r]) synths[r] = new Tone.Synth().toDestination();
    let note = NOTES[floor(map(b.value, 0, 4095, 0, NOTES.length - 1))];
    if (audioOn) synths[r].triggerAttackRelease(note, "8n");
    send("led," + b.id + ",1");
  }
}

function draw() {
  background(17);

  // drop boards that went quiet
  boards = boards.filter((b) => millis() - b.lastSeen < TIMEOUT_MS);

  if (millis() - lastStep >= STEP_MS) {
    lastStep = millis();
    step();
  }

  // grid: one box per board, green while it plays
  noStroke();
  let cellW = width / COLS;
  let rows = max(1, ceil(boards.length / COLS));
  let cellH = min(160, (height - 80) / rows);
  for (let i = 0; i < boards.length; i++) {
    let b = boards[i];
    let r = floor(i / COLS), c = i % COLS;
    let x = c * cellW, y = 60 + r * cellH;
    let playing = c === col;
    fill(playing ? color(0, 200, 90) : 40);
    rect(x + 4, y + 4, cellW - 8, cellH - 8);
    fill(255);
    textSize(24);
    text(b.id, x + cellW / 2, y + cellH / 2 - 14);
    textSize(14);
    text(b.value, x + cellW / 2, y + cellH / 2 + 16);
  }

  fill(200);
  textSize(18);
  let status = ws.readyState === 1 ? boards.length + " board(s)" : "connecting...";
  text(audioOn ? status : "click to start audio  ·  " + status, width / 2, 30);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

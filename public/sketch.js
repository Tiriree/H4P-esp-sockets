// Build the socket address from wherever this page was loaded:
//   http://192.168.4.181:3000   -> ws://192.168.4.181:3000
//   https://xxx.onrender.com    -> wss://xxx.onrender.com
// (an https page may only open wss://, so the protocol has to match)
const SERVER =
  (location.protocol === "https:" ? "wss://" : "ws://") + location.host;

// To use a relay other than the one serving this page, hardcode it:
// const SERVER = "ws://192.168.4.181:3000";
// const SERVER = "wss://esp-sockets-class-example.onrender.com";

let ws;
let ax = 0, ay = 0, az = 0, gx = 0, gy = 0, gz = 0;
let toggle = false;

function setup() {
  createCanvas(400, 400);
  connect();
}

function connect() {
  ws = new WebSocket(SERVER);

  ws.onopen = () => console.log("connected to " + SERVER);

  // With serial we had to poll the buffer every frame.
  // With WebSockets the browser calls this function once per message,
  // as soon as it arrives, so there is no buffer to drain.
  ws.onmessage = (event) => {
    let msg = event.data;
    // console.log(msg);                                  // raw line from the C6
    // console.log(msg.trim().split(","));                // array of "strings"
    // console.log(msg.trim().split(",").map(Number));    // array of numbers

    let v = msg.trim().split(",").map(Number);

    // the relay also forwards "1"/"0" LED messages from other clients,
    // this check ignores anything that is not a 6-value sensor line
    if (v.length === 6) {
      ax = v[0];
      ay = v[1];
      az = v[2];
      gx = v[3];
      gy = v[4];
      gz = v[5];
    }
  };

  // if the server restarts, try again in 2 s (the C6 does the same)
  ws.onclose = () => {
    console.log("disconnected, retrying...");
    setTimeout(connect, 2000);
  };
}

function draw() {
  background(20);

  // tilt moves the circle
  let x = map(ax, -9.8, 9.8, 0, width);
  let y = map(ay, -9.8, 9.8, 0, height);
  fill(255);
  circle(x, y, 40);

  fill(200);
  // readyState 1 means OPEN
  text(ws.readyState === 1 ? "connected" : "connecting...", 10, 20);
  text("1 / 0 / space = LED", 10, 40);
}

function send(msg) {
  if (ws.readyState === 1) ws.send(msg);   // only when the socket is open
}

function keyPressed() {
  if (key === "1" || key === "0") send(key);   // LED on/off
  if (key === " ") {
    if (toggle) {
      send("0");
    } else {
      send("1");
    }
    toggle = !toggle;
  }
}

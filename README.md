# esp-sockets

Barebones WebSocket relay for the ESP32 + p5.js class.
Every message from one client goes to every other client.

## Run locally

    npm install
    npm start

Open http://localhost:3000. Students on the same WiFi open http://<your-lan-ip>:3000
(`ipconfig getifaddr en0` prints it).

## Deploy on Render

1. Push this folder to a GitHub repo.
2. Render dashboard: New -> Blueprint, pick the repo. It reads `render.yaml`.
3. You get a URL like `https://esp-sockets-class-example.onrender.com`.

- Browser, including editor.p5js.org: `wss://esp-sockets-class-example.onrender.com`
  (opening the Render URL itself serves `public/`, which connects automatically)
- ESP32: set `USE_SSL = true`, `SERVER_HOST` to the hostname, `SERVER_PORT = 443`

Free tier sleeps after 15 min idle; the first connection then takes about a
minute to wake it. The sketch and the C6 both retry every 2 s, so they connect
on their own once it is up.

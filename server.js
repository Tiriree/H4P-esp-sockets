// Barebones WebSocket relay: every message from one client goes to all the others.
// Serves ./public over http so the p5 sketch can be opened from the same address.
// Runs unchanged on a laptop (port 3000) and on Render (which sets PORT).

const express = require("express");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static("public"));

const server = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("connected, clients:", wss.clients.size);

  ws.on("message", (data) => {
    const msg = data.toString();
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === 1) client.send(msg);
    }
  });

  ws.on("close", () => {
    console.log("disconnected, clients:", wss.clients.size);
  });
});

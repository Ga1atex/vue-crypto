const API_KEY = `f22a136a4626481601277a8e9da7a231469f3e5062a0b042e5c5b4ddee364dab`;

const ws = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const idToPortMap = new Map();

// Create a broadcast channel to notify about state changes
const broadcastChannel = new BroadcastChannel("WebSocketChannel");

function broadcastChannelPostMessage() {
  broadcastChannel.postMessage({ type: "WSState", state: ws.readyState });
}

// Let all connected contexts(tabs) know about state cahnges
ws.addEventListener("open", broadcastChannelPostMessage);
ws.addEventListener("close", broadcastChannelPostMessage);

// When we receive data from the server.
ws.addEventListener("message", (e) => {
  const parsedData = { data: JSON.parse(e.data), type: "message" };

  if (!parsedData.data.from) {
    broadcastChannel.postMessage(parsedData);
  } else {
    idToPortMap.get(e.data.from).postMessage(parsedData);
  }
});

const sendToWebSocket = (message) => {
  const stringifiedMessage = JSON.stringify(message);

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(stringifiedMessage);
    return;
  }

  ws.addEventListener(
    "open",
    () => {
      ws.send(stringifiedMessage);
    },
    { once: true }
  );
};

// let connected = false;
// Event handler called when a tab tries to connect to this worker.
self.addEventListener(
  "connect",
  (e) => {
    // Get the MessagePort from the event. This will be the
    // communication channel between SharedWorker and the Tab
    const port = e.ports[0];

    port.addEventListener(
      "message",
      (ev) => {
        // Collect port information in the map
        idToPortMap.set(ev.data.from, port);
        sendToWebSocket(ev.data.data);
        // port.postMessage(ev.data);
        // if (ev.data === "start") {
        //   if (connected === false) {
        //     port.postMessage("worker init");
        //     connected = true;
        //   } else {
        //     port.postMessage("worker already inited");
        //   }
        // }
      },
      false
    );

    port.start();

    // We need this to notify the newly connected context to know
    // the current state of WS connection.
    port.postMessage({ state: ws.readyState, type: "WSState" });
  },
  false
);

// self.onconnect = (e) => {
//   const port = e.ports[0];

//   ws.addEventListener("message", (e) => {
//     if (e.data) {
//       port.postMessage(e.data);
//       return;
//     }
//   });
// };

// self.onmessage = (e) => {
//   let message = e.data;

//   ws.send(message);
// };

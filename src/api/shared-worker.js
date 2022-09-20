const API_KEY = `f22a136a4626481601277a8e9da7a231469f3e5062a0b042e5c5b4ddee364dab`;

const ws = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const idToPortMap = new Map();

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

// Event handler called when a tab tries to connect to this worker.
self.addEventListener(
  "connect",
  (e) => {
    // Get the MessagePort from the event. This will be the
    // communication channel between SharedWorker and the Tab
    // e.source can be used instead
    const port = e.ports[0];

    // Let all connected contexts(tabs) know about state cahnges
    function sendWSState() {
      port.postMessage({ type: "WSState", state: ws.readyState });
    }
    ws.addEventListener("open", sendWSState);
    ws.addEventListener("close", sendWSState);

    // When we receive data from the server.
    ws.addEventListener("message", (e) => {
      const parsedData = { data: JSON.parse(e.data), type: "message" };

      if (!parsedData.data.from) {
        port.postMessage(parsedData);
      } else {
        idToPortMap.get(e.data.from).postMessage(parsedData);
      }
    });

    port.addEventListener(
      "message",
      (ev) => {
        // Collect port information in the map
        idToPortMap.set(ev.data.from, port);
        sendToWebSocket(ev.data.data);
      },
      false
    );

    port.start();

    // We need this to notify the newly connected context to know
    // the current state of WS connection.
    sendWSState();
  },
  false
);

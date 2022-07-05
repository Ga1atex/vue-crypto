const connections = [];
self.onconnect = function (e) {
  const port = e.ports[0];
  connections.push(port);
  console.log(e, "123");

  port.onmessage = function (e) {
    var workerResult = "Result: " + e.data[0] * e.data[1];
    port.postMessage(workerResult);
  };
  port.start();
};

// const API_KEY = `f22a136a4626481601277a8e9da7a231469f3e5062a0b042e5c5b4ddee364dab`;
// const socket = new WebSocket(
//   `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
// );

// self.onconnect = (e) => {
//   const port = e.ports[0];

//   socket.addEventListener("message", (e) => {
//     if (e.data) {
//       port.postMessage(e.data);
//       return;
//     }
//   });

//   port.onmessage = function (e) {
//     var workerResult = "Result: " + e.data[0] * e.data[1];
//     port.postMessage(workerResult);
//   };
// };

// self.onmessage = (e) => {
//   message = e.data;

//   socket.send(message);
// };

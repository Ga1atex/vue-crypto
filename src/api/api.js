import "./socketWorker.js";

const API_KEY = `f22a136a4626481601277a8e9da7a231469f3e5062a0b042e5c5b4ddee364dab`;
const AGGREGATE_INDEX = "5";
const ERROR_CODE = "500";
const ERROR_MESSAGE = "INVALID_SUB";

const coinHandlers = new Map();
let ws = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

ws.addEventListener("message", (e) => {
  const {
    TYPE: answerType,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    MESSAGE: answerMessage,
    PARAMETER: param,
  } = JSON.parse(e.data);

  if (answerType === ERROR_CODE && answerMessage === ERROR_MESSAGE) {
    const currencyName = param.match(/5~CCCAGG~(\w+)~USD/i)[1];
    const handlers = coinHandlers.get(currencyName) ?? [];
    const setCoinError = handlers[1];
    setCoinError(currencyName, answerMessage);
    return;
  }
  if (answerType !== AGGREGATE_INDEX || newPrice === undefined) return;

  const handlers = coinHandlers.get(currency) ?? [];
  const updateCoinPrice = handlers[0];
  updateCoinPrice(newPrice);
});

export const requestCoins = async () => {
  const response = await fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  );

  const responseData = await response.json();

  return responseData;
};
// http way
// export const requestPrices = async () => {
//   if (coinHandlers.size === 0) return;
//   let coinNames;
//   if (Array.isArray(coinHandlers)) {
//     coinNames = coinHandlers.join(",");
//   } else if (coinHandlers instanceof Map) {
//     coinNames = Array.from(coinHandlers.keys()).join(",");
//   }

//   const f = await fetch(
//     // `https://min-api.cryptocompare.com/data/price?fsym=${coinNames}&tsyms=USD&api_key=${API_KEY}`
//     `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinNames}&tsyms=USD&api_key=${API_KEY}`
//   );

//   const fetchedData = await f.json();

//   Object.entries(fetchedData).forEach(([currency, newPrice]) => {
//     const handlers = coinHandlers.get(currency) ?? [];
//     handlers.forEach((fn) => fn(newPrice.USD));
//   });
//   return fetchedData;
// };

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

const messageToWS = (action, coinName, currency) => ({
  action: action,
  subs: [`5~CCCAGG~${coinName}~${currency}`],
});

export const subscribeToCoinOnWS = (coinName, currency = "USD") => {
  const message = messageToWS("SubAdd", coinName, currency);
  sendToWebSocket(message);
};

export const unsubscribeToCoinOnWS = (coinName, currency = "USD") => {
  const message = messageToWS("SubRemove", coinName, currency);
  sendToWebSocket(message);
};

export const subscribeToCoin = (coinName, cb) => {
  const subscribers = coinHandlers.get(coinName) || [];
  if (!subscribers.length) {
    subscribeToCoinOnWS(coinName);
  }
  if (Array.isArray(cb)) {
    coinHandlers.set(coinName, [...subscribers, ...cb]);
  } else {
    coinHandlers.set(coinName, [...subscribers, cb]);
  }
  // return () => {
  //   coinHandlers.set(
  //     coin,
  //     subscribers.filter((fn) => fn !== cb)
  //   );
  // };
};

export const unsubscribeToCoin = (coin) => {
  unsubscribeToCoinOnWS(coin);
  coinHandlers.delete(coin);
};

export const startSW = () => {
  const worker = new SharedWorker("./socketWorker.js");

  worker.port.onmessage = function (e) {
    console.log(e, "Message received from worker");
  };
};

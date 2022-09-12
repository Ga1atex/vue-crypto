import { v4 as uuidv4 } from "uuid";

const AGGREGATE_INDEX = "5";
const ERROR_CODE = "500";
const ERROR_MESSAGE = "INVALID_SUB";
const USD_SYMBOL = "USD";
// const BTC_SYMBOL = "BTC";
// let btcPrice;
// const coinsPricesInBTC = new Map();

const coinHandlers = new Map();

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

//   // coinNames
//   let fsyms;
//   if (Array.isArray(coinHandlers)) {
//     fsyms = coinHandlers.join(",");
//   } else if (coinHandlers instanceof Map) {
//     fsyms = Array.from(coinHandlers.keys()).join(",");
//   }

//   const url = new URL("https://min-api.cryptocompare.com/data/pricemulti");
//   const tsyms = "USD";

//   Object.entries({
//     fsyms,
//     tsyms,
//     API_KEY,
//   }).forEach(([key, value]) => {
//     if (value !== null) {
//       url.searchParams.append(key, value);
//     }
//   });

//   // const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${fsyms}&tsyms=USD&api_key=${API_KEY}`;
//   const f = await fetch(url);

//   const fetchedData = await f.json();

//   Object.entries(fetchedData).forEach(([currency, newPrice]) => {
//     const handlers = coinHandlers.get(currency) ?? [];
//     // handlers.forEach((fn) => fn(newPrice.USD));
//     handlers[0](newPrice.USD);
//   });

//   return fetchedData;
// };

const id = uuidv4();
const worker = new SharedWorker(new URL("./shared-worker", import.meta.url));

// const worker = new SharedWorker(
//   new URL(
//     "./shared-worker",
//     import.meta.url
//   ) /* webpackChunkName: 'shared-worker' */,
//   { type: "module" }
// );

worker.port.start();

let webSocketState; //= WebSocket.CONNECTING;

// export const startSW = () => {

worker.port.addEventListener(
  "message",
  (e) => {
    switch (e.data.type) {
      case "WSState":
        webSocketState = e.data.state;
        break;
      case "message":
        handleMessageFromPort(e.data);
        break;
    }
  },
  false
);

function handleMessageFromPort(data) {
  console.log(`This message is meant only for user with id: ${id}`, data);
}

const broadcastChannel = new BroadcastChannel("WebSocketChannel");
broadcastChannel.addEventListener("message", (event) => {
  switch (event.data.type) {
    case "WSState":
      webSocketState = event.data.state;
      break;
    case "message":
      handleBroadcast(event.data);
      break;
  }
});

// Listen to broadcasts from server
function handleBroadcast(e) {
  const {
    TYPE: answerType,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    MESSAGE: answerMessage,
    PARAMETER: msgFromWS,
    // TOSYMBOL: toCurrency,
  } = e.data;

  if (answerType === ERROR_CODE && answerMessage === ERROR_MESSAGE) {
    const currencyName = msgFromWS.match(/5~CCCAGG~(\w+)~USD/i)[1];
    const handlers = coinHandlers.get(currencyName) ?? [];
    // TODO: change from array to object so can call it from .errors
    const setCoinError = handlers[1];
    setCoinError(currencyName, answerMessage);
    return;
  }

  if (answerType !== AGGREGATE_INDEX || newPrice === undefined) return;

  const handlers = coinHandlers.get(currency) ?? [];
  const updateCoinPrice = handlers[0];
  updateCoinPrice(newPrice);
}
// if (answerType === ERROR_CODE) {
//   const fromCurrency = msgFromWS.split("~")[2];
//   const toCurrency = msgFromWS.split("~")[3];

//   if (toCurrency === USD_SYMBOL) {
//     subscribeToCoinOnWS(fromCurrency, BTC_SYMBOL);
//     //unsubscribeFromCoinOnWS(from, to);
//   } else {
//     // toCurrency === BTC - no price of coin in BTC (Invalid Sub)
//     const newPrice = "none";
//     const handlers = coinHandlers.get(fromCurrency) || [];
//     handlers.forEach((fn) => fn(newPrice));
//     //unsubscribeFromCoin(to, BTC_SYMBOL);
//   }
// }

// if (answerType === AGGREGATE_INDEX && newPrice) {
//   if (toCurrency === BTC_SYMBOL) {
//     coinsPricesInBTC.set(currency, newPrice);
//     recalculatePrices(currency);
//   } else if (currency !== BTC_SYMBOL) {
//     // coins price in USD
//     const handlers = coinHandlers.get(currency) || [];
//     handlers.forEach((fn) => fn(newPrice));
//   } else {
//     // price of btc changed
//     btcPrice = newPrice;

//     const btcHandlers = coinHandlers.get(currency) || [];
//     btcHandlers.forEach((fn) => fn(btcPrice));
//     recalculatePrices(currency);
//     if (!coinHandlers.size) {
//       unsubscribeFromCoinOnWS(BTC_SYMBOL, USD_SYMBOL);
//     }
//   }
// }
// }
// };

// function recalculatePrices(currency) {
//   if (!btcPrice) {
//     subscribeToCoinOnWS(BTC_SYMBOL, USD_SYMBOL);
//     return;
//   }

//   if (!coinsPricesInBTC || coinsPricesInBTC.size === 0) {
//     return;
//   }
//   // for all coins we have in coinsPricesInBTC call handlers with recalculeted price in USD
//   if (currency === BTC_SYMBOL) {
//     // if price of BTC changed
//     [...coinsPricesInBTC.keys()].forEach((coin) => {
//       const newPrice = coinsPricesInBTC.get(coin) * btcPrice;
//       const handlers = coinHandlers.get(coin) || [];
//       handlers.forEach((fn) => fn(newPrice));
//     });
//   } else {
//     //if price of currency in btc changed then we update the price
//     const newPrice = coinsPricesInBTC.get(currency) * btcPrice;
//     const handlers = coinHandlers.get(currency) || [];
//     handlers.forEach((fn) => fn(newPrice));
//   }
// }

const messageToWS = (action, coinName, currency) => ({
  action: action,
  subs: [`5~CCCAGG~${coinName}~${currency}`],
});

export const subscribeToCoinOnWS = (coinName, currency = USD_SYMBOL) => {
  const message = messageToWS("SubAdd", coinName, currency);
  postMessageToWSServer(message);
};

export const unsubscribeFromCoinOnWS = (coinName, currency = USD_SYMBOL) => {
  const message = messageToWS("SubRemove", coinName, currency);
  postMessageToWSServer(message);
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
  // can be used isntead of unsubscribe method
  // return () => {
  //   coinHandlers.set(
  //     coin,
  //     subscribers.filter((fn) => fn !== cb)
  //   );
  // };
};

export const unsubscribeFromCoin = (coin) => {
  unsubscribeFromCoinOnWS(coin);
  coinHandlers.delete(coin);
};

function postMessageToWSServer(message) {
  if (webSocketState === WebSocket.CONNECTING) {
    console.log("Still connecting to the server, try again later!");
  } else if (
    webSocketState === WebSocket.CLOSING ||
    webSocketState === WebSocket.CLOSED
  ) {
    console.log("Connection Closed!");
  } else {
    worker.port.postMessage({
      // Include the sender information as a uuid to get back the response
      from: id,
      data: message,
    });
  }
}

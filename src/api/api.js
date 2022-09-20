import { v4 as uuidv4 } from "uuid";

const AGGREGATE_INDEX = "5";
const ERROR_CODE = "500";
const ERROR_MESSAGE = "INVALID_SUB";
const USD_SYMBOL = "USD";

const coinHandlers = new Map();

export const requestCoins = async () => {
  const response = await fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  );

  const responseData = await response.json();

  return responseData;
};

const tabId = uuidv4();
const worker = new SharedWorker(new URL("./shared-worker", import.meta.url));

worker.port.start();

let webSocketState; //= WebSocket.CONNECTING;

worker.port.addEventListener(
  "message",
  (e) => {
    switch (e.data.type) {
      case "WSState":
        webSocketState = e.data.state;
        break;
      case "message":
        handleMessage(e.data);
        break;
    }
  },
  false
);

// Listen from shared worker
function handleMessage(e) {
  const {
    TYPE: answerType,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    MESSAGE: answerMessage,
    PARAMETER: param,
  } = e.data;

  if (answerType === ERROR_CODE && answerMessage === ERROR_MESSAGE) {
    // const fromCurrency = param.match(/5~CCCAGG~(\w+)~USD/i)[1];
    const fromCurrency = param.split("~")[2];
    const handlers = coinHandlers.get(fromCurrency) ?? {};

    const setCoinError = handlers?.fail;
    if (Array.isArray(setCoinError)) {
      setCoinError.forEach((fn) => fn(answerMessage));
    } else {
      setCoinError(answerMessage);
    }
    return;
  }

  if (answerType !== AGGREGATE_INDEX || newPrice === undefined) return;

  const handlers = coinHandlers.get(currency) ?? {};
  const updateCoinPrice = handlers?.success;
  if (Array.isArray(updateCoinPrice)) {
    updateCoinPrice.forEach((fn) => fn(newPrice));
  } else {
    updateCoinPrice(newPrice);
  }
}

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
  const subscribers = coinHandlers.get(coinName);

  if (!subscribers) {
    subscribeToCoinOnWS(coinName);
    coinHandlers.set(coinName, cb);
  } else {
    // adding new callbacks
    Object.entries(cb).forEach((item) => {
      const [reason, newCb] = item;
      const oldCb = subscribers[reason] || [];

      if (Array.isArray(oldCb)) {
        subscribers[reason] = [...oldCb, newCb];
      } else {
        subscribers[reason] = [oldCb, newCb];
      }
    });
    coinHandlers.set(coinName, subscribers);
  }
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
      from: tabId,
      data: message,
    });
  }
}

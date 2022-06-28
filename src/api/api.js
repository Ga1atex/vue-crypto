const API_KEY = `f22a136a4626481601277a8e9da7a231469f3e5062a0b042e5c5b4ddee364dab`;

const coinHandlers = new Map();

export const requestCoins = async () => {
  const response = await fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  );

  const responseData = await response.json();

  return responseData;
};

export const requestPrices = async () => {
  if (coinHandlers.size === 0) return;
  let coinNames;
  if (Array.isArray(coinHandlers)) {
    coinNames = coinHandlers.join(",");
  } else if (coinHandlers instanceof Map) {
    coinNames = Array.from(coinHandlers.keys()).join(",");
  }

  const f = await fetch(
    // `https://min-api.cryptocompare.com/data/price?fsym=${coinNames}&tsyms=USD&api_key=${API_KEY}`
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinNames}&tsyms=USD&api_key=${API_KEY}`
  );

  const fetchedData = await f.json();

  Object.entries(fetchedData).forEach(([currency, newPrice]) => {
    const handlers = coinHandlers.get(currency) ?? [];
    handlers.forEach((fn) => fn(newPrice.USD));
  });
  return fetchedData;
};

export const subscribeToCoin = (coin, cb) => {
  const subscribers = coinHandlers.get(coin) || [];
  coinHandlers.set(coin, [...subscribers, cb]);

  // return () => {
  //   coinHandlers.set(
  //     coin,
  //     subscribers.filter((fn) => fn !== cb)
  //   );
  // };
};

export const unsubscribeToCoin = (coin) => {
  coinHandlers.delete(coin);
};

requestPrices();
setInterval(requestPrices, 10000);

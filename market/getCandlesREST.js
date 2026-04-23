const axios = require("axios");

async function getCandlesREST(symbol) {
  const res = await axios.get(
    `https://data-api.binance.vision/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=15m&limit=200`
  );

  return res.data.map(c => ({
    time: c[0],
    open: +c[1],
    high: +c[2],
    low: +c[3],
    close: +c[4],
    volume: +c[5]
  }));
}

module.exports = { getCandlesREST };
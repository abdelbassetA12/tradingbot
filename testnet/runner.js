
const axios = require("axios");
const { process } = require("./trader");
const { updateTrades, getActiveTrade } = require("./positionManager");
async function getData(symbol) {
  try {
    const res = await axios.get(
      `https://morning-glade-0ee9.elhajiriabdelbasset2020.workers.dev?symbol=${symbol}&interval=15m&limit=200`
    );

    return res.data.map(c => ({
      time: c[0],
      open: +c[1],
      high: +c[2],
      low: +c[3],
      close: +c[4]
    }));

  } catch (err) {
    console.error(`[GET_DATA:${symbol}] ❌`, err.response?.data || err.message);
    return []; // 🔥 مهم
  }
}
/*
async function getData(symbol) {
  try {
  const res = await axios.get(
    `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=15m&limit=200`
    //https://api.binance.com/api/v3/klines
       
  );

  return res.data.map(c => ({
    time: c[0],
    open: +c[1],
    high: +c[2],
    low: +c[3],
    close: +c[4]
  }));
   } catch (err) {
    console.error(`[RUNNER_GET_DATA:${symbol}] ❌`, err.response?.data || err.message);
    return [];
  }
}
  */

async function run(symbols = ["BTCUSDT"]) {
  symbols.forEach(symbol => {
    setInterval(async () => {
  try {
    const data = await getData(symbol);

// 🔥 حماية من crash
if (!data || data.length === 0) {
  console.log(`[RUNNER:${symbol}] ⚠️ No data`);
  return;
}

const lastCandle = data[data.length - 1];
    //const data = await getData(symbol);
    //const lastCandle = data[data.length - 1];

    let activeTrade = getActiveTrade(symbol);

    if (!activeTrade) {
      await process(symbol, data);
    }

    activeTrade = getActiveTrade(symbol);
    updateTrades(lastCandle, activeTrade);

  } catch (err) {
    console.error("❌ runner error:", err.message);
  }
}, 5000);
   
  });
}

module.exports = { run };


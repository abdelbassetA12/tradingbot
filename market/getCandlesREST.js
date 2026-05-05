const axios = require("axios");

async function getCandlesREST(symbol) {
  try {
    const res = await axios.get(
      `https://morning-glade-0ee9.elhajiriabdelbasset2020.workers.dev?symbol=${symbol.toUpperCase()}&interval=15m&limit=200`
    );

    return res.data.map(c => ({
      time: c[0],
      open: +c[1],
      high: +c[2],
      low: +c[3],
      close: +c[4],
      volume: +c[5]
    }));

  } catch (err) {
   
    console.error("[CANDLES_REST] ❌ Error:", err.response?.data || err.message);
    return []; // 🔥 مهم: ما ترجعش crash
  }
}

module.exports = { getCandlesREST };
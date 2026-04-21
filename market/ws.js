const WebSocket = require("ws");

let candles = {}; // نخزن كل symbol بوحدو

function startWS(symbol = "btcusdt", interval = "15m") {
  const url = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;

  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log(`🟢 WebSocket connected: ${symbol}`);
  });

  ws.on("message", (data) => {
    const json = JSON.parse(data);
    const k = json.k;

    if (!k.x) return; // غير ملي الكندل يسد

    const candle = {
      time: k.t,
      open: +k.o,
      high: +k.h,
      low: +k.l,
      close: +k.c,
      volume: +k.v
    };

    if (!candles[symbol]) candles[symbol] = [];

    candles[symbol].push(candle);

    // نحافظو على آخر 500 فقط
    if (candles[symbol].length > 500) {
      candles[symbol].shift();
    }

    console.log(`📊 ${symbol} candle closed:`, candle.close);
  });

  ws.on("close", () => {
    console.log(`🔴 Reconnecting ${symbol}...`);
    setTimeout(() => startWS(symbol, interval), 3000);
  });

  ws.on("error", (err) => {
    console.log("❌ WS error:", err.message);
  });
}

function getCandles(symbol) {
  return candles[symbol] || [];
}

module.exports = { startWS, getCandles };
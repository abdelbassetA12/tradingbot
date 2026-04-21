// ================= BACKTEST =================
const { generateSignal } = require("./strategy");

function replayBacktest(data, balance = 1000) {
  let positions = [];
  let trades = [];

  const riskPercent = 0.01;
  let lastTradeIndex = -100;

  for (let i = 100; i < data.length; i++) {
    const slice = data.slice(0, i + 1);
    const { signal, trade } = generateSignal(slice);
    const candle = data[i];

    const alreadyOpen = positions.find(p => p.status === "OPEN");

    if (i - lastTradeIndex < 10) continue;

    if (!alreadyOpen && signal !== "HOLD" && signal !== "WAIT_FOR_RETEST" && trade) {
      const riskAmount = balance * riskPercent;

      // ⚠️ بدون ستوب لوس → حجم ثابت
      const positionSize = riskAmount;

      const spread = 0.0001;
      if (signal === "BUY") trade.entry += spread;
      if (signal === "SELL") trade.entry -= spread;

      positions.push({
        id: Date.now() + Math.random(),
        type: signal,
        entry: trade.entry,
        takeProfit: trade.takeProfit,
        size: positionSize,
        riskAmount,
        status: "OPEN",
        openTime: candle.time || candle.openTime
      });

      lastTradeIndex = i;
    }

    // ===== Manage Trades =====
    positions = positions.map(pos => {
      if (pos.status !== "OPEN") return pos;

      let profit = 0;

      // ===== Exit (TP فقط) =====
      if (pos.type === "BUY") {
        if (candle.high >= pos.takeProfit) {
          profit = Math.abs(pos.takeProfit - pos.entry) * pos.size;
          pos.status = "WIN";
          balance += profit;
          pos.profit = profit;
        }
      }

      if (pos.type === "SELL") {
        if (candle.low <= pos.takeProfit) {
          profit = Math.abs(pos.entry - pos.takeProfit) * pos.size;
          pos.status = "WIN";
          balance += profit;
          pos.profit = profit;
        }
      }

      if (pos.status !== "OPEN") {
        pos.closeTime = candle.time || candle.openTime;
        trades.push(pos);
      }

      return pos;
    });

    positions = positions.filter(p => p.status === "OPEN");
  }

  const wins = trades.filter(t => t.status === "WIN").length;

  return {
    balance: Number(balance.toFixed(2)),
    trades,
    stats: {
      total: trades.length,
      wins,
      losses: trades.length - wins,
      winrate: trades.length
        ? ((wins / trades.length) * 100).toFixed(2)
        : "0.00"
    }
  };
}

module.exports = { replayBacktest };



/*
const { generateSignal } = require("./strategy");

function replayBacktest(data, balance = 1000) {
  let positions = [];
  let trades = [];

  const riskPercent = 0.01;
  let lastTradeIndex = -100;

  for (let i = 100; i < data.length; i++) {
    const slice = data.slice(0, i + 1);
    const { signal, trade } = generateSignal(slice);
    const candle = data[i];

    const alreadyOpen = positions.find(p => p.status === "OPEN");

    if (i - lastTradeIndex < 10) continue;

    if (!alreadyOpen && signal !== "HOLD" && signal !== "WAIT_FOR_RETEST" && trade) {
      const riskAmount = balance * riskPercent;
      const riskPerUnit = Math.abs(trade.entry - trade.stopLoss);
      if (riskPerUnit === 0) continue;

      const positionSize = riskAmount / riskPerUnit;

      // ===== Spread =====
      const spread = 0.0001;
      if (signal === "BUY") trade.entry += spread;
      if (signal === "SELL") trade.entry -= spread;

      positions.push({
        id: Date.now() + Math.random(),
        type: signal,
        entry: trade.entry,
        stopLoss: trade.stopLoss,
        takeProfit: trade.takeProfit,
        size: positionSize,
        riskAmount,
        status: "OPEN",
        openTime: candle.time || candle.openTime
      });

      lastTradeIndex = i;
    }

    // ===== Manage Trades =====
    positions = positions.map(pos => {
      if (pos.status !== "OPEN") return pos;

      let profit = 0;
      let loss = 0;

      // ===== Break Even =====
      if (pos.type === "BUY") {
        if (candle.high >= pos.entry + (pos.entry - pos.stopLoss)) {
          pos.stopLoss = pos.entry;
        }
      }

      if (pos.type === "SELL") {
        if (candle.low <= pos.entry - (pos.stopLoss - pos.entry)) {
          pos.stopLoss = pos.entry;
        }
      }

      // ===== Exit =====
      if (pos.type === "BUY") {
        if (candle.low <= pos.stopLoss) {
          loss = Math.abs(pos.entry - pos.stopLoss) * pos.size;
          pos.status = "LOSS";
          balance -= loss;
          pos.profit = -loss;
        } else if (candle.high >= pos.takeProfit) {
          profit = Math.abs(pos.takeProfit - pos.entry) * pos.size;
          pos.status = "WIN";
          balance += profit;
          pos.profit = profit;
        }
      }

      if (pos.type === "SELL") {
        if (candle.high >= pos.stopLoss) {
          loss = Math.abs(pos.entry - pos.stopLoss) * pos.size;
          pos.status = "LOSS";
          balance -= loss;
          pos.profit = -loss;
        } else if (candle.low <= pos.takeProfit) {
          profit = Math.abs(pos.entry - pos.takeProfit) * pos.size;
          pos.status = "WIN";
          balance += profit;
          pos.profit = profit;
        }
      }

      if (pos.status !== "OPEN") {
        pos.closeTime = candle.time || candle.openTime;
        trades.push(pos);
      }

      return pos;
    });

    positions = positions.filter(p => p.status === "OPEN");
  }

  const wins = trades.filter(t => t.status === "WIN").length;

  return {
    balance: Number(balance.toFixed(2)),
    trades,
    stats: {
      total: trades.length,
      wins,
      losses: trades.length - wins,
      winrate: trades.length
        ? ((wins / trades.length) * 100).toFixed(2)
        : "0.00"
    }
  };
}

module.exports = { replayBacktest };
*/
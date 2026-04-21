// routes.js
const express = require("express");
const router = express.Router();
const { getTradesIncludingActive } = require("./positionManager");
const { getAccount, getMyTrades, getAllOrders, getAllOpenOrders } = require("./binanceClient");


function formatTrades(trades) {
  let results = [];
  let current = null;

  trades.sort((a, b) => a.time - b.time);

  trades.forEach(t => {
    if (t.isBuyer) {
      current = {
        symbol: t.symbol,
        entry: parseFloat(t.price),
        qty: parseFloat(t.qty),
        entryTime: t.time,
        status: "OPEN"
      };
    } 
    else if (current) {
      const exitTime = t.time;

      results.push({
        ...current,
        exit: parseFloat(t.price),
        exitTime,
        profit: (t.price - current.entry) * current.qty,
        duration: Math.round((exitTime - current.entryTime) / 60000), // بالدقائق
        status: "CLOSED",
        //result: "WIN"
        result: parseFloat(t.price) > current.entry ? "WIN" : "LOSS"
      });

      current = null;
    }
  });

  return results;
}


/*
function formatTrades(trades) {
  let results = [];
  let current = null;

  // 🔥 مهم: ترتيب حسب الوقت
  trades.sort((a, b) => a.time - b.time);

  trades.forEach(t => {
    if (t.isBuyer) {
      current = {
        symbol: t.symbol,
        entry: parseFloat(t.price),
        qty: parseFloat(t.qty),
        time: t.time,
        status: "OPEN"
      };
    } 
    else if (current) {
      results.push({
        ...current,
        exit: parseFloat(t.price),
        profit: (t.price - current.entry) * current.qty,
        status: "CLOSED",
        result: "WIN"
      });
      current = null;
    }
  });

  return results;
}
  */




router.get("/trades", (req, res) => {
  res.json(getTradesIncludingActive());
});


router.get("/balance", async (req, res) => {
  try {
    const account = await getAccount();
    // فلترة الرصيد اللي أكبر من صفر
  
    const balances = account.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
    res.json(balances);
  } catch (err) {
    console.error("Error fetching balance:", err.message || err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});





router.get("/trades/:symbol", async (req, res) => {
  try {
    const raw = await getMyTrades(req.params.symbol);

    const formatted = formatTrades(raw);

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.get("/trades-all", async (req, res) => {
  try {
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]; // تقدر توسعها

    let allTrades = [];

    for (let symbol of symbols) {
      const raw = await getMyTrades(symbol);
      const formatted = formatTrades(raw);

      allTrades = [...allTrades, ...formatted];
    }

    // 🔥 ترتيب: الأحدث أولاً
    allTrades.sort((a, b) => b.entryTime - a.entryTime);

    res.json(allTrades);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.get("/pending-orders/:symbol", async (req, res) => {
  try {
    const orders = await getAllOrders(req.params.symbol);

    const pending = orders.filter(o =>
      o.status === "NEW" || o.status === "PARTIALLY_FILLED"
    );

    res.json(pending);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






router.get("/open-orders", async (req, res) => {
  try {
    const orders = await getAllOpenOrders();
    res.json(orders);
  } catch (err) {
    console.error("OpenOrders Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

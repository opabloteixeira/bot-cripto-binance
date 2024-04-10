const axios = require("axios");
const crypto = require("crypto");

const API_URL = "https://testnet.binance.vision";//https://api.binance.com
const SYMBOL = "BTCUSDT";
const BUY_PRICE = 100000;
const SELL_PRICE = 100000;
const QUANTITY = "0.001";
const API_KEY = "XXX";//aprenda a criar as chaves: https://www.youtube.com/watch?v=-6bF6a6ecIs
const SECRET_KEY = "XXX";

let isOpened = false;

function calcSMA(data) {
    const closes = data.map(candle => parseFloat(candle[4]));
    const sum = closes.reduce((a, b) => a + b);
    return sum / data.length;
}

async function start() {
    const { data } = await axios.get(API_URL + "/api/v3/klines?limit=21&interval=15m&symbol=" + SYMBOL);
    const candle = data[data.length - 1];
    const price = parseFloat(candle[4]);

    console.clear();
    console.log("Price: " + price);

    const sma = calcSMA(data);
    console.log("SMA: " + sma);
    console.log("Is Opened? " + isOpened);

    if (price < (sma * 0.9) && isOpened === false) {
        isOpened = true;
        newOrder(SYMBOL, QUANTITY, "BUY");
    }
    else if (price > (sma * 1.1) && isOpened === true) {
        newOrder(SYMBOL, QUANTITY, "SELL");
        isOpened = false;
    }
}

async function newOrder(symbol, quantity, side) {
    const order = { symbol, quantity, side };
    order.type = "MARKET";
    order.timestamp = Date.now();

    const signature = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(new URLSearchParams(order).toString())
        .digest("hex");

    order.signature = signature;

    try {
        const { data } = await axios.post(
            API_URL + "/api/v3/order",
            new URLSearchParams(order).toString(),
            {
                headers: { "X-MBX-APIKEY": API_KEY }
            });

        console.log(data);
    } catch (err) {
        //para erros e soluções com essa API, consulte https://www.luiztools.com.br/post/erros-comuns-com-as-apis-da-binance/
        console.error(err.response.data);
    }
}

setInterval(start, 3000);

start();

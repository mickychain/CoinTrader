const hbsdk = require('./sdk/hbsdk');
const Binance = require('node-binance-api');

const binance = new Binance().options({
    APIKEY: 'i1yonipVVtP3KxwVCeYWvph02ozdJXo9ZqsgbPZ3UG5uNv33keDGhFhsQorKEmKx',
    APISECRET: 'E99hnjhKdKuRNf3fOKm67XEYlqm52CI1hLDQ51hrOVoZT1xVu8x8Ygdwr5a2r3hv',
    useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
    test: false // If you want to use sandbox mode where orders are simulated
});

console.log("=====hi=====")

var gotHuobi = false;
var gotBinance = false;
var trades = [];

function checkStat(exchangeName, data) {

    console.log(exchangeName + "=====");
    switch (exchangeName) {
        case "Huobi": {
            gotHuobi = true;
            data.forEach(rawTrade => {
                var trade = {
                    price: parseFloat(rawTrade.price),
                    qty: parseFloat(rawTrade["filled-amount"]), //买是+
                    hbpoints: parseFloat(rawTrade["filled-points"]),
                    time: parseFloat(rawTrade['created-at']),
                }
                if (rawTrade.type == 'sell-limit') {
                    trade.qty *= -1;
                }
                trades.push(trade);
            });
            break;
        }
        case "Binance": {
            console.log(data)
            gotBinance = true;
            if (data.forEach) {
                data.forEach(rawTrade => {
                    var trade = {
                        price: parseFloat(rawTrade.price),
                        qty: parseFloat(rawTrade.qty), //买是+
                        bnb: parseFloat(rawTrade.commission),
                        time: parseFloat(rawTrade.time),
                    }
                    if (!rawTrade.isBuyer) {
                        trade.qty *= -1;
                    }
                    trades.push(trade);
                });
            }
            break;
        }
    }
    if (gotHuobi && gotBinance) {
        calc(trades);
    }
}

function hborders() {
    hbsdk.get_match_results("manabtc", "2018-10-14", null, 100).then(function (data) {
        checkStat("Huobi", data);
    });
}

function bnOrders() {
    binance.trades("MANABTC", (error, trades, symbol) => {
        console.log(trades)
    }, {
            // startTime: 1539561600000,
            endTime: 1539849701474,
        });
}

function main(startDate, endData) {
    var startDataTimestamp = new Date(startDate).valueOf();
    var endDataTimestamp = (endData ? new Date(endData) : new Date()).valueOf();
    console.log(startDataTimestamp);

    hbsdk.get_match_results("manabtc", startDate, endData, 100).then(function (data) {
        checkStat("Huobi", data);
    });

    binance.trades("MANABTC", (error, trades, symbol) => {
        checkStat("Binance", trades);
    }, {
            startTime: startDataTimestamp,
            // endTime: endDataTimestamp,
        }
    );
}

function calc(trades) {
    var result = {
        BTC: 0,
        MANA: 0,
        HBPoint: 0,
        BNB: 0,
        buys: 0,
        sells: 0,
    }
    trades.forEach(trade => {
        result.MANA += trade.qty;
        if (trade.qty > 0) result.buys++;
        else result.sells--;
        result.BTC -= trade.price * trade.qty;
        if (trade.hbpoints) result.HBPoint -= trade.hbpoints;
        if (trade.bnb) result.BNB -= trade.bnb;
    });
    console.log(result);
}

// hborders();
// bnOrders();
main("2018-10-15")
const router = require("express").Router();

const mongoose = require("mongoose");

// Require the User model in order to interact with the database
const ExchangeAccount = require("../models/Exchange.model");
const User = require("../models/User.model");
const Session = require("../models/Session.model");
const Trade = require("../models/Trades.model");
const Order = require("../models/Orders.model");


// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");
const getBitsoData = require("../APIs/bitso_api")
const getFtxData = require("../APIs/ftx_api")

const calcAvgPrice = (arr) => {
    /* 
    Average Entry Price = Total number of contracts / Total contract value in BTC
    Total contract value in BTC = [(Quantity A / Price A) + (Quantity B / Price B) + (Quantity C / Price C) ...]
    */
    //tnc = Total number of contracts
    const tnc = arr.reduce((acc, cur) => {
        return acc + cur["contracts"]
    }, 0)

    //Total contract value
    const tcvArr = arr.map(elem => {
        return elem["contracts"] / elem["avgPriceOrder"]
    })

    const tcv = tcvArr.reduce((acc, cur) => acc + cur, 0)

    const AvgPrice = tnc / tcv
    //return tnc, AvgPrice, Total cost
    return [tnc, AvgPrice, tnc * AvgPrice]
}

const entryExitTrade = (obj) =>{
    const longSide = obj["orders"].filter(elem=>elem.side === "buy" || elem.side === "long")
    const shortSide = obj["orders"].filter(elem=>elem.side === "sell" || elem.side === "short")

    if(obj.side === "long"){
        const longPos = calcAvgPrice(longSide)
        const shortPos = calcAvgPrice(shortSide)
        obj.contracts = longPos[0]
        obj.avgEntry = longPos[1]
        obj.avgExit = shortPos[1]
        obj.profit = shortPos[2] - longPos[2]
    } else if(obj.side === "short"){
        const longPos = calcAvgPrice(longSide)
        const shortPos = calcAvgPrice(shortSide)
        obj.contracts = shortPos[0]
        obj.avgEntry = shortPos[1]
        obj.avgExit = longPos[1]
        obj.profit = longPos[2] -shortPos[2]
    }
    return obj
}

router.get("/", isLoggedIn, (req, res, next) => {

    const owner = req.user._id

    ExchangeAccount.find({ owner })
        .then(response => res.json(response))
        .catch(err => res.json(err))
})

router.post("/", isLoggedIn, (req, res, next) => {
    const { exchange, name, subAcc, apiKey, apiSecret } = req.body

    const owner = req.user

    ExchangeAccount.create({ exchange, name, subAcc, apiKey, apiSecret, owner, trades: [] })  //Session.user._id
        .then(async (newAccount) => {
            await User.findByIdAndUpdate(owner, { $push: { accounts: newAccount._id } })

            //API call to Pull information from exchange
            switch (newAccount.exchange) {
                case "Bitso":
                    const bitsoData = await getBitsoData(newAccount.apiKey, newAccount.apiSecret)
                    const bitsoOrderList = bitsoData.map((elem) => {
                        const symbol = `${elem.major_currency}/${elem.minor_currency}`
                        const user = owner
                        const account = newAccount._id
                        const type = "spot"
                        const side = elem.side
                        const contracts = elem.major
                        const avgPriceOrder = elem.price
                        const cost = elem.minor
                        const date = elem.created_at
                        const fees = elem.fees_amount
                        const orderId = elem.oid

                        const newOrder = { symbol, user, account, type, side, contracts, avgPriceOrder, cost, orderId, date, fees }

                        return newOrder
                    })

                    await Order.create(bitsoOrderList)
                        .then(async (order) => {
                            await User.findByIdAndUpdate(owner, { $push: { orders: order } })
                        })
                        .catch(err => console.log(err))
                    break;
                case "FTX":
                    const ftxData = await getFtxData(newAccount.apiKey, newAccount.apiSecret)

                    const ftxOrderList = ftxData.map((elem) => {
                        const symbol = elem.market
                        const future = elem.future
                        const user = owner
                        const account = newAccount._id
                        const type = future != null ? "margin" : "spot"
                        const side = elem.side
                        const contracts = elem.size
                        const avgPriceOrder = elem.price
                        const cost = elem.cost
                        const date = elem.time
                        const fees = elem.fee
                        const orderId = elem.orderId

                        const newOrder = { symbol, future, user, account, type, side, contracts, avgPriceOrder, cost, orderId, date, fees }

                        return newOrder
                    })

                    //Create Orders
                    await Order.create(ftxOrderList)
                        .then(async (order) => {
                            await User.findByIdAndUpdate(owner, { $push: { orders: order } })
                        })
                        .catch(err => res.json(err))

                    //Create Trade
                    Order.find({ account: newAccount }).sort({ date: 1 })
                        .then(async response => {
                            const openTrades = {}
                            const closedTrades = []

                            response.map(async (elem) => {

                                if (elem.type === "margin") {
                                    if (!Object.keys(openTrades).includes(elem.symbol)) {
                                        openTrades[elem.symbol] = { symbol: elem.symbol, user: owner, account: newAccount, type: elem.type, orders: [elem], contracts: elem.contracts, status: "open", entryDate: elem.date }
                                        if (elem.side === "buy" || elem.side === "long") {
                                            openTrades[elem.symbol]["side"] = "long"
                                        } else if (elem.side === "sell" || elem.side === "short") {
                                            openTrades[elem.symbol]["side"] = "short"
                                        }
                                        
                                    } else if (Object.keys(openTrades).includes(elem.symbol) && openTrades[elem.symbol]["status"] === "open") {
                                        if (elem.side === "long" || elem.side === "buy") {
                                            openTrades[elem.symbol]["contracts"] += elem.contracts
                                            openTrades[elem.symbol]["orders"].push(elem)
                                        } else if (elem.side === "short" || elem.side === "sell") {
                                            openTrades[elem.symbol]["contracts"] -= elem.contracts
                                            openTrades[elem.symbol]["orders"].push(elem)
                                            if (openTrades[elem.symbol]["contracts"] === 0) {
                                                openTrades[elem.symbol]["status"] = "closed"
                                                openTrades[elem.symbol]["exitDate"] = elem.date
                                                entryExitTrade(openTrades[elem.symbol])

                                                closedTrades.push(openTrades[elem.symbol])
                                                delete openTrades[elem.symbol]
                                            }
                                            
                                        }
                                    }
                                }

                            })

                            await Trade.create(closedTrades)
                                .then(async (trade) => await User.findByIdAndUpdate(owner, { $push: { trades: trade } }))
                                .catch(err => console.log(err))

                        })
                        .catch(err => console.log(err))

                    break;

            }


            return
        })
        .then(response => res.json(response))

        .catch(err => res.json(err))
})

router.delete("/:accountId", isLoggedIn, (req, res, next) => {
    const { accountId } = req.params

    const owner = req.user

    ExchangeAccount.findByIdAndDelete(accountId)
        .then(async deletedAccount => {
            await User.findByIdAndUpdate(owner, { $pull: { accounts: { $in: deletedAccount._id } } }, { new: true })
            Order.find({ account: deletedAccount._id })
                .then((elem) => {
                    elem.forEach((item) => User.findByIdAndUpdate(owner, { $pull: { orders: { $in: item._id } } }, { new: true }).then((ans) => console.log(ans)).catch((err) => console.log(err)))
                })
            Order.deleteMany({ account: { $in: deletedAccount._id } })
                .then(response => {
                    Order.find({ $pull: { orders: { $in: response } } })
                })
                .catch(err => console.log(err))

            Trade.find({ account: deletedAccount._id })
                .then((elem) => {
                    elem.forEach((item) => User.findByIdAndUpdate(owner, { $pull: { trades: { $in: item._id } } }, { new: true }).then((ans) => console.log(ans)).catch((err) => console.log(err)))
                })
            Trade.deleteMany({ account: { $in: deletedAccount._id } })
                .then(response => {
                    trades.find({ $pull: { orders: { $in: response } } })
                })
                .catch(err => console.log(err))
            return
        })
        .then(response => res.json(response))
        .catch(err => res.json(err))
})

module.exports = router;
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

router.get("/", isLoggedIn, (req, res,next)=>{

    const owner = req.user._id
    
    ExchangeAccount.find({owner})
    .then(response => res.json(response))
    .catch(err => res.json(err))
})

router.post("/", isLoggedIn, (req, res, next)=>{
    const { exchange, name, subAcc, apiKey, apiSecret } = req.body

    const owner = req.user

    ExchangeAccount.create({exchange, name, subAcc, apiKey, apiSecret, owner, trades: []})  //Session.user._id
    .then(async (newAccount) => {
        User.findByIdAndUpdate(owner, { $push: {accounts: newAccount._id}})

        //API call to Pull information from exchange
        switch (newAccount.exchange){
            case "Bitso":
                const accountData = await getBitsoData(newAccount.apiKey, newAccount.apiSecret)
                //console.log("apiaccountData:",accountData )
                const orderList = accountData.map( (elem)=>{
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

                    const newOrder =  { symbol, user, account, type, side, contracts, avgPriceOrder, cost,  orderId , date, fees }

                    return newOrder
                })
                console.log("orderlist:",orderList)
                await Order.create(orderList)
                    .then((order)=> {
                        console.log(order)
                        User.findByIdAndUpdate(owner, { $push: {orders: order}})
                    })
                    .catch(err => console.log(err))
                break;
            case "FTX":

                break;

        }

        
        return 
    })
    .then(response => res.json(response))

    .catch(err => res.json(err))
})

router.delete("/:accountId", isLoggedIn, (req, res, next) => {
    const {accountId} = req.params

    const owner = req.user

    ExchangeAccount.findByIdAndDelete(accountId)
    .then(deletedAccount => {
        User.findByIdAndUpdate(owner, { $pull: {accounts: {$in: deletedAccount._id}}})
        Order.deleteMany({account: {$in: deletedAccount._id}})
        .then(response=>console.log(response))
        .catch(err => console.log(err))
        return 
    })
    .then(response => res.json(response))
    .catch(err => res.json(err))
})

module.exports = router;
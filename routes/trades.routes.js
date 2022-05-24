const router = require("express").Router();

const mongoose = require("mongoose");

// Require the User model in order to interact with the database
const Order = require("../models/Orders.model");
const ExchangeAccount = require("../models/Exchange.model");
const User = require("../models/User.model");
const Session = require("../models/Session.model");
const Trade = require("../models/Trades.model");

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

router.get("/", (req, res, next)=>{
    //const user = req.user._id

/*     Order.find({account: "628c0ccae38e7b3e2b0b6274"}).sort({date: 1})
    .then(async response => {
        const openTrades = []
        res.json(response)
        response.map(async (elem)=>{
            if(elem.type === "margin"){
                if (!openTrades.includes(elem.symbol)) {
                    openTrades[elem.symbol]= {symbol: elem.symbol, type: elem.type, orders: [elem], contracts: elem.contracts, status: "open", entryDate: elem.date}
                } 
                if (openTrades[elem.symbol]["status"] === "open") {
                    if (elem.side === "long" || elem.side === "buy"){
                        openTrades[elem.symbol]["contracts"] += elem.contracts
                        openTrades[elem.symbol]["orders"].push(elem._id)
                    } else if (elem.side === "short" || elem.side === "sell"){
                        openTrades[elem.symbol]["contracts"] -= elem.contracts
                        openTrades[elem.symbol]["orders"].push(elem._id)
                        if (openTrades[elem.symbol]["contracts"] <= 0) {
                            openTrades[elem.symbol]["status"] = "closed"
                            openTrades[elem.symbol]["elem"] = elem.date
                        }
                    }
                }
            } 
        })
        console.log(Object.values(openTrades))
        await Trade.create(Object.values(openTrades))
        .then((result)=>console.log("trades created", result))
        .catch(err => console.log(err))
    })
    .catch(err => res.json(err)) */
    
    /* Trade.find({user})
    .then(response => res.json(response))
    .catch(err => res.json(err)) */
})

router.get("/orders", isLoggedIn, (req, res,next)=>{

    const owner = req.user._id

    Order.find({owner})
    .populate("account")
    .then(response => res.json(response))
    .catch(err => res.json(err))
})

router.get("/orders/:orderId", isLoggedIn, (req, res,next)=>{
console.log(req.params)
    const {orderId} = req.params

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        res.status(400).json({ message: 'Specified id is not valid' });
        return;
      }
    
    Order.findById(orderId)
    .populate("account")
    .then(response => res.json(response))
    .catch(err => res.json(err))
})

module.exports = router;
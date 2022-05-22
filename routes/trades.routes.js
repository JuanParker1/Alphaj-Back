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

router.get("/trades", (req, res, next)=>{
    const user = req.user._id
    
    Trade.find({user})
    .then(response => res.json(response))
    .catch(err => res.json(err))
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
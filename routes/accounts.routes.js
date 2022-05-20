const router = require("express").Router();

const mongoose = require("mongoose");

// Require the User model in order to interact with the database
const ExchangeAccount = require("../models/Exchange.model");
const User = require("../models/User.model");
const Session = require("../models/Session.model");
const Trade = require("../models/Trades.model");

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

router.get("/", isLoggedIn, (req, res,next)=>{

    const owner = req.user._id
    
    ExchangeAccount.find({owner})
    .then(response => res.json(response))
    .catch(err => res.json(err))
})

router.post("/", isLoggedIn, (req, res, next)=>{
    const { exchange, name, subAcc, apiKey, apiSecret } = req.body

    const owner = req.user

    console.log("requser",req.body)
    console.log( exchange, name, subAcc, apiKey, apiSecret )

    ExchangeAccount.create({exchange, name, subAcc, apiKey, apiSecret, owner, trades: []})  //Session.user._id
    .then(newAccount => {
        return User.findByIdAndUpdate(owner, { $push: {accounts: newAccount._id}})
    })
    .then(response => res.json(response))
    .catch(err => res.json(err))
})

router.delete("/:accountId", isLoggedIn, (req, res, next) => {
    const {accountId} = req.params

    const owner = req.user
    console.log("owner", owner)

    ExchangeAccount.findByIdAndDelete(accountId)
    .then(deletedAccount => {
        return User.findByIdAndUpdate(owner, { $pull: {accounts: {$in: deletedAccount._id}}})
    })
    .then(response => res.json(response))
    .catch(err => res.json(err))
})

module.exports = router;
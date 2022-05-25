const {Schema, model} = require("mongoose")

const TradeSchema = new Schema(
    {
        symbol: {
            type: String
        },
        user: {
            type: Schema.Types.ObjectId, 
            ref: 'User'            
        },
        account: {
            type: Schema.Types.ObjectId, 
            ref: 'ExchangeAccountConnection'            
        },
        type: {
            type: String,
            enum: ["spot", "margin"]
        },
        side: {
            type: String,
            enum: ["long", "short"]
        },
        contracts: Number,
        avgEntry: Number,
        avgExit: Number,
        cost: Number,
        profit: Number,
        orders: [{
            type: Schema.Types.ObjectId, 
            ref: 'Order'            
        }],
        entryDate: { type: Date, default: Date.now },
        exitDate: { type: Date, default: Date.now },
        length: Number,
        Fees: Number,
        funding: Number,
        strategies: [{
            type: Schema.Types.ObjectId, 
            ref: 'Strategy'    
        }],
        status:{
            type: String,
            enum: ["open", "closed"]
        }

    },
    {
      // this second object adds extra properties: `createdAt` and `updatedAt`
      timestamps: true,
    }
)

const Trade = model("Trade", TradeSchema)

module.exports = Trade
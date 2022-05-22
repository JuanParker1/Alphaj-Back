const {Schema, model} = require("mongoose")

const OrderSchema = new Schema(
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
            enum: ["long, short", "buy", "sell"]
        },
        contracts: Number,
        avgPriceOrder: Number,
        cost: Number,
        trade: {
            type: Schema.Types.ObjectId, 
            ref: 'Trade'            
        },
        orderId: String,
        date: { type: Date, default: Date.now },
        fees: Number,
        funding: Number,
        strategies: [{
            type: Schema.Types.ObjectId, 
            ref: 'Strategy'    
        }]
    },
    {
      // this second object adds extra properties: `createdAt` and `updatedAt`
      timestamps: true,
    }
)

const Order = model("Order", OrderSchema)

module.exports = Order
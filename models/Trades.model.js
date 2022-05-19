const {Schema, model} = require("mongoose")

const TradeSchema = new Schema(
    {
        Symbol: {
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
        side: {
            type: String,
            enum: ["Long, Short"]
        },
        
        contracts: Number,
        avgEntry: Number,
        avgExit: Number,
        cost: Number,
        profit: Number,
        orders: [Schema.Types.Mixed],   // <---- Another model?  {orderID, market, side, price, size, time, fee}
        entryDate: { type: Date, default: Date.now },
        exitDate: { type: Date, default: Date.now },
        length: Number,
        Fees: Number,
        funding: Number,
        profit: Number,
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

const Trade = model("Trade", TradeSchema)

module.exports = Trade
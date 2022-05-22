const {Schema, model} = require("mongoose")

const ExchangeAccountSchema = new Schema(
    {
        exchange: {
            type: String,
            enum: ["Bitso", "FTX"],
        },
        name: String,
        subAcc: String,
        apiKey: String,
        apiSecret: String,
        owner: {
            type: Schema.Types.ObjectId, 
            ref: 'User'            
        },
        trades: [{
            type: Schema.Types.ObjectId, 
            ref: 'Trade'            
        }],
        orders: [{
            type: Schema.Types.ObjectId, 
            ref: 'Order'            
        }]
    },
    {
      // this second object adds extra properties: `createdAt` and `updatedAt`
      timestamps: true,
    }
)

const ExchangeAccountConnection = model("ExchangeAccountConnection", ExchangeAccountSchema)

module.exports = ExchangeAccountConnection;
const {Schema, model} = require("mongoose")

const ExchangeAccountSchema = new Schema(
    {
        exchange: {
            type: String,
            enum: ["Bitso", "FTX"],
        },
        apiKey: String,
        apiSecret: String,
        owner: {
            type: Schema.Types.ObjectId, 
            ref: 'User'            
        },
        trades: [{
            type: Schema.Types.ObjectId, 
            ref: 'Trades'            
        }]
    },
    {
      // this second object adds extra properties: `createdAt` and `updatedAt`
      timestamps: true,
    }
)

const ExchangeAccountConnection = model("ExchangeConnection", ExchangeAccountSchema)

module.exports = ExchangeAccountConnection;
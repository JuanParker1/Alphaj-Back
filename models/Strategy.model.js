const {Schema, model} = require("mongoose")

const StrategySchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId, 
            ref: 'User'            
        },
        trades: [{
            type: Schema.Types.ObjectId, 
            ref: 'Trade'            
        }]
    },
    {
      // this second object adds extra properties: `createdAt` and `updatedAt`
      timestamps: true,
    }
)

const Strategy = model("Strategy", StrategySchema)

module.exports = Strategy
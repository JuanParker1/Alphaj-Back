const {Schema, model} = require("mongoose")

const commentSchema = new Schema(
    {
        text: String,
        user: {
            type: Schema.Types.ObjectId, 
            ref: 'User'            
        },
        trade: {
            type: Schema.Types.ObjectId, 
            ref: 'Trade',  
        }
    },
    {
        timestamps: true
    }
)

const Comment = model("Comment", commentSchema)


module.exports = Comment
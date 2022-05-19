const { Schema, model } = require("mongoose");

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'Username is required.']
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
      unique: true,
      lowercase: true
    },
    password: String,
    accounts: [{
      type: Schema.Types.ObjectId,
      ref: 'ExchangeAccountConnection'
    }],
    trades: [{
      type: Schema.Types.ObjectId,
      ref: 'Trade'
    }],
    strategies: [{
      type: Schema.Types.ObjectId,
      ref: 'Strategy'
    }]

  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;

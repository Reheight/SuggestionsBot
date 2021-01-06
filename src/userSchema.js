const { Schema, model } = require("mongoose");

const User = new Schema({
    DISCORD: String,
    POINTS: Number,
    MESSAGES: Number,
    SUBMISSIONS: Number
});

const UserModel = model('User', User);


module.exports = UserModel;
const { Schema, model } = require("mongoose");

const User = new Schema({
    DISCORD: String,
    POINTS: Number
});

const UserModel = model('User', User);


module.exports = UserModel;
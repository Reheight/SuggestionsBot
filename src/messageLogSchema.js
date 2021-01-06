const { Schema, model } = require("mongoose");

const Message = new Schema({
    AUTHOR: Number,
    DATE: {
        type: Date,
        default: Date.now
    },
    MESSAGE: String,
    CHANNEL: Number,
    MESSAGEID: Number,
    LINK: String
});

const MessageModel = model('MessageLog', Message);

module.exports = MessageModel;
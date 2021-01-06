const { Schema, model } = require("mongoose");

const Message = new Schema({
    AUTHOR: String,
    DATE: {
        type: Date,
        default: Date.now
    },
    MESSAGE: String,
    CHANNEL: String,
    MESSAGEID: String,
    LINK: String
});

const MessageModel = model('MessageLog', Message);

module.exports = MessageModel;
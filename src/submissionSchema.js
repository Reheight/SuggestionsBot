const { Schema, model } = require("mongoose");

const Submission = new Schema({
    NETWORK: String,
    AUTHOR: Number,
    SUBMISSION: String,
    DATE: {
        type: Date,
        default: Date.now
    },
    UPVOTES: Array,
    DOWNVOTES: Array,
    STATUS: Boolean,
    STAGE: Number,
    CHANNEL: Number,
    MESSAGE: Number,
    GUILD: Number
});

const SubmissionModel = model('Submission', Submission);

module.exports = SubmissionModel;
const { Schema, model } = require("mongoose");

const Submission = new Schema({
    NETWORK: String,
    AUTHOR: String,
    SUBMISSION: String,
    DATE: {
        type: Date,
        default: Date.now
    },
    UPVOTES: Array,
    DOWNVOTES: Array,
    STATUS: Boolean,
    STAGE: Number,
    CHANNEL: String,
    MESSAGE: String,
    GUILD: String
});

const SubmissionModel = model('Submission', Submission);

module.exports = SubmissionModel;
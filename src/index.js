// src/index.js

//#region Imports
require("dotenv").config();
const mongoose = require("mongoose");
const Discord = require("discord.js");
const config = require("./config");
const Submission = require("./submissionSchema");
const User = require("./userSchema");
const MessageLog = require("./messageLogSchema");
//#endregion

const DB_CON = "mongodb+srv://kangarooHop77:Nexus0nL1n3S3rv1c3511P@caretaker.cyhy0.mongodb.net/NexusSuggestions?retryWrites=true&w=majority";

//#region Objects
const bot = new Discord.Client();
//#endregion

//#region ENV deconstruction
const { BOT_TOKEN: TOKEN } = process.env;
//#endregion

//#region Bot is initialized
bot.on('ready', () => {
    bot.user.setActivity("your suggestions.", { type: "LISTENING" });

    instantiate();
});
//#endregion


const instantiate = async() => {
    mongoose.connect(
        DB_CON,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        }
    ).catch((err) => {
        bot.channels.cache.get("796449509756239902").send("<@&694265597055467560> <@&730850374403227659>",
            new Discord.MessageEmbed()
                .setTitle("**Error** - *MongoDB*")
                .setDescription("We encountered an error while connecting to the MongoDB database!")
                .addFields(
                    {
                        name: "Code",
                        value: err.code
                    },
                    {
                        name: "Codename",
                        value: err.codeName
                    }
                )
        );
    });
    
    mongoose.connection.on('error', (err) => {
        bot.channels.cache.get("796449509756239902").send("<@&694265597055467560> <@&730850374403227659>",
            new Discord.MessageEmbed()
                .setTitle("**Error** - *MongoDB*")
                .setDescription("We encountered an error while connecting to the MongoDB database!")
                .addFields(
                    {
                        name: "Code",
                        value: err.code
                    },
                    {
                        name: "Codename",
                        value: err.codeName
                    }
                )
        );

        
    });

    /* bot.guilds.cache.get("694113104845340733").members.cache.forEach(async (member) => {
        const recordExists = await User.exists({ DISCORD: member.id });
        
        console.log(member.id, recordExists)

        if (!recordExists)
            User.create(
                {
                    DISCORD: member.id,
                    POINTS: 0,
                    MESSAGES: 0,
                    SUBMISSIONS: 0
                }
            );
    }) */

    await messageListener();
}

const messageListener = async () => {
    await Submission
        .find(
            {
                STATUS: true
            }
        ).then(async (documents) => {
            await documents.forEach(async (document) => {
                const SUB_STAGE = document.get("STAGE");
                const SUB_CHANNEL = bot.channels.cache.get(document.get("CHANNEL"));
                const SUB_MESSAGE = await SUB_CHANNEL.messages.fetch(document.get("MESSAGE")).catch(async (err) => {
                    console.log("Attempted to fetch a message that seems to no longer exist -- now disabling in database for redundancy.");

                    await document.updateOne({ STATUS: false });
                });
                const SUB_AUTHOR = bot.users.cache.get(document.get("AUTHOR"));
                const SUB_NETWORK = document.get("NETWORK");
                const SUB_SUGGESTION = document.get("SUBMISSION");

                switch (SUB_STAGE) {
                    case 1:
                        await initPending(SUB_CHANNEL, SUB_MESSAGE, SUB_AUTHOR, SUB_NETWORK, SUB_SUGGESTION)
                        break;
                    case 2:
                        await initVoting(SUB_CHANNEL, SUB_MESSAGE, SUB_AUTHOR, SUB_NETWORK, SUB_SUGGESTION)
                        break;
                }
            })
        })
}

/**
 * Initialize Pending Suggestion
 * @param {Discord.TextChannel} channel 
 * @param {Discord.Message} message 
 * @param {Discord.User} author
 * @param {String} network
 * @param {String} suggestion
 */
async function initPending(channel, message, author, network, suggestion) {
    const guild = bot.guilds.cache.get("694113104845340733");

    let approval_embed = new Discord.MessageEmbed()
                    .setAuthor(guild.name, guild.iconURL())
                    .setTitle("Suggestion Submitted")
                    .setDescription(
                        `\`\`\`${suggestion}\`\`\``
                    )
                    .addField(
                        "Author",
                        `<@${author.id}>`
                    )
                    .addField(
                        "Network",
                        network
                    )
                    .setFooter("Nexus Online Sevices LLP")
                    .setColor(config.EMBED_COLOR)
                    .setTimestamp()

    const filter = (reaction, user) => {
        return ['749719451070365757', '749719451271823411'].includes(reaction.emoji.id) && user.id !== bot.user.id;
    };

    message.awaitReactions(
        filter,
        {
            max: 1,
        }).then((collected) => {
            message.delete().then(async () => {
                const reaction = collected.first();

                switch (reaction.emoji.id) {
                    case '749719451070365757':
                        approval_embed.addField(
                            "Status",
                            `Accepted`
                        );
                        
                        guild.channels.cache.get(config.HISTORY_CHANNEL)
                            .send(approval_embed);

                        let embedApproved = new Discord.MessageEmbed()
                            .setAuthor(guild.name, guild.iconURL())
                            .setTitle("Suggestion Approved")
                            .setDescription("Your suggesion has been approved is now being voted on by the community!")
                            .addField(
                                "Suggestion",
                                `\`${suggestion}\``
                            )
                            .setFooter("Nexus Online Sevices LLP")
                            .setColor(config.EMBED_COLOR)
                            .setTimestamp()

                        let embedCommunity = new Discord.MessageEmbed()
                            .setAuthor(guild.name, guild.iconURL())
                            .setTitle("Suggestion")
                            .setDescription(`\`\`\`${suggestion}\`\`\``)
                            .setFooter("Nexus Online Sevices LLP")
                            .setColor(config.EMBED_COLOR)
                            .setTimestamp()

                        author.send(author,
                            embedApproved);
                        
                        switch (network) {
                            case "AndysolAM":
                                guild.channels.cache.get(config.VOTING_CHANNELS.ANDYSOLAM)
                                    .send(embedCommunity)
                                    .then(async (msg) => {
                                        msg.react("<:Yes:749719451070365757>");
                                        msg.react("<:No:749719451271823411>");

                                        await Submission.findOneAndUpdate(
                                            { CHANNEL: config.APPROVAL_CHANNEL, MESSAGE: message.id, AUTHOR: author.id, STAGE: 1 },
                                            {
                                                CHANNEL: msg.channel.id,
                                                MESSAGE: msg.id,
                                                STAGE: 2
                                            }
                                        )

                                        const votersMap = [];
                                        const filterVote = (reaction, user) => !user.bot && user.id !== author.id && !votersMap.includes(user.id) && (['749719451070365757', '749719451271823411'].includes(reaction.emoji.id));
                                        const collector = msg.createReactionCollector(filterVote, {});

                                        return collector.on('collect', async (r, u) => {
                                            const userHasReacted = await Submission.findOne({
                                                CHANNEL: msg.channel.id,
                                                MESSAGE: msg.id,
                                                STAGE: 2
                                            }).then(document => (document.get("UPVOTES").includes(u.id) || (document.get("DOWNVOTES").includes(u.id)))).catch(() => true);

                                            if (userHasReacted)
                                                return;

                                            if (r.emoji.id === "749719451070365757") {
                                                await Submission.findOneAndUpdate(
                                                    { CHANNEL: msg.channel.id, MESSAGE: msg.id, STAGE: 2 },
                                                    {
                                                        $push : { UPVOTES: u.id }
                                                    }
                                                );
                                            }

                                            if (r.emoji.id === "749719451271823411") {
                                                await Submission.findOneAndUpdate(
                                                    { CHANNEL: msg.channel.id, MESSAGE: msg.id, STAGE: 2 },
                                                    {
                                                        $push : { DOWNVOTES: u.id }
                                                    }
                                                );
                                            }

                                            votersMap.push(u.id);

                                            await User.findOneAndUpdate(
                                                { DISCORD: u.id },
                                                { $inc: { POINTS: 1 } }
                                            );
                                        })
                                    })
                                break;
                            case "RustAcademy":
                                guild.channels.cache.get(config.VOTING_CHANNELS.RUSTACADEMY)
                                    .send(embedCommunity)
                                    .then(async msg => {
                                        msg.react("<:Yes:749719451070365757>");
                                        msg.react("<:No:749719451271823411>");

                                        await Submission.findOneAndUpdate(
                                            { CHANNEL: config.APPROVAL_CHANNEL, MESSAGE: message.id, AUTHOR: author.id, STAGE: 1 },
                                            {
                                                CHANNEL: msg.channel.id,
                                                MESSAGE: msg.id,
                                                STAGE: 2
                                            }
                                        )

                                        const votersMap = [];
                                        const filterVote = (reaction, user) => !user.bot && user.id !== author.id && !votersMap.includes(user.id) && (['749719451070365757', '749719451271823411'].includes(reaction.emoji.id));
                                        const collector = msg.createReactionCollector(filterVote, {});

                                        return collector.on('collect', async (r, u) => {
                                            const userHasReacted = await Submission.findOne({
                                                CHANNEL: msg.channel.id,
                                                MESSAGE: msg.id,
                                                STAGE: 2
                                            }).then(document => (document.get("UPVOTES").includes(u.id) || (document.get("DOWNVOTES").includes(u.id)))).catch(() => true);

                                            if (userHasReacted)
                                                return;

                                            if (r.emoji.id === "749719451070365757") {
                                                await Submission.findOneAndUpdate(
                                                    { CHANNEL: msg.channel.id, MESSAGE: msg.id, STAGE: 2 },
                                                    {
                                                        $push : { UPVOTES: u.id }
                                                    }
                                                );
                                            }

                                            if (r.emoji.id === "749719451271823411") {
                                                await Submission.findOneAndUpdate(
                                                    { CHANNEL: msg.channel.id, MESSAGE: msg.id, STAGE: 2 },
                                                    {
                                                        $push : { DOWNVOTES: u.id }
                                                    }
                                                );
                                            }

                                            votersMap.push(u.id);

                                            await User.findOneAndUpdate(
                                                { DISCORD: u.id },
                                                { $inc: { POINTS: 1 } }
                                            );
                                        })
                                    })
                                break;
                        }
                        break;
                    case '749719451271823411':
                        await Submission.findOneAndUpdate(
                            { MESSAGE: message.id, AUTHOR: author.id, STAGE: 1 },
                            {
                                STAGE: 1,
                                STATUS: false
                            }
                        )

                        approval_embed.addField(
                            "Status",
                            `Denied`
                        );
                        
                        guild.channels.cache.get(config.HISTORY_CHANNEL)
                            .send(approval_embed);

                        let embedDenied = new Discord.MessageEmbed()
                            .setAuthor(guild.name, guild.iconURL())
                            .setTitle("Suggestion Approved")
                            .setDescription("Your suggesion has been denied we apologize, feel free to submit more in the future though!")
                            .addField(
                                "Suggestion",
                                `\`${suggestion}\``
                            )
                            .setFooter("Nexus Online Sevices LLP")
                            .setColor(config.EMBED_COLOR)
                            .setTimestamp()
                        
                        author.send(author, embedDenied);
                        break;
                }
            })
        })
}

/**
 * Initialize Pending Suggestion
 * @param {Discord.TextChannel} channel 
 * @param {Discord.Message} message 
 * @param {Discord.User} author
 * @param {String} network
 * @param {String} suggestion
 */
async function initVoting(channel, message, author, network, suggestion) {
    const votersMap = [];
    const filterVote = (reaction, user) => !user.bot && user.id !== author.id && !votersMap.includes(user.id) && (['749719451070365757', '749719451271823411'].includes(reaction.emoji.id));
    const collector = message.createReactionCollector(filterVote, {});

    return collector.on('collect', async (r, u) => {
        const userHasReacted = await Submission.findOne({
            CHANNEL: message.channel.id,
            MESSAGE: message.id,
            STAGE: 2
        }).then(document => (document.get("UPVOTES").includes(u.id) || (document.get("DOWNVOTES").includes(u.id)))).catch(() => true);

        if (userHasReacted)
            return;

        if (r.emoji.id === "749719451070365757") {
            await Submission.findOneAndUpdate(
                { CHANNEL: message.channel.id, MESSAGE: message.id, STAGE: 2 },
                {
                    $push : { UPVOTES: u.id }
                }
            );
        }

        if (r.emoji.id === "749719451271823411") {
            await Submission.findOneAndUpdate(
                { CHANNEL: message.channel.id, MESSAGE: message.id, STAGE: 2 },
                {
                    $push : { DOWNVOTES: u.id }
                }
            );
        }

        votersMap.push(u.id);

        await User.findOneAndUpdate(
            { DISCORD: u.id },
            { $inc: { POINTS: 1 } }
        );
    })
}

bot.on('guildMemberAdd', async (member) => {
    const recordExists = await User.exists({ DISCORD: member.id });

    if (!recordExists)
        User.create(
            {
                DISCORD: member.id,
                POINTS: 0,
                MESSAGES: 0,
                SUBMISSIONS: 0
            }
        )
});

//#region Listening to messages.
bot.on('message', async (message) => {
    const author = message.author;
    const channel = message.channel;
    const guild = message.guild;
    const guildIdentifier = `694113104845340733`;

    if (!author.bot) {
        MessageLog.create(
            {
                AUTHOR: author.id,
                MESSAGE: message.content,
                CHANNEL: channel.id,
                MESSAGEID: message.id,
                LINK: `https://www.discord.com/channels/694113104845340733/${channel.id}/${message.id}`
            }
        )
    };

    const DISCUSSION_CHANNELS = [config.DISCUSSION_CHANNELS.ANDYSOLAM, config.DISCUSSION_CHANNELS.RUSTACADEMY];
    if (DISCUSSION_CHANNELS.includes(channel.id)) {
        const identifier = author.id;
        const recordExists = await User.exists({ DISCORD: identifier });

        if (recordExists) 
            await User.findOneAndUpdate(
                { DISCORD: identifier },
                { $inc: { POINTS: 0.05,  MESSAGES: 1 } }
            );

        return;
    }

    let embed;
    let approval_embed;

    try {
        switch (channel.id) {
            case config.SUBMISSION_CHANNELS.RUSTACADEMY:
                message.delete();
    
                embed = new Discord.MessageEmbed()
                    .setAuthor(guild.name, guild.iconURL())
                    .setTitle("Suggestion Submitted")
                    .setDescription("You have submitted your suggestion to RustAcademy, your submission will be either denied or approved by the staff team in the meantime!")
                    .addField(
                        "Suggestion",
                        `\`${message}\``
                    )
                    .setFooter("Nexus Online Sevices LLP")
                    .setColor(config.EMBED_COLOR)
                    .setTimestamp()
                
                author.send(`<@${author.id}>`, embed);
    
                approval_embed = new Discord.MessageEmbed()
                    .setAuthor(guild.name, guild.iconURL())
                    .setTitle("Suggestion Submitted")
                    .setDescription(
                        `\`\`\`${message}\`\`\``
                    )
                    .addField(
                        "Author",
                        `<@${author.id}>`
                    )
                    .addField(
                        "Network",
                        "RustAcademy"
                    )
                    .setFooter("Nexus Online Sevices LLP")
                    .setColor(config.EMBED_COLOR)
                    .setTimestamp()
    
                guild.channels.cache.get(config.APPROVAL_CHANNEL)
                        .send(approval_embed).then(msg => {    
                            const messageIdentifier = msg.id;
                            Submission.create({
                                NETWORK: "RustAcademy",
                                AUTHOR: author.id,
                                SUBMISSION: message.content,
                                UPVOTES: [],
                                DOWNVOTES: [],
                                STATUS: true,
                                STAGE: 1,
                                CHANNEL: config.APPROVAL_CHANNEL,
                                MESSAGE: messageIdentifier,
                                GUILD: guildIdentifier
                            });

                            msg.react("<:Yes:749719451070365757>");
                            msg.react("<:No:749719451271823411>");
    
                            const filter = (reaction, user) => {
                                return ['749719451070365757', '749719451271823411'].includes(reaction.emoji.id) && user.id !== bot.user.id;
                            };
    
                            msg.awaitReactions(
                                filter,
                                {
                                    max: 1,
                                }).then((collected) => {
                                    msg.delete().then(async () => {
                                        const reaction = collected.first();
    
                                        switch (reaction.emoji.id) {
                                            case '749719451070365757':
                                                const prevMSG = msg;

                                                let embedCommunity = new Discord.MessageEmbed()
                                                    .setAuthor(guild.name, guild.iconURL())
                                                    .setTitle("Suggestion")
                                                    .setDescription(`\`\`\`${message}\`\`\``)
                                                    .setFooter("Nexus Online Sevices LLP")
                                                    .setColor(config.EMBED_COLOR)
                                                    .setTimestamp()
                                                
                                                guild.channels.cache.get(config.VOTING_CHANNELS.RUSTACADEMY)
                                                    .send(embedCommunity)
                                                    .then(async msg => {
                                                        msg.react("<:Yes:749719451070365757>");
                                                        msg.react("<:No:749719451271823411>");

                                                        await Submission.findOneAndUpdate(
                                                            { CHANNEL: config.APPROVAL_CHANNEL, MESSAGE: prevMSG.id, AUTHOR: author.id, STAGE: 1 },
                                                            {
                                                                CHANNEL: msg.channel.id,
                                                                MESSAGE: msg.id,
                                                                STAGE: 2
                                                            }
                                                        )

                                                        const votersMap = [];
                                                        const filterVote = (reaction, user) => !user.bot && user.id !== author.id && !votersMap.includes(user.id) && (['749719451070365757', '749719451271823411'].includes(reaction.emoji.id));
                                                        const collector = msg.createReactionCollector(filterVote, {});

                                                        return collector.on('collect', async (r, u) => {
                                                            const userHasReacted = await Submission.findOne({
                                                                CHANNEL: msg.channel.id,
                                                                MESSAGE: msg.id,
                                                                STAGE: 2
                                                            }).then(document => (document.get("UPVOTES").includes(u.id) || (document.get("DOWNVOTES").includes(u.id)))).catch(() => true);

                                                            if (userHasReacted)
                                                                return;

                                                            if (r.emoji.id === "749719451070365757") {
                                                                await Submission.findOneAndUpdate(
                                                                    { CHANNEL: msg.channel.id, MESSAGE: msg.id, STAGE: 2 },
                                                                    {
                                                                        $push : { UPVOTES: u.id }
                                                                    }
                                                                );
                                                            }

                                                            if (r.emoji.id === "749719451271823411") {
                                                                await Submission.findOneAndUpdate(
                                                                    { CHANNEL: msg.channel.id, MESSAGE: msg.id, STAGE: 2 },
                                                                    {
                                                                        $push : { DOWNVOTES: u.id }
                                                                    }
                                                                );
                                                            }
                                                            
                                                            votersMap.push(u.id);

                                                            await User.findOneAndUpdate(
                                                                { DISCORD: u.id },
                                                                { $inc: { POINTS: 1 } }
                                                            );
                                                        })
                                                    })

                                                approval_embed.addField(
                                                    "Status",
                                                    `Accepted`
                                                );
                                                
                                                guild.channels.cache.get(config.HISTORY_CHANNEL)
                                                    .send(approval_embed);
    
                                                let embedApproved = new Discord.MessageEmbed()
                                                    .setAuthor(guild.name, guild.iconURL())
                                                    .setTitle("Suggestion Approved")
                                                    .setDescription("Your suggesion has been approved is now being voted on by the community!")
                                                    .addField(
                                                        "Suggestion",
                                                        `\`${message}\``
                                                    )
                                                    .setFooter("Nexus Online Sevices LLP")
                                                    .setColor(config.EMBED_COLOR)
                                                    .setTimestamp()
    
                                                author.send(author,
                                                    embedApproved);
                                                break;
                                            case '749719451271823411':
                                                await Submission.findOneAndUpdate(
                                                    { MESSAGE: msg.id, AUTHOR: author.id, STAGE: 1 },
                                                    {
                                                        STAGE: 1,
                                                        STATUS: false
                                                    }
                                                )

                                                approval_embed.addField(
                                                    "Status",
                                                    `Denied`
                                                );
                                                
                                                guild.channels.cache.get(config.HISTORY_CHANNEL)
                                                    .send(approval_embed);
    
                                                let embedDenied = new Discord.MessageEmbed()
                                                    .setAuthor(guild.name, guild.iconURL())
                                                    .setTitle("Suggestion Approved")
                                                    .setDescription("Your suggesion has been denied we apologize, feel free to submit more in the future though!")
                                                    .addField(
                                                        "Suggestion",
                                                        `\`${message}\``
                                                    )
                                                    .setFooter("Nexus Online Sevices LLP")
                                                    .setColor(config.EMBED_COLOR)
                                                    .setTimestamp()
                                                
                                                author.send(author, embedDenied);
                                                break;
                                        }
                                    })
                                })
                        });
                break;
            case config.SUBMISSION_CHANNELS.ANDYSOLAM:
                message.delete();
                
                embed = new Discord.MessageEmbed()
                    .setAuthor(guild.name, guild.iconURL())
                    .setTitle("Suggestion Submitted")
                    .setDescription("You have submitted your suggestion to AndysolAM, your submission will be either denied or approved by the staff team in the meantime!")
                    .addField(
                        "Suggestion",
                        `\`${message}\``
                    )
                    .setFooter("Nexus Online Sevices LLP")
                    .setColor(config.EMBED_COLOR)
                    .setTimestamp()
                
                author.send(`<@${author.id}>`, embed);
    
                approval_embed = new Discord.MessageEmbed()
                    .setAuthor(guild.name, guild.iconURL())
                    .setTitle("Suggestion Submitted")
                    .setDescription(
                        `\`\`\`${message}\`\`\``
                    )
                    .addField(
                        "Author",
                        `<@${author.id}>`
                    )
                    .addField(
                        "Network",
                        "AndysolAM"
                    )
                    .setFooter("Nexus Online Sevices LLP")
                    .setColor(config.EMBED_COLOR)
                    .setTimestamp()
    
                guild.channels.cache.get(config.APPROVAL_CHANNEL)
                        .send(approval_embed).then(msg => {
                            const messageIdentifier = msg.id;
                            Submission.create({
                                NETWORK: "AndysolAM",
                                AUTHOR: author.id,
                                SUBMISSION: message,
                                UPVOTES: [],
                                DOWNVOTES: [],
                                STATUS: true,
                                STAGE: 1,
                                CHANNEL: config.APPROVAL_CHANNEL,
                                MESSAGE: messageIdentifier,
                                GUILD: guildIdentifier
                            })
                            
                            msg.react("<:Yes:749719451070365757>");
                            msg.react("<:No:749719451271823411>");
    
                            const filter = (reaction, user) => {
                                return ['749719451070365757', '749719451271823411'].includes(reaction.emoji.id) && user.id !== bot.user.id;
                            };
    
                            msg.awaitReactions(
                                filter,
                                {
                                    max: 1,
                                }).then((collected, user) => {
                                    msg.delete().then(async () => {
                                        const reaction = collected.first();
    
                                        switch (reaction.emoji.id) {
                                            case '749719451070365757':
                                                const prevMSG = msg;
                                                let embedCommunity = new Discord.MessageEmbed()
                                                    .setAuthor(guild.name, guild.iconURL())
                                                    .setTitle("Suggestion")
                                                    .setDescription(`\`\`\`${message}\`\`\``)
                                                    .setFooter("Nexus Online Sevices LLP")
                                                    .setColor(config.EMBED_COLOR)
                                                    .setTimestamp()
                                                guild.channels.cache.get(config.VOTING_CHANNELS.ANDYSOLAM)
                                                    .send(embedCommunity)
                                                    .then(async msg => {
                                                        msg.react("<:Yes:749719451070365757>");
                                                        msg.react("<:No:749719451271823411>");

                                                        await Submission.findOneAndUpdate(
                                                            { CHANNEL: config.APPROVAL_CHANNEL, MESSAGE: prevMSG.id, AUTHOR: author.id, STAGE: 1 },
                                                            {
                                                                CHANNEL: msg.channel.id,
                                                                MESSAGE: msg.id,
                                                                STAGE: 2
                                                            }
                                                        )

                                                        const votersMap = [];
                                                        const filterVote = (reaction, user) => !user.bot && user.id !== author.id && !votersMap.includes(user.id) && (['749719451070365757', '749719451271823411'].includes(reaction.emoji.id));
                                                        const collector = msg.createReactionCollector(filterVote, {});

                                                        return collector.on('collect', async (r, u) => {
                                                            const userHasReacted = await Submission.findOne({
                                                                CHANNEL: msg.channel.id,
                                                                MESSAGE: msg.id,
                                                                STAGE: 2
                                                            }).then(document => (document.get("UPVOTES").includes(u.id) || (document.get("DOWNVOTES").includes(u.id)))).catch(() => true);

                                                            if (userHasReacted)
                                                                return;

                                                            if (r.emoji.id === "749719451070365757") {
                                                                await Submission.findOneAndUpdate(
                                                                    { CHANNEL: msg.channel.id, MESSAGE: msg.id, STAGE: 2 },
                                                                    {
                                                                        $push : { UPVOTES: u.id }
                                                                    }
                                                                );
                                                            }

                                                            if (r.emoji.id === "749719451271823411") {
                                                                await Submission.findOneAndUpdate(
                                                                    { CHANNEL: msg.channel.id, MESSAGE: msg.id, STAGE: 2 },
                                                                    {
                                                                        $push : { DOWNVOTES: u.id }
                                                                    }
                                                                );
                                                            }
                                                            
                                                            votersMap.push(u.id);

                                                            await User.findOneAndUpdate(
                                                                { DISCORD: u.id },
                                                                { $inc: { POINTS: 1 } }
                                                            );
                                                        })
                                                    })

                                                approval_embed.addField(
                                                    "Status",
                                                    `Accepted`
                                                );
                                                
                                                guild.channels.cache.get(config.HISTORY_CHANNEL)
                                                    .send(approval_embed);
    
                                                let embedApproved = new Discord.MessageEmbed()
                                                    .setAuthor(guild.name, guild.iconURL())
                                                    .setTitle("Suggestion Approved")
                                                    .setDescription("Your suggesion has been approved is now being voted on by the community!")
                                                    .addField(
                                                        "Suggestion",
                                                        `\`${message}\``
                                                    )
                                                    .setFooter("Nexus Online Sevices LLP")
                                                    .setColor(config.EMBED_COLOR)
                                                    .setTimestamp()
    
                                                author.send(author,
                                                    embedApproved);
                                                
                                                break;
                                            case '749719451271823411':
                                                await Submission.findOneAndUpdate(
                                                    { MESSAGE: msg.id, AUTHOR: author.id, STAGE: 1 },
                                                    {
                                                        STAGE: 1,
                                                        STATUS: false
                                                    }
                                                )

                                                approval_embed.addField(
                                                    "Status",
                                                    `Denied`
                                                );
                                                
                                                guild.channels.cache.get(config.HISTORY_CHANNEL)
                                                    .send(approval_embed);
    
                                                let embedDenied = new Discord.MessageEmbed()
                                                    .setAuthor(guild.name, guild.iconURL())
                                                    .setTitle("Suggestion Approved")
                                                    .setDescription("Your suggesion has been denied we apologize, feel free to submit more in the future though!")
                                                    .addField(
                                                        "Suggestion",
                                                        `\`${message}\``
                                                    )
                                                    .setFooter("Nexus Online Sevices LLP")
                                                    .setColor(config.EMBED_COLOR)
                                                    .setTimestamp()
                                                
                                                author.send(author, embedDenied);
                                                break;
                                        }
                                    })
                                })
                        });
                break;
        }
    } catch (error) {
        console.log(error);
    }
})
//#endregion

bot.login(TOKEN);

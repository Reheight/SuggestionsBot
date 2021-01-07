// src/index.js

//#region Imports
require("dotenv").config();
const mongoose = require("mongoose");
const Discord = require("discord.js");
const config = require("./config");
const Submission = require("./submissionSchema");
const User = require("./userSchema");
const MessageLog = require("./messageLogSchema");
const _ = require("lodash");
//#endregion

const DB_CON = "mongodb+srv://kangarooHop77:Nexus0nL1n3S3rv1c3511P@caretaker.cyhy0.mongodb.net/NexusSuggestions?retryWrites=true&w=majority";

//#region Objects
const bot = new Discord.Client();
//#endregion

//#region ENV deconstruction
const { BOT_TOKEN: TOKEN } = process.env;
//#endregion

//#region Bot is initialized
bot.on('ready', async () => {
    bot.user.setActivity("your suggestions.", { type: "LISTENING" });

    const guild = bot.guilds.cache.get("694113104845340733");

    const RoleAdjustment = await bot.channels.cache.get('796524172418351214').messages.fetch('796533243620753448');


    /* bot.channels.cache.get("796524172418351214").send(
        new Discord.MessageEmbed()
            .setTitle("**Role Adjustment**")
            .setAuthor(guild.name, guild.iconURL())
            .setDescription(
                `*Select the corresponding reactions that apply to you so you are able to access the appropriate resources.*
                
                <:andy:796531726540341268> - AndysolAM Servers
                <:RA:796531726561574974> - RustAcademy Servers

                **Note:** *Any abuse of this will not be tollerated.*`
            )
            .setFooter("Nexus Online Sevices LLP")
            .setColor(config.EMBED_COLOR)
            .setTimestamp()
    ).then((msg) => {
        msg.react("796531726540341268");
        msg.react("796531726561574974");
    }) */


    instantiate();
});
//#endregion

bot.on("messageReactionAdd", (r, u) => {
    const channel = "796524172418351214";
    const message = "796533243620753448";

    if (r.message.channel.id !== channel ||
        r.message.id !== message) return;

    switch (r.emoji.id) {
        case "796531726540341268":
            r.message.guild.member(u).roles.add("721838700035702974");
            break;
        case "796531726561574974":
            r.message.guild.member(u).roles.add("721838771372556428");
            break;
    }
});

bot.on("messageReactionRemove", (r, u) => {
    const channel = "796524172418351214";
    const message = "796533243620753448";

    if (r.message.channel.id !== channel ||
        r.message.id !== message) return;

    switch (r.emoji.id) {
        case "796531726540341268":
            r.message.guild.member(u).roles.remove("721838700035702974");
            break;
        case "796531726561574974":
            r.message.guild.member(u).roles.remove("721838771372556428");
            break;
    }
});


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
                        await User.findOneAndUpdate(
                            { DISCORD: author.id },
                            { $inc: { POINTS: 1, SUBMISSIONS: 1 } }
                        );

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
    
    await member.roles.add("739270885113856051");
});

//#region Listening to messages.
bot.on('message', async (message) => {
    const author = message.author;
    const channel = message.channel;
    const guild = message.guild;
    const guildIdentifier = `694113104845340733`;

    const prefix = "+";
    
    if (message.content.startsWith(prefix) && !message.author.bot) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        const member = guild.member(author);

        if (!member.roles.cache.some(r => [
            "730850374403227659",
            "694265597055467560",
            "722220601271386164",
            "775792319492128788"
        ].includes(r.id))) return;
        if (channel.id !== "796513972618395699") return;

        switch (command) {
            case "lookup":
                const identifier = message.mentions.users.size >= 1 ? message.mentions.users.first().id : args[0];

                const exists = await User.exists({ DISCORD: identifier }).catch(() => false);

                if (!exists) {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setTitle("**Error** - *Invalid Account*")
                        .setDescription("You attempted to lookup statistics about a player who we have no record of!")
                        .setFooter("Nexus Online Sevices LLP")
                        .setAuthor(guild.name, guild.iconURL())
                        .setColor(config.EMBED_COLOR)
                        .setTimestamp();
                    
                    message.reply(errorEmbed);
                } else {
                    await User.findOne({ DISCORD: identifier }).then(async (document) => {
                            const lookupEmbed = new Discord.MessageEmbed()
                            .setTitle(`**Lookup** - ${identifier}`)
                            .setAuthor(guild.name, guild.iconURL())
                            .setDescription("The results below are the most up to date!")
                            .addFields(
                                [
                                    {
                                        name: "Points",
                                        value: document.get("POINTS")
                                    },
                                    {
                                        name: "Messages",
                                        value: document.get("MESSAGES")
                                    },
                                    {
                                        name: "SUBMISSIONS",
                                        value: document.get("SUBMISSIONS")
                                    },
                                ]
                            )
                            .setFooter("Nexus Online Sevices LLP")
                            .setColor(config.EMBED_COLOR)
                            .setTimestamp();

                            message.reply(lookupEmbed);
                    })
                }
                break;
            case "collect":
                const collectConf = await message.channel.send(
                    new Discord.MessageEmbed()
                        .setTitle(`**Warning**`)
                        .setAuthor(guild.name, guild.iconURL())
                        .setDescription("If you do this you will end the current voting session, do you wish to continue?")
                        .setFooter("Nexus Online Sevices LLP")
                        .setColor(config.EMBED_COLOR)
                        .setTimestamp()
                );
                
                await collectConf.react("749719451070365757");
                await collectConf.react("749719451271823411");

                const collectFilter = (reaction, user) => !user.bot && user.id == message.author.id && (['749719451070365757', '749719451271823411'].includes(reaction.emoji.id));

                collectConf.awaitReactions(
                    collectFilter,
                    {
                        max: 1
                    }
                ).then(
                    async (collection) => {
                        const reaction = collection.first().emoji.id;

                        switch (reaction) {
                            case "749719451070365757":
                                await collectConf.delete();

                                const resultsMap = {
                                    AndysolAM: [],
                                    RustAcademy: []
                                };

                                await Submission
                                    .find(
                                        {
                                            STATUS: true,
                                            STAGE: 2
                                        }
                                    ).then(async (documents) => {
                                        await documents.forEach(async (document) => {
                                            const SUB_UPVOTES = document.get("UPVOTES");
                                            const SUB_DOWNVOTES = document.get("DOWNVOTES");
                                            const SUB_CHANNEL = bot.channels.cache.get(document.get("CHANNEL"));
                                            const SUB_MESSAGE = await SUB_CHANNEL.messages.fetch(document.get("MESSAGE")).catch(async (err) => {
                                                console.log("Attempted to fetch a message that seems to no longer exist -- now disabling in database for redundancy.");

                                                await document.updateOne({ STATUS: false });
                                            });
                                            const SUB_AUTHOR = bot.users.cache.get(document.get("AUTHOR"));
                                            const SUB_NETWORK = document.get("NETWORK");
                                            const SUB_SUGGESTION = document.get("SUBMISSION");

                                            const SUB_OBJECT = {
                                                AUTHOR: SUB_AUTHOR,
                                                MESSAGE: SUB_MESSAGE,
                                                CHANNEL: SUB_CHANNEL,
                                                SUGGESTION: SUB_SUGGESTION,
                                                UPVOTES: SUB_UPVOTES,
                                                DOWNVOTES: SUB_DOWNVOTES
                                            };

                                            switch (SUB_NETWORK) {
                                                case "AndysolAM":
                                                    resultsMap.AndysolAM.push(SUB_OBJECT);
                                                    break;
                                                case "RustAcademy":
                                                    resultsMap.RustAcademy.push(SUB_OBJECT);
                                                    break;
                                            }
                                        })
                                    })

                                    const results = new Discord.MessageEmbed()
                                                .setTitle(`**Vote Collection**`)
                                                .setAuthor(guild.name, guild.iconURL())
                                                .setDescription(
                                                    `__AndysolAM__ - *${resultsMap.AndysolAM.length} suggestions*
                                                    ${
                                                        resultsMap.AndysolAM.map(
                                                            (SUBMISSION) => `- ${SUBMISSION.SUGGESTION} **[${SUBMISSION.UPVOTES.length} : ${SUBMISSION.DOWNVOTES.length}]**`
                                                        ).join("\n")
                                                    }
                                                    __RustAcademy__ - *${resultsMap.RustAcademy.length} suggestions*
                                                    ${
                                                        resultsMap.RustAcademy.map(
                                                            (SUBMISSION) => `- ${SUBMISSION.SUGGESTION} **[${SUBMISSION.UPVOTES.length} : ${SUBMISSION.DOWNVOTES.length}]**`
                                                        ).join("\n")
                                                    }
                                                    `
                                                )
                                                .setFooter("Nexus Online Sevices LLP")
                                                .setColor(config.EMBED_COLOR)
                                                .setTimestamp()
                                            
                                            await bot.channels.cache.get("796758274455502885").send(results);

                                            const timer = ms => new Promise(res => setTimeout(res, ms));

                                            resultsMap.AndysolAM.forEach(
                                                async (SUBMISSION) => {
                                                    SUBMISSION.MESSAGE.delete();

                                                    await Submission.findOneAndUpdate(
                                                        {
                                                            STAGE: 2,
                                                            STATUS: true,
                                                            MESSAGE: SUBMISSION.MESSAGE.id,
                                                            CHANNEL: SUBMISSION.CHANNEL.id
                                                        },
                                                        {
                                                            STAGE: 3,
                                                            STATUS: false
                                                        }
                                                    );

                                                    await timer(1000);
                                                }
                                            );

                                            resultsMap.RustAcademy.forEach(
                                                async (SUBMISSION) => {
                                                    SUBMISSION.MESSAGE.delete();

                                                    await Submission.findOneAndUpdate(
                                                        {
                                                            STAGE: 2,
                                                            STATUS: true,
                                                            MESSAGE: SUBMISSION.MESSAGE.id,
                                                            CHANNEL: SUBMISSION.CHANNEL.id
                                                        },
                                                        {
                                                            STAGE: 3,
                                                            STATUS: false
                                                        }
                                                    );

                                                    await timer(1000);
                                                }
                                            );
                                break;
                            case "749719451271823411":
                                await collectConf.delete();
                                break;
                        }
                    }
                )

                break;
        }

        return;
    }
	
	/*
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
	*/

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
                                                await User.findOneAndUpdate(
                                                    { DISCORD: author.id },
                                                    { $inc: { POINTS: 1, SUBMISSIONS: 1 } }
                                                );

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
                                                await User.findOneAndUpdate(
                                                    { DISCORD: author.id },
                                                    { $inc: { POINTS: 1, SUBMISSIONS: 1 } }
                                                );

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

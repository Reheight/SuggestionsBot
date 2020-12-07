// src/index.js

//#region Imports
require("dotenv").config();

const Discord = require("discord.js");
const config = require("./config");
//#endregion

//#region Objects
const bot = new Discord.Client();
//#endregion

//#region ENV deconstruction
const { BOT_TOKEN: TOKEN } = process.env;
//#endregion

//#region Bot is initialized
bot.on('ready', () => {
    bot.user.setActivity("your suggestions.", { type: "LISTENING" });
});
//#endregion

//#region Listening to messages.
bot.on('message', (message) => {
    const author = message.author;
    const channel = message.channel;
    const guild = message.guild;

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
                                    msg.delete().then(() => {
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
                                                        `\`${message}\``
                                                    )
                                                    .setFooter("Nexus Online Sevices LLP")
                                                    .setColor(config.EMBED_COLOR)
                                                    .setTimestamp()
    
                                                let embedCommunity = new Discord.MessageEmbed()
                                                    .setAuthor(guild.name, guild.iconURL())
                                                    .setTitle("Suggestion")
                                                    .setDescription(`\`\`\`${message}\`\`\``)
                                                    .addField(
                                                        "Submitter",
                                                        `<@${author.id}>`
                                                    )
                                                    .setFooter("Nexus Online Sevices LLP")
                                                    .setColor(config.EMBED_COLOR)
                                                    .setTimestamp()
    
                                                author.send(author,
                                                    embedApproved);
                                                
                                                guild.channels.cache.get(config.VOTING_CHANNELS.RUSTACADEMY)
                                                    .send(embedCommunity)
                                                    .then(msg => {
                                                        msg.react("<:Yes:749719451070365757>");
                                                        msg.react("<:No:749719451271823411>");
                                                    })
                                                break;
                                            case '749719451271823411':
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
    
                guild.channels.cache.get(config.HISTORY_CHANNEL)
                        .send(approval_embed).then(msg => {
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
                                    msg.delete().then(() => {
                                        const reaction = collected.first();
    
                                        switch (reaction.emoji.id) {
                                            case '749719451070365757':
                                                console.log("Testing");
    
                                                approval_embed.addField(
                                                    "Status",
                                                    `Accepted`
                                                );
                                                
                                                guild.channels.cache.get(config.APPROVAL_CHANNEL)
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
    
                                                let embedCommunity = new Discord.MessageEmbed()
                                                    .setAuthor(guild.name, guild.iconURL())
                                                    .setTitle("Suggestion")
                                                    .setDescription(`\`\`\`${message}\`\`\``)
                                                    .addField(
                                                        "Submitter",
                                                        `<@${author.id}>`
                                                    )
                                                    .setFooter("Nexus Online Sevices LLP")
                                                    .setColor(config.EMBED_COLOR)
                                                    .setTimestamp()
    
                                                author.send(author,
                                                    embedApproved);
                                                
                                                guild.channels.cache.get(config.VOTING_CHANNELS.ANDYSOLAM)
                                                    .send(embedCommunity)
                                                    .then(msg => {
                                                        msg.react("<:Yes:749719451070365757>");
                                                        msg.react("<:No:749719451271823411>");
                                                    })
                                                break;
                                            case '749719451271823411':
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
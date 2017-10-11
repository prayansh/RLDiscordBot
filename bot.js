var bot = require('./discordClient.js');

var ladderCommand = require('./command/ladder.js');
var rankCommand = require('./command/rank.js');
var registerCommand = require('./command/register.js');
var updateCommand = require('./command/update.js');

// Create a database proxy, and connect straight away:
var db = require('./db.js');
db.connect();

// Configure logger settings
var logger = require('winston');
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Add message handling for the bot:
bot.on('message', function (message) {
    if (message.author.bot) return;

    var discordName = message.member.nickname;
    var discordID = message.member.id.toString();

    if (message.content.substring(0, 1) === '?') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
        var argsLeft = args.slice(1);
        message.channel.startTyping();
        switch (cmd) {
            // case 'debug': {
            //     logger.debug("Discord Name=" + discordName);
            //     logger.debug("Discord Id=" + discordID);
            //     logger.debug("Channel ID=" + channelID);
            //     logger.debug("Message=" + JSON.stringify(message));
            //     break;
            // }
            case 'update': {
                updateCommand.run(discordName, discordID, message, argsLeft);
                break;
            }
            case 'rank': {
                rankCommand.run(discordName, discordID, message, argsLeft);
                break;
            }
            case 'register': {
                registerCommand.run(discordName, discordID, message, argsLeft);
                break;
            }
            case 'ladder': {
                ladderCommand.run(discordName, discordID, message, argsLeft);
                break;
            }
            // Just add any case commands if you want to..
        }
        message.channel.stopTyping();
    }
});

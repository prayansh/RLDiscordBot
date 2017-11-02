var bot = require('./discordClient.js');
var consts = require('./consts.js');
if (consts.CurrentSeason === undefined) {
    console.log("Please provide a CURRENT_SEASON value");
    process.exit(1);
}

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

    var discordName = message.member.displayName;
    var discordID = message.member.id.toString();

    if (message.content.substring(0, 1) === '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
        var argsLeft = args.slice(1);
        message.channel.startTyping();
        logger.info("Running command: " + cmd);
        switch (cmd) {
            case 'debug': {
                logger.debug("Discord Name=" + discordName);
                logger.debug("Discord Id=" + discordID);
                logger.debug("Channel ID=" + message.channel.id);
                logger.debug("Message=" + message.content);
                break;
            }
            case 'shutup': {
                message.channel.stopTyping();
                break;
            }
            case 'stfu': {
                message.channel.stopTyping();
                break;
            }
            case 'update': {
                updateCommand.run(discordName, discordID, message, argsLeft, () => message.channel.stopTyping());
                break;
            }
            case 'rank': {
                rankCommand.run(discordName, discordID, message, argsLeft, () => message.channel.stopTyping());
                break;
            }
            case 'register': {
                registerCommand.run(discordName, discordID, message, argsLeft, () => message.channel.stopTyping());
                break;
            }
            case 'ladder': {
                ladderCommand.run(discordName, discordID, message, argsLeft, () => message.channel.stopTyping());
                break;
            }
            // Just add any case commands if you want to..
        }

    }
});

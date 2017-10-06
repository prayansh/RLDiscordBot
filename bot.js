var bot = require('./discordClient.js');

var rankCommand = require('./command/rank.js');
var updateCommand = require('./command/update.js');
var registerCommand = require('./command/register.js');

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
bot.on('message', function (discordName, discordID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '>') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var argsLeft = args.slice(1);
        switch (cmd) {
            case 'debug': {
                logger.debug("Discord Name=" + discordName);
                logger.debug("Discord Id=" + discordID);
                logger.debug("Channel ID=" + channelID);
                logger.debug("Message=" + JSON.stringify(message));
                break;
            }
            case 'update': {
                updateCommand.run(discordName, discordID, channelID, message, evt, argsLeft);
                break;
            }
            case 'rank': {
                rankCommand.run(discordName, discordID, channelID, message, evt, argsLeft);
                break;
            }
            case 'register': {
                registerCommand.run(discordName, discordID, channelID, message, evt, argsLeft);
                break;
            }
            // Just add any case commands if you want to..
        }
    }
});

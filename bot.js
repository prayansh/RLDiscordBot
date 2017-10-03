var db = require('./db.js');
db.connect();

var auth = require('./auth.js');
var consts = require('./consts.js');
var rankCommand = require('./command/rank.js');

var Discord = require('discord.io');
var logger = require('winston');
var rls = require('rls-api');
var RLClient = new rls.Client({
    token: auth.getAuth('rl')
});


var currentSeason = process.env.CURRENT_SEASON;
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.getAuth('discord'),
    autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (discordName, discordID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
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
                db.User.findOne({'discordId': discordID}, function (err, user) {
                    if (user) {
                        logger.debug("Getting rank for " + user.name);
                        getStats(user.steamId, user.platform).then(
                            function (response) {
                                var _seasonData = response["rankedSeasons"][currentSeason];
                                var newSeasonStats = {
                                    "Duel": _seasonData["10"],
                                    "Doubles": _seasonData["11"],
                                    "Standard": _seasonData["13"],
                                    "Solo": _seasonData["12"]
                                };
                                db.Season.findOne({'discordId': discordID}, function (err, _oldSeasonStats) {
                                    var oldSeasonStats = JSON.parse(JSON.stringify(_oldSeasonStats.data));
                                    if (!err) {
                                        bot.sendMessage({
                                            to: channelID,
                                            embed: {
                                                color: consts.Color.GREEN,
                                                title: 'Updates for ' + user.name,
                                                description: formatting.old2newText(oldSeasonStats, newSeasonStats, argsLeft)
                                            }
                                        });
                                        db.Season.findOneAndUpdate({'discordId': discordID},
                                            {"data": newSeasonStats}, function (err, doc) {
                                                if (err) {
                                                    logger.error("Couldnt update record");
                                                }
                                            });
                                    } else {
                                        logger.error("Error finding season");
                                    }
                                });

                            });
                    }
                    else {
                        bot.sendMessage({
                            to: channelID,
                            message: "No user with name=" + queryParam + " found"
                        });
                    }
                });
                break;
            }
            case 'rank': {
                rankCommand.run(discordName, discordID, channelID, message, evt);
                break;
            }
            case 'register': {
                if (!args[1] || !args[2]) {
                    bot.sendMessage({
                        to: channelID,
                        message: "The usage is !register player-name platform"
                    });
                    break;
                }
                db.User.findOne({'discordId': discordID}, function (err, user) {
                    if (!user) {
                        logger.debug("Registering player=" + args[1] + ", platform=" + consts.Platforms[args[2]]);
                        getStats(args[1], consts.Platforms[args[2].toUpperCase()]).then(
                            function (data) {
                                var newUser = new User({
                                    "discordId": discordID,
                                    "steamId": data.uniqueId,
                                    "name": data.displayName,
                                    "platform": consts.Platforms[args[2].toUpperCase()]
                                });
                                newUser.save(function (err) {
                                    logger.debug("new user registered: " + JSON.stringify(err));
                                    bot.sendMessage({
                                        to: channelID,
                                        embed: {
                                            color: consts.Color.BLUE,
                                            title: 'Registration Success',
                                            description: "You have been registered"
                                        }
                                    });
                                });
                                var _seasonData = data["rankedSeasons"][currentSeason];
                                var seasonData = {
                                    "Duel": _seasonData["10"],
                                    "Doubles": _seasonData["11"],
                                    "Standard": _seasonData["13"],
                                    "Solo": _seasonData["12"]
                                };
                                var newSeasonStat = new Season({
                                    "discordId": discordID,
                                    "data": seasonData
                                });
                                newSeasonStat.save(function (err) {
                                    logger.debug("season data added");
                                })
                            },
                            function (err) {
                                bot.sendMessage({
                                    to: channelID,
                                    embed: {
                                        color: consts.Color.RED,
                                        title: 'Registration Failed',
                                        description: "Cannot find player " + args[1] + " for platform " + args[2]
                                    }
                                });
                            }
                        );
                    } else {
                        bot.sendMessage({
                            to: channelID,
                            message: "User already registered as " + user.name
                        })
                    }
                });
                break;
            }
            // Just add any case commands if you want to..
        }
    }
});

function getStats(steamId, platform) {
    return new Promise(function (resolve, reject) {
        RLClient.getPlayer(steamId, platform, function (status, data) {
            logger.debug(status);
            if (status === 200) {
                resolve(data);
            }
            else {
                reject(status);
            }
        });
    });
}

var auth = require('./auth.json');
var properties = require('./properties.json');

// Mongo Code
var mongoose = require('mongoose');
// Mongoose Schema definition
var userSchema = new mongoose.Schema({
    steamId: String,
    discordId: String,
    name: String,
    platform: Number
});

var seasonStatSchema = new mongoose.Schema({
    discordId: String,
    data: Object
});

User = mongoose.model('UsersDB', userSchema);
Season = mongoose.model('SeasonStatsDB', seasonStatSchema);

var uri = "mongodb://"
        + properties.mongo_user + ":" + auth.mongo_pass + "@"
        + "rldiscordbot-shard-00-00-k9ogi.mongodb.net:27017"
        + ",rldiscordbot-shard-00-01-k9ogi.mongodb.net:27017"
        + ",rldiscordbot-shard-00-02-k9ogi.mongodb.net:27017"
        + "/" + properties.mongo_db
        + "?ssl=true&replicaSet=RLDiscordBot-shard-0&authSource=admin"
    ;

mongoose.connect(uri, function (err) {
    if (err) console.error(err);
    else console.log('mongo connected');
});
// End of Mongo Code

var Discord = require('discord.io');
var logger = require('winston');
var rls = require('rls-api');
var RLClient = new rls.Client({
    token: auth.rl_token
});

var Color = {
    RED: 0xe74c3c,
    BLUE: 0x3498db,
    GREEN: 0x2ecc71
};

var platforms = {
    "PC": 1,
    "PS4": 2,
    "XBOX": 3
};
var currentSeason = 5;
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.discord_token,
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
        switch (cmd) {
            case 'update': {
                User.findOne({'discordId': discordID}, function (err, user) {
                    if (user) {
                        logger.debug("Getting rank for " + user.name);
                        getStats(user.steamId, user.platform).then(
                            function (response) {
                                var _seasonData = response["rankedSeasons"][currentSeason];
                                var newSeasonStats = {
                                    "Duel": _seasonData["10"],
                                    "Doubles": _seasonData["11"],
                                    "Standard": _seasonData["12"],
                                    "Solo": _seasonData["13"]
                                };
                                Season.findOne({'discordId': discordID}, function (err, _oldSeasonStats) {
                                    var oldSeasonStats = JSON.parse(JSON.stringify(_oldSeasonStats.data));
                                    if (!err) {
                                        bot.sendMessage({
                                            to: channelID,
                                            embed: {
                                                color: Color.GREEN,
                                                title: 'Your updates',
                                                description: old2newText(oldSeasonStats, newSeasonStats)
                                            }
                                        });
                                        _oldSeasonStats.data = newSeasonStats;
                                    }

                                });

                            });
                    }
                });
                break;
            }
            case 'rank': {
                User.findOne({'discordId': discordID}, function (err, user) {
                    if (user) {
                        logger.debug("Getting update for " + user.name);
                        getStats(user.steamId, user.platform).then(
                            function (response) {
                                bot.sendMessage({
                                    to: channelID,
                                    embed: {
                                        color: Color.GREEN,
                                        title: 'Your season ranks',
                                        description: seasonRankToText(response)
                                    }
                                });
                                var _seasonData = response["rankedSeasons"][currentSeason];
                                var seasonData = {
                                    "Duel": _seasonData["10"],
                                    "Doubles": _seasonData["11"],
                                    "Standard": _seasonData["12"],
                                    "Solo": _seasonData["13"]
                                };
                                Season.findOneAndUpdate({'discordId': discordID},
                                    {"data": seasonData});
                            });
                    }
                });
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
                User.findOne({'discordId': discordID}, function (err, user) {
                    if (!user) {
                        logger.debug("Registering player=" + args[1] + ", platform=" + platforms[args[2]]);
                        getStats(args[1], platforms[args[2]]).then(
                            function (data) {
                                var newUser = new User({
                                    "discordId": discordID,
                                    "steamId": data.uniqueId,
                                    "name": data.displayName,
                                    "platform": platforms[args[2]]
                                });
                                newUser.save(function (err) {
                                    logger.debug("new user registered: " + JSON.stringify(err));
                                    bot.sendMessage({
                                        to: channelID,
                                        embed: {
                                            color: Color.BLUE,
                                            title: 'Registration Sucess',
                                            description: "You have been registered"
                                        }
                                    });
                                });
                                var _seasonData = data["rankedSeasons"][currentSeason];
                                var seasonData = {
                                    "Duel": _seasonData["10"],
                                    "Doubles": _seasonData["11"],
                                    "Standard": _seasonData["12"],
                                    "Solo": _seasonData["13"]
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
                                        color: Color.RED,
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
            case 'list': {
                User.find({}, function (err, users) {
                    if (users instanceof Array) {
                        var message = "";
                        users.forEach(function (user) {

                        });
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


// Formatting logic below
const tierNames = [
    '<:unranked:360259883443945472>',
    '<:bronze1:360258827293032450>', '<:bronze2:360258828647792640>', '<:bronze3:360258827838423040>',
    '<:silver1:360258826882252800>', '<:silver2:360258827716788225>', '<:silver3:360258827855200256>',
    '<:gold1:360258826697441281>', '<:gold2:360258827804737566>', ': <:gold3:360258827125260291>',
    '<:plat1:360258827863457792>', '<:plat2:360258827859394560>', '<:plat3:360258827851137024>',
    '<:diamond1:360258827481776129>', '<:diamond2:360258827427250183>', '<:diamond3:360258827750342658>',
    '<:champ1:360258826642915328>', '<:champ2:360258826928259074>', '<:champ3:360258826127147009>',
    '<:grand_chump:360258827930697729>'
];
function emojiForTier(tier) {
    tier = tier | 0;
    return tierNames[tier];
}

function rankOrEmpty(name, obj) {
    if (!obj || !obj.tier) {
        return '';
    }
    return name + emojiForTier(obj.tier) + ' , div ' + (obj.division + 1) + '\n';
}

function seasonRankToText(playerData) {
    var season5 = playerData.rankedSeasons[currentSeason];
    var formatted = ' \n';
    if (season5) {
        formatted += rankOrEmpty("Duel: ", season5["10"])
            + rankOrEmpty("Doubles: ", season5["11"])
            + rankOrEmpty("Solo: ", season5["12"])
            + rankOrEmpty("Standard: ", season5["13"]);
    }
    return formatted == '' ? 'No ranks for current season' : formatted;
}

function old2newText(oldStats, newStats) {
    var message = ' \n';
    message += '-----------------------------\n';
    for (var playlist in oldStats) {
        var oldStat = oldStats[playlist];
        var newStat = newStats[playlist];
        var matchesPlayedSince = newStat["matchesPlayed"] - oldStat["matchesPlayed"];
        var pointsChange = newStat["rankPoints"] - oldStat["rankPoints"];
        message += playlist + ": ";
        if (matchesPlayedSince > 0) {
            message += 'You have ' + ((pointsChange > 0) ? 'gained' : 'lost') + ' ' + Math.abs(pointsChange) + ' points '
                + ' in ' + matchesPlayedSince + ' matches'
                + '\n';
        } else {
            message += ' No updates'
        }
        message += '\n';
    }
    return message;
}

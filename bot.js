var auth = false;
try {
    auth = require('./auth.json');
} catch (ex) {
    auth = false;
}
var properties = require('./properties.json');

var getAuth = function (type) {
    var token = '';
    if (type.toLowerCase() === 'discord') {
        token = (auth) ? auth.discord_token : process.env.DISCORD_TOKEN;
    } else if (type.toLowerCase() === 'rl') {
        token = (auth) ? auth.rl_token : process.env.RL_TOKEN;
    } else if (type.toLowerCase() === 'mongo') {
        token = (auth) ? auth.mongo_pass : process.env.MONGO_PASS;
    }
    return token;
};

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
    + properties.mongo_user + ":" + getAuth('mongo') + "@"
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
    token: getAuth('rl')
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
var currentSeason = process.env.CURRENT_SEASON;
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
    token: getAuth('discord'),
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
                                    "Standard": _seasonData["13"],
                                    "Solo": _seasonData["12"]
                                };
                                Season.findOne({'discordId': discordID}, function (err, _oldSeasonStats) {
                                    var oldSeasonStats = JSON.parse(JSON.stringify(_oldSeasonStats.data));
                                    if (!err) {
                                        bot.sendMessage({
                                            to: channelID,
                                            embed: {
                                                color: Color.GREEN,
                                                title: 'Updates for ' + user.name,
                                                description: old2newText(oldSeasonStats, newSeasonStats, argsLeft)
                                            }
                                        });
                                        _oldSeasonStats.data = newSeasonStats;
                                        _oldSeasonStats.save(function (err) {
                                            if (!err) {
                                                logger.error("Error saving stat");
                                            } else {
                                                logger.debug("season data added");
                                            }
                                        })
                                    } else {
                                        logger.error("Error finding season");
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
                                        title: user.name + "'s season " + currentSeason + " ranks",
                                        description: seasonRankToText(response, argsLeft)
                                    }
                                });
                                var _seasonData = response["rankedSeasons"][currentSeason];
                                var seasonData = {
                                    "Duel": _seasonData["10"],
                                    "Doubles": _seasonData["11"],
                                    "Standard": _seasonData["13"],
                                    "Solo": _seasonData["12"]
                                };
                                Season.findOneAndUpdate({'discordId': discordID},
                                    {"data": seasonData}, function (err, doc) {
                                        if (err) {
                                            logger.error("Couldnt update record");
                                        }
                                    });
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
                        getStats(args[1], platforms[args[2].toUpperCase()]).then(
                            function (data) {
                                var newUser = new User({
                                    "discordId": discordID,
                                    "steamId": data.uniqueId,
                                    "name": data.displayName,
                                    "platform": platforms[args[2].toUpperCase()]
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
    if (!obj) {
        return '';
    }
    return name + emojiForTier(obj.tier) + ' , div ' + (obj.division + 1) + " (" + obj.rankPoints + " mmr) " + '\n';
}

// If provided, let actions restrict the playlist by mentioning "1s" or "Doubles" etc in args.
var ALL_PLAYLISTS = ["10", "11", "12", "13"];
function parsePlaylistArgs(argsLeft) {
    var playlists = [];
    if (argsLeft.indexOf("Duel") > -1 || argsLeft.indexOf("1s") > -1) {
        playlists.push("10");
    }
    if (argsLeft.indexOf("Doubles") > -1 || argsLeft.indexOf("2s") > -1) {
        playlists.push("11");
    }
    if (argsLeft.indexOf("Solo") > -1) {
        playlists.push("12");
    }
    if (argsLeft.indexOf("Standard") > -1 || argsLeft.indexOf("3s") > -1) {
        playlists.push("13");
    }
    // If none provided, use all playlists.
    return playlists.length == 0 ? ALL_PLAYLISTS : playlists;
}

var FORMAT_START = '-----------------------------\n';
function seasonRankToText(playerData, argsLeft) {
    var currentSeasonData = playerData.rankedSeasons[currentSeason];
    var formatted = FORMAT_START;
    if (currentSeasonData) {
        var playlists = parsePlaylistArgs(argsLeft);
        if (playlists.indexOf("10") > -1) {
            formatted += rankOrEmpty("Duel: ", currentSeasonData["10"]);
        }
        if (playlists.indexOf("11") > -1) {
            formatted += rankOrEmpty("Doubles: ", currentSeasonData["11"]);
        }
        if (playlists.indexOf("12") > -1) {
            formatted += rankOrEmpty("Solo: ", currentSeasonData["12"]);
        }
        if (playlists.indexOf("13") > -1) {
            formatted += rankOrEmpty("Standard: ", currentSeasonData["13"]);
        }
    }
    if (formatted == FORMAT_START) {
        formatted += 'No ranks for current season';
    }
    return formatted;
}

function old2newText(oldStats, newStats, argsLeft) {
    var playlists = parsePlaylistArgs(argsLeft);

    var formatted = FORMAT_START;
    for (var playlist in oldStats) {
        if (playlists.indexOf(playlist) == -1) {
            continue;
        }
        var oldStat = oldStats[playlist];
        var newStat = newStats[playlist];
        var matchesPlayedSince = newStat["matchesPlayed"] - oldStat["matchesPlayed"];
        var pointsChange = newStat["rankPoints"] - oldStat["rankPoints"];
        if (matchesPlayedSince > 0) {
            formatted += playlist + ": "
                + 'You have ' + ((pointsChange > 0) ? 'gained' : 'lost') + ' ' + Math.abs(pointsChange) + ' points '
                + ' in ' + matchesPlayedSince + ' matches'
                + '\n';
        }
    }
    if (formatted == FORMAT_START) {
        formatted += 'No updates since last time';
    }
    return formatted;
}

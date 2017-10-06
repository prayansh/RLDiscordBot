var bot = require('../discordClient.js');

var consts = require('../consts.js');
var db = require('../db.js');
var formatting = require('../formatting.js');
var rlClient = require('../rlClient.js');

var logger = require('winston');

/**
 * Register command, !register <player ID> <platform name>
 * Used to map discord users to rocket league accounts.
 */
function run(discordName, discordID, channelID, message, evt, args) {
    if (!args[0] || !args[1]) {
        bot.sendMessage({
            to: channelID,
            message: "The usage is !register player-name platform"
        });
        return;
    }
    db.User.findOne({'discordId': discordID}, function (err, user) {
        // Oops, user already known.
        if (user) {
          bot.sendMessage({
              to: channelID,
              message: "User already registered as " + user.name
          });
          return;
        }

        logger.debug("Registering player=" + args[0] + ", platform=" + consts.Platforms[args[1]]);
        rlClient.getStats(args[0], consts.Platforms[args[1].toUpperCase()]).then(
            function (data) {
                var newUser = new User({
                    "discordId": discordID,
                    "steamId": data.uniqueId,
                    "name": data.displayName,
                    "platform": consts.Platforms[args[1].toUpperCase()]
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
                // Remap RL Client seasons to our seasons:
                var rlClientData = data["rankedSeasons"][consts.CurrentSeason];
                var seasonData = {
                    "Duel": rlClientData["10"],
                    "Doubles": rlClientData["11"],
                    "Standard": rlClientData["13"],
                    "Solo": rlClientData["12"]
                };
                var newSeasonStat = new Season({
                    "discordId": discordID,
                    "data": seasonData
                });
                newSeasonStat.save(function (err) {
                    logger.debug("season data added");
                });
            },
            function (err) {
                bot.sendMessage({
                    to: channelID,
                    embed: {
                        color: consts.Color.RED,
                        title: 'Registration Failed',
                        description: "Cannot find player " + args[0] + " for platform " + args[1]
                    }
                });
            });
    });
}

module.exports = {
  run: run
};

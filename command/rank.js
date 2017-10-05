var consts = require('../consts.js');
var db = require('../db.js');
var formatting = require('../formatting.js');
var rlClient = require('../rlClient.js');

var logger = require('winston');

function run(discordName, discordID, channelID, message, evt) {
    db.User.findOne({'discordId': discordID}, function (err, user) {
        if (!user) {
            bot.sendMessage({
                to: channelID,
                message: "No user with name=" + queryParam + " found"
            });
            return;
        }

        logger.debug("Getting update for " + user.name);
        rlClient.getStats(user.steamId, user.platform).then(
            function (response) {
                // Remap RL Client seasons to our seasons:
                var rlClientData = response["rankedSeasons"][consts.CurrentSeason];
                var seasonData = {
                    "Duel": rlClientData["10"],
                    "Doubles": rlClientData["11"],
                    "Standard": rlClientData["13"],
                    "Solo": rlClientData["12"]
                };
                bot.sendMessage({
                    to: channelID,
                    embed: {
                        color: consts.Color.GREEN,
                        title: user.name + "'s season " + currentSeason + " ranks",
                        description: formatting.seasonRankToText(seasonData, argsLeft)
                    }
                });
                db.Season.findOneAndUpdate({'discordId': discordID},
                    {"data": seasonData}, function (err, doc) {
                        if (err) {
                            logger.error("Couldnt update record");
                        }
                    });
            });
    });
}

module.exports = {
  run: run
};

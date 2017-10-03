var consts = require('../consts.js');
var db = require('../db.js');

var logger = require('winston');


function run(discordName, discordID, channelID, message, evt) {
    db.User.findOne({'discordId': discordID}, function (err, user) {
        if (user) {
            logger.debug("Getting update for " + user.name);
            getStats(user.steamId, user.platform).then(
                function (response) {
                    var _seasonData = response["rankedSeasons"][currentSeason];
                    var seasonData = {
                        "Duel": _seasonData["10"],
                        "Doubles": _seasonData["11"],
                        "Standard": _seasonData["13"],
                        "Solo": _seasonData["12"]
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
        }
        else {
            bot.sendMessage({
                to: channelID,
                message: "No user with name=" + queryParam + " found"
            });
        }
    });
}

module.exports = {
  run: run
}

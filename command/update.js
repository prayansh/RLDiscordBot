var consts = require('../consts.js');
var db = require('../db.js');
var formatting = require('../formatting.js');
var rlClient = require('../rlClient.js');

var logger = require('winston');

/**
 * Update command, !update <optional playlists>
 * Shows the change between now and last time stats were fetched.
 */
function run(discordName, discordID, message, args, onComplete) {
    db.User.findOne({'discordId': discordID}, function (err, user) {
        if (!user) {
            message.channel.send("No user with name=" + discordName + " found");
            onComplete();
            return;
        }

        logger.debug("Getting rank for " + user.name);
        rlClient.getStats(user.steamId, user.platform).then(
            function (response) {
                // Remap RL Client seasons to our seasons:
                var rlClientData = response["rankedSeasons"][consts.CurrentSeason];
                var newSeasonStats = {
                    "Duel": rlClientData["10"],
                    "Doubles": rlClientData["11"],
                    "Standard": rlClientData["13"],
                    "Solo": rlClientData["12"]
                };
                db.Season.findOne({'discordId': discordID}, function (err, _oldSeasonStats) {
                    var oldSeasonStats = JSON.parse(JSON.stringify(_oldSeasonStats.data));
                    if (!err) {
                        message.channel.send({
                            embed: {
                                color: consts.Color.GREEN,
                                title: 'Updates for ' + user.name,
                                description: formatting.old2newText(oldSeasonStats, newSeasonStats, args)
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
                    onComplete();
                });

            }, onComplete);
    });
}

module.exports = {
    run: run
};

var bot = require('../discordClient.js');

var consts = require('../consts.js');
var db = require('../db.js');
var formatting = require('../formatting.js');
var rlClient = require('../rlClient.js');

var logger = require('winston');

/**
 * Ladder command, !ladder <playlist>
 * Finds all ranked people in the playlist, and shows their cached results them in order.
 */
function run(discordName, discordID, channelID, message, evt, args) {
    var playlists = formatting.parsePlaylistArgs(args);
    if (playlists.length != 1) {
        bot.sendMessage({
            to: channelID,
            message: "A single playlist must be provided."
        });
        return;
    }
    var rankedUsers = [];
    var playlist = playlists[0];
    // First step, load all the cached results.
    // Note: This doesn't fetch new ranks, so they may be stale.
    db.Season.find(function (err, users) {
        if (err) {
            logger.error("Error loading ranks.");
            return;
        }
        for (var user of users) {
            // Filter only for those ranked in the playlist.
            if (user.data && user.data[playlist] && user.data[playlist].hasOwnProperty('rankPoints')) {
                rankedUsers.push({
                    'id': user.discordId,
                    'data': user.data[playlist]
                });
            }
        }
        rankedUsers.sort(function (a, b) { return b.data.rankPoints - a.data.rankPoints; })
        // Next step, load users to get their names.
        db.User.find(function (err, users) {
            if (err) {
                logger.error("Error loading users.");
                return;
            }
            var userMap = {};
            for (user of users) {
              userMap[user.discordId] = user;
            }
            for (rank of rankedUsers) {
              rank['user'] = userMap[rank['id']].name;
            }
            // ...and finally, format the ordered version.
            var message = formatting.ladderToText(rankedUsers);
            bot.sendMessage({
                to: channelID,
                embed: {
                    color: consts.Color.GREEN,
                    title: "Current ladder for " + playlist + ": ",
                    description: message
                }
            });
        });
    });

}

module.exports = {
  run: run
};
